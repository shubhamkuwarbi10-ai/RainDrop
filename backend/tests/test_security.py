"""Authentication, session integrity and authorisation."""
import time

import pytest
from fastapi import HTTPException

from app.core import security


class TestPasswordHashing:
    def test_round_trip(self):
        encoded = security.hash_password("a-long-enough-password")
        assert security.verify_password("a-long-enough-password", encoded)

    def test_rejects_wrong_password(self):
        encoded = security.hash_password("a-long-enough-password")
        assert not security.verify_password("a-long-enough-passwore", encoded)

    def test_salt_makes_hashes_differ(self):
        """Two accounts with the same password must not share a hash."""
        first = security.hash_password("identical-password-here")
        second = security.hash_password("identical-password-here")
        assert first != second

    def test_plaintext_is_never_stored(self):
        encoded = security.hash_password("sentinel-password-value")
        assert "sentinel-password-value" not in encoded

    def test_short_passwords_are_refused(self):
        with pytest.raises(ValueError):
            security.hash_password("short")

    @pytest.mark.parametrize("corrupt", ["", "not-a-hash", "pbkdf2_sha256$x$y$z", "md5$1$a$b"])
    def test_malformed_hashes_fail_closed(self, corrupt):
        assert not security.verify_password("anything", corrupt)


class TestSessionTokens:
    def test_round_trip_preserves_identity(self, operator):
        token, ttl = security.issue_session(operator)
        restored = security.read_session(token)
        assert ttl > 0
        assert restored.username == operator.username
        assert restored.cities == operator.cities

    @pytest.mark.parametrize("mutate", [
        lambda t: t + "x",                       # corrupted signature
        lambda t: t.split(".")[0],               # signature removed
        lambda t: "x" + t,                       # corrupted payload
        lambda t: t.replace(".", ".x", 1),       # signature prefixed
    ])
    def test_tampered_tokens_are_rejected(self, operator, mutate):
        token, _ = security.issue_session(operator)
        assert security.read_session(mutate(token)) is None

    def test_payload_cannot_be_rewritten_without_the_key(self, operator):
        """Editing the claims invalidates the signature.

        The payload is base64, not encrypted, so anyone can read it. The point
        is that nobody can change 'cities' and still be accepted.
        """
        import base64
        import json

        token, _ = security.issue_session(operator)
        body, _, signature = token.partition(".")
        claims = json.loads(security._unb64url(body))
        claims["cities"] = ["*"]
        forged_body = base64.urlsafe_b64encode(
            json.dumps(claims, separators=(",", ":")).encode()
        ).decode().rstrip("=")
        assert security.read_session(f"{forged_body}.{signature}") is None

    def test_expired_tokens_are_rejected(self, operator, monkeypatch):
        token, _ = security.issue_session(operator)
        # Capture the real clock first: calling time.time() inside the
        # replacement would recurse into itself.
        far_future = time.time() + 10**7
        monkeypatch.setattr(time, "time", lambda: far_future)
        assert security.read_session(token) is None

    def test_empty_input(self):
        assert security.read_session(None) is None
        assert security.read_session("") is None


class TestAuthorisation:
    def test_city_scope_is_enforced(self, operator):
        assert operator.may_act_on("chennai")
        assert operator.may_act_on("Mumbai")      # case-insensitive
        assert not operator.may_act_on("delhi")   # not granted

    def test_wildcard_grants_every_city(self):
        supervisor = security.Operator("boss", "Boss", "supervisor", ("*",))
        assert supervisor.may_act_on("kolkata")

    def test_require_city_access_raises_403(self, operator):
        with pytest.raises(HTTPException) as caught:
            security.require_city_access(operator, "delhi")
        assert caught.value.status_code == 403

    def test_require_operator_raises_401_without_a_session(self):
        with pytest.raises(HTTPException) as caught:
            security.require_operator(None)
        assert caught.value.status_code == 401


class TestApiKey:
    def _request(self, headers):
        class FakeRequest:
            def __init__(self, headers):
                self.headers = headers
        return FakeRequest(headers)

    def test_correct_key_is_accepted(self, monkeypatch):
        monkeypatch.setattr(security.config, "INGEST_API_KEY", "the-real-key")
        assert security.require_api_key(self._request({"x-api-key": "the-real-key"})) == "the-real-key"

    @pytest.mark.parametrize("headers", [{}, {"x-api-key": ""}, {"x-api-key": "wrong"}])
    def test_missing_or_wrong_key_raises_401(self, monkeypatch, headers):
        monkeypatch.setattr(security.config, "INGEST_API_KEY", "the-real-key")
        with pytest.raises(HTTPException) as caught:
            security.require_api_key(self._request(headers))
        assert caught.value.status_code == 401

    def test_unconfigured_key_disables_writes_rather_than_allowing_them(self, monkeypatch):
        """An unset key must close the endpoint, never open it."""
        monkeypatch.setattr(security.config, "INGEST_API_KEY", "")
        with pytest.raises(HTTPException) as caught:
            security.require_api_key(self._request({"x-api-key": "anything"}))
        assert caught.value.status_code == 503
