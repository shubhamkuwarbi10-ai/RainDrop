"""Operator sign-in for the city control room.

Citizens use the public read-only endpoints with no account. Everything that
dispatches resources or changes operational state sits behind these sessions.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from app.core import config
from app.core.security import (
    Operator,
    authenticate,
    current_operator,
    issue_session,
    operator_count,
    require_operator,
)

router = APIRouter(prefix="/api/auth", tags=["operator-auth"])

# In-process throttle. One backend replica is the current deployment shape; move
# this to Redis before running more than one.
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 300
_attempts: dict[str, deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _throttle(request: Request) -> None:
    now = time.time()
    bucket = _attempts[_client_key(request)]
    while bucket and now - bucket[0] > _WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= _MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many sign-in attempts. Try again in a few minutes.",
        )


def _record_failure(request: Request) -> None:
    _attempts[_client_key(request)].append(time.time())


def _clear_failures(request: Request) -> None:
    _attempts.pop(_client_key(request), None)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


class OperatorProfile(BaseModel):
    username: str
    display_name: str
    role: str
    cities: list[str]


def _profile(operator: Operator) -> OperatorProfile:
    return OperatorProfile(
        username=operator.username,
        display_name=operator.display_name,
        role=operator.role,
        cities=list(operator.cities),
    )


@router.get("/status")
def auth_status(operator: Operator | None = Depends(current_operator)) -> dict:
    """Tell the client whether anyone is signed in, and whether login is set up."""
    return {
        "authenticated": operator is not None,
        "operator": _profile(operator).model_dump() if operator else None,
        "accounts_configured": operator_count() > 0,
    }


@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response) -> dict:
    _throttle(request)
    operator = authenticate(payload.username, payload.password)
    if operator is None:
        _record_failure(request)
        # One message for both cases: never reveal which usernames exist.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )
    _clear_failures(request)
    token, ttl_seconds = issue_session(operator)
    response.set_cookie(
        key=config.SESSION_COOKIE_NAME,
        value=token,
        max_age=ttl_seconds,
        httponly=True,
        samesite="strict",
        secure=config.SESSION_COOKIE_SECURE,
        path="/",
    )
    return {
        "authenticated": True,
        "operator": _profile(operator).model_dump(),
        "expires_in_seconds": ttl_seconds,
    }


@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(config.SESSION_COOKIE_NAME, path="/")
    return {"authenticated": False}


@router.get("/me", response_model=OperatorProfile)
def whoami(operator: Operator = Depends(require_operator)) -> OperatorProfile:
    return _profile(operator)
