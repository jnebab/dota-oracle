import json
from functools import lru_cache
from pathlib import Path

from app.schemas import MetaResponse, MetaTierOut

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@lru_cache
def _load_snapshot(patch: str) -> dict:
    path = _DATA_DIR / f"meta.{patch}.json"
    if not path.exists():
        raise FileNotFoundError(f"No meta snapshot for patch {patch!r}")
    return json.loads(path.read_text(encoding="utf-8"))


def get_meta(patch: str, bracket: str | None = None) -> MetaResponse:
    """Serve the seed meta snapshot for a patch.

    Bracket is echoed back for now; the bracket overlay is applied client-side
    by the engine. M5 replaces this seed with a computed, auto-refreshed snapshot.
    """
    snapshot = _load_snapshot(patch)
    tiers = [
        MetaTierOut(hero_id=hero_id, tier=entry["tier"], note=entry["note"])
        for hero_id, entry in snapshot["tiers"].items()
    ]
    return MetaResponse(
        patch=snapshot["patch"],
        bracket=bracket,
        source=snapshot.get("source", "seed"),
        tiers=tiers,
    )
