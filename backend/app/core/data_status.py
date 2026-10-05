"""The provenance vocabulary every API response must carry.

One field, three values, no exceptions. If a number reaches the user without a
`data_status`, the user cannot tell a measurement from a placeholder — which was
the single largest honesty problem in the pre-review build.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

DataStatus = Literal["live", "heuristic", "demo", "unavailable"]

LIVE = "live"
HEURISTIC = "heuristic"
DEMO = "demo"
UNAVAILABLE = "unavailable"

_DESCRIPTIONS = {
    LIVE: "Observed or forecast values retrieved from an external data provider.",
    HEURISTIC: "Derived from a documented formula, not from a validated trained model.",
    DEMO: "Fixed sample content for demonstration. Not derived from any live input.",
    UNAVAILABLE: "No trustworthy value could be produced for this request.",
}


def describe(status: str) -> str:
    return _DESCRIPTIONS.get(status, _DESCRIPTIONS[UNAVAILABLE])


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def envelope(
    status: str,
    *,
    method: str,
    observed_at: str | None = None,
    caveats: list[str] | None = None,
    **extra: Any,
) -> dict[str, Any]:
    """Build the provenance block that gets merged into a response body.

    `method` names what actually produced the numbers, in words a judge or an
    operator can check against the code. `observed_at` is the time of the input
    data, never the time the response was rendered.
    """
    block: dict[str, Any] = {
        "data_status": status,
        "data_status_description": describe(status),
        "method": method,
        "generated_at": utc_now_iso(),
        "observed_at": observed_at,
        "caveats": caveats or [],
    }
    block.update(extra)
    return block


# Caveats that recur across endpoints; defined once so the wording cannot drift.
HEURISTIC_DEPTH_CAVEAT = (
    "Flood depth comes from a published rational-method formula, not from a model "
    "validated against observed floods. Treat it as an order-of-magnitude estimate."
)
NO_TRAINED_MODEL_CAVEAT = (
    "No validated surrogate model artefact is installed, so the heuristic fallback is in use."
)
NOT_AN_OFFICIAL_WARNING = (
    "Model estimate. Not an official IMD or NDMA warning."
)
SCHEMATIC_NETWORK_CAVEAT = (
    "Drainage layout is schematic, derived from terrain, not from a surveyed municipal asset register."
)
