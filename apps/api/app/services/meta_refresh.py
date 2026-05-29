import json
from datetime import UTC, datetime

from app.services import opendota, redis
from app.services.heroes import slugify
from app.settings import get_settings

# Where the computed snapshot lives in Redis.
META_KEY = "meta:current"

# Percentile cut-offs (top of band) → tier. Heroes are ranked by win rate desc.
_BANDS = [(0.10, "S"), (0.30, "A"), (0.70, "B"), (0.90, "C"), (1.01, "D")]


def _picks_wins(hero: dict) -> tuple[int, int]:
    """Sum picks/wins across the 8 rank brackets in an OpenDota heroStats row."""
    picks = wins = 0
    for i in range(1, 9):
        picks += int(hero.get(f"{i}_pick") or 0)
        wins += int(hero.get(f"{i}_win") or 0)
    return picks, wins


def compute_tiers(hero_stats: list[dict], min_picks: int = 1000) -> dict[str, dict]:
    """Rank heroes by pub win rate and bucket them into S/A/B/C/D tiers.

    Pure and deterministic given the input. Heroes below ``min_picks`` are
    dropped so tiny samples don't skew the bands.
    """
    rows: list[tuple[str, float]] = []
    for hero in hero_stats:
        name = hero.get("localized_name")
        if not isinstance(name, str):
            continue
        picks, wins = _picks_wins(hero)
        if picks < min_picks:
            continue
        rows.append((slugify(name), wins / picks))

    rows.sort(key=lambda r: r[1], reverse=True)
    n = len(rows)
    tiers: dict[str, dict] = {}
    for idx, (slug, wr) in enumerate(rows):
        quantile = idx / n if n else 0.0
        tier = next(t for cut, t in _BANDS if quantile < cut)
        tiers[slug] = {"tier": tier, "note": f"auto · {wr * 100:.1f}% win rate"}
    return tiers


async def refresh_meta() -> dict:
    """Pull current hero win-rates, recompute tiers, and store the snapshot in Redis."""
    settings = get_settings()
    stats = await opendota.fetch_hero_stats()
    tiers = compute_tiers(stats)
    snapshot = {
        "patch": settings.default_patch,
        "source": "computed",
        "generated_at": datetime.now(UTC).isoformat(),
        "tiers": tiers,
    }
    await redis.set(META_KEY, json.dumps(snapshot))
    return snapshot
