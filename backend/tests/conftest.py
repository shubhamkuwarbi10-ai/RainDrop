"""Shared test configuration.

Secrets are set before anything imports app.core.config, so the tests run
against a deterministic session key rather than the random development one.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT))

os.environ.setdefault("RAINDROP_ENV", "development")
os.environ.setdefault("RAINDROP_SESSION_SECRET", "test-secret-not-used-anywhere-real")
os.environ.setdefault("RAINDROP_INGEST_KEY", "test-ingest-key")

import pytest  # noqa: E402


@pytest.fixture
def operator():
    from app.core.security import Operator
    return Operator(
        username="test.ops",
        display_name="Test Control Room",
        role="operator",
        cities=("chennai", "mumbai"),
    )
