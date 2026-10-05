"""Authentication and authorisation primitives.

Two independent mechanisms:

* ``require_api_key``  - a shared secret for machine-to-machine ingest and
  processing routes. Suitable for the pipeline jobs that POST data.
* ``require_operator`` - a per-person session for the city control-room console.
  Operators are scoped to the cities they may act on.

Both use only the standard library (hashlib, hmac, secrets) so the deployment
has no extra crypto dependency to pin, audit or keep patched. PBKDF2-HMAC-SHA256
at 600k iterations follows the OWASP 2023 password-storage guidance; swap in
Argon2id if the deployment can carry the dependency.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass
from typing import Any

from fastapi import Depends, HTTPException, Request, status

from app.core import config
from app.core.paths import OPERATORS_FILE

PBKDF2_ITERATIONS = 600_000
_PBKDF2_PREFIX = "pbkdf2_sha256"


# --------------------------------------------------------------------------
# Password hashing
# --------------------------------------------------------------------------

def hash_password(password: str, *, iterations: int = PBKDF2_ITERATIONS) -> str:
    """Return a self-describing algorithm/iterations/salt/hash string."""
    if len(password) < 12:
        raise ValueError("Operator passwords must be at least 12 characters.")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return "$".join([
        _PBKDF2_PREFIX,
        str(iterations),
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(digest).decode("ascii"),
    ])


def verify_password(password: str, encoded: str) -> bool:
    """Constant-time check of a password against a stored hash."""
    try:
        algorithm, raw_iterations, raw_salt, raw_digest = encoded.split("$")
        if algorithm != _PBKDF2_PREFIX:
            return False
        expected = base64.b64decode(raw_digest)
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            base64.b64decode(raw_salt),
            int(raw_iterations),
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate, expected)


# --------------------------------------------------------------------------
# Operator store
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class Operator:
    username: str
    display_name: str
    role: str
    cities: tuple[str, ...]

    def may_act_on(self, city: str) -> bool:
        return "*" in self.cities or (city or "").strip().lower() in self.cities


def _load_store() -> dict[str, Any]:
    if not OPERATORS_FILE.is_file():
        return {"operators": []}
    try:
        return json.loads(OPERATORS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"operators": []}


def _save_store(store: dict[str, Any]) -> None:
    OPERATORS_FILE.parent.mkdir(parents=True, exist_ok=True)
    OPERATORS_FILE.write_text(json.dumps(store, indent=2), encoding="utf-8")
    try:
        os.chmod(OPERATORS_FILE, 0o600)
    except OSError:
        # Windows and some mounted volumes do not support POSIX modes.
        pass


def upsert_operator(
    username: str,
    password: str,
    *,
    display_name: str,
    role: str = "operator",
    cities: tuple[str, ...] = config.FOCUS_CITIES,
) -> Operator:
    """Create or replace an operator account. Used by the admin CLI only."""
    username = (username or "").strip().lower()
    if not username:
        raise ValueError("Username cannot be empty.")
    store = _load_store()
    record = {
        "username": username,
        "display_name": display_name,
        "role": role,
        "cities": [city.strip().lower() for city in cities],
        "password_hash": hash_password(password),
    }
    others = [entry for entry in store.get("operators", []) if entry.get("username") != username]
    store["operators"] = others + [record]
    _save_store(store)
    return Operator(username, display_name, role, tuple(record["cities"]))


def authenticate(username: str, password: str) -> Operator | None:
    """Return the operator when the credentials match, else None.

    A missing username still runs a PBKDF2 round against a dummy hash so the
    response time does not reveal whether the account exists.
    """
    username = (username or "").strip().lower()
    record = next(
        (entry for entry in _load_store().get("operators", []) if entry.get("username") == username),
        None,
    )
    if record is None:
        verify_password(password or "", hash_password("placeholder-not-real", iterations=1000))
        return None
    if not verify_password(password or "", record.get("password_hash", "")):
        return None
    return Operator(
        username=record["username"],
        display_name=record.get("display_name", record["username"]),
        role=record.get("role", "operator"),
        cities=tuple(record.get("cities", ())),
    )


def operator_count() -> int:
    return len(_load_store().get("operators", []))


# --------------------------------------------------------------------------
# Session tokens
# --------------------------------------------------------------------------

def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _unb64url(raw: str) -> bytes:
    return base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))


def issue_session(operator: Operator) -> tuple[str, int]:
    """Return an HMAC-signed payload.signature token and its lifetime."""
    ttl_seconds = config.SESSION_TTL_MINUTES * 60
    payload = {
        "sub": operator.username,
        "name": operator.display_name,
        "role": operator.role,
        "cities": list(operator.cities),
        "exp": int(time.time()) + ttl_seconds,
    }
    body = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(config.SESSION_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
    return f"{body}.{_b64url(signature)}", ttl_seconds


def read_session(token: str | None) -> Operator | None:
    if not token or "." not in token:
        return None
    body, _, signature = token.partition(".")
    expected = hmac.new(config.SESSION_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
    try:
        if not hmac.compare_digest(_unb64url(signature), expected):
            return None
        payload = json.loads(_unb64url(body))
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
    if int(payload.get("exp", 0)) < time.time():
        return None
    return Operator(
        username=payload.get("sub", ""),
        display_name=payload.get("name", ""),
        role=payload.get("role", "operator"),
        cities=tuple(payload.get("cities", ())),
    )


# --------------------------------------------------------------------------
# FastAPI dependencies
# --------------------------------------------------------------------------

def require_api_key(request: Request) -> str:
    """Guard machine-to-machine write routes with a shared secret."""
    if not config.INGEST_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Write endpoints are disabled: RAINDROP_INGEST_KEY is not configured.",
        )
    presented = request.headers.get("x-api-key", "")
    if not presented or not hmac.compare_digest(presented, config.INGEST_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid X-API-Key header is required for this endpoint.",
        )
    return presented


def current_operator(request: Request) -> Operator | None:
    """Resolve the session from the cookie, or from a bearer token."""
    token = request.cookies.get(config.SESSION_COOKIE_NAME)
    if not token:
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
    return read_session(token)


def require_operator(operator: Operator | None = Depends(current_operator)) -> Operator:
    """Guard the control-room console. 401 when there is no valid session."""
    if operator is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operator sign-in required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return operator


def require_city_access(operator: Operator, city: str) -> None:
    if not operator.may_act_on(city):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is not authorised to act on {city}.",
        )
