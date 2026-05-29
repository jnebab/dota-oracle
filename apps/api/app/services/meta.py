import json
from functools import lru_cache
from pathlib import Path

import httpx

from app.schemas import MetaResponse, MetaTierOut
from app.services import redis
from app.services.meta_refresh import META_KEY

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@lru_cache
def _load_seed(patch: str) -> dict:
    path = _DATA_DIR / f"meta.{patch}.json"
    if not path.exists():
        raise FileNotFoundError(f"No meta snapshot for patch {patch!r}")
    return json.loads(path.read_text(encoding="utf-8"))


async def _load_computed() -> dict | None:
    """Return the cron-computed snapshot from Redis, or None if unavailable."""
    try:
        raw = await redis.get(META_KEY)
    except (redis.RedisNotConfigured, httpx.HTTPError):
        return None
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def get_meta(patch: str, bracket: str | None = None) -> MetaResponse:
    """Serve the meta snapshot.

    Prefers the cron-computed snapshot in Redis (M5); falls back to the bundled
    seed JSON for the patch. Bracket is echoed back; the overlay is applied
    client-side by the engine.
    """
    snapshot = await _load_computed()
    if snapshot is None:
        snapshot = _load_seed(patch)  # raises FileNotFoundError → 404 upstream

    tiers = [
        MetaTierOut(hero_id=hero_id, tier=entry["tier"], note=entry["note"])
        for hero_id, entry in snapshot["tiers"].items()
    ]
    return MetaResponse(
        patch=snapshot.get("patch", patch),
        bracket=bracket,
        source=snapshot.get("source", "seed"),
        tiers=tiers,
    )
