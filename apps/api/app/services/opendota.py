from collections import defaultdict

import httpx

from app.schemas import PlayerHero, PlayerResponse
from app.settings import get_settings

OPENDOTA_BASE = "https://api.opendota.com/api"


async def _get(path: str, params: dict | None = None) -> object:
    settings = get_settings()
    query = dict(params or {})
    if settings.opendota_key:
        query["api_key"] = settings.opendota_key
    async with httpx.AsyncClient(base_url=OPENDOTA_BASE, timeout=10.0) as client:
        res = await client.get(path, params=query)
        res.raise_for_status()
        return res.json()


async def fetch_recent_matches(account_id: int) -> list[dict]:
    """Recent matches for a 32-bit account id (OpenDota)."""
    data = await _get(f"/players/{account_id}/recentMatches")
    return data if isinstance(data, list) else []


async def search_players(query: str) -> list[dict]:
    """Search players by persona name (OpenDota /search)."""
    data = await _get("/search", params={"q": query})
    return data if isinstance(data, list) else []


async def fetch_heroes() -> list[dict]:
    """Hero constants (OpenDota /heroes): includes numeric id + localized_name."""
    data = await _get("/heroes")
    return data if isinstance(data, list) else []


async def fetch_hero_stats() -> list[dict]:
    """Per-hero pick/win by rank bracket (OpenDota /heroStats), for tier computation."""
    data = await _get("/heroStats")
    return data if isinstance(data, list) else []


async def fetch_matchups(hero_id: int) -> list[dict]:
    """This hero's head-to-head record vs every other hero (OpenDota)."""
    data = await _get(f"/heroes/{hero_id}/matchups")
    return data if isinstance(data, list) else []


def summarize_player(account_id: int, matches: list[dict]) -> PlayerResponse:
    """Aggregate recent matches into an overview + top heroes. Pure / testable."""
    per_hero: dict[int, list[int]] = defaultdict(lambda: [0, 0])  # hero_id -> [games, wins]
    wins = 0
    for m in matches:
        hero_id = int(m.get("hero_id", 0))
        slot = int(m.get("player_slot", 0))
        is_radiant = slot < 128
        won = is_radiant == bool(m.get("radiant_win"))
        per_hero[hero_id][0] += 1
        if won:
            per_hero[hero_id][1] += 1
            wins += 1

    top = sorted(
        (
            PlayerHero(hero_id=h, games=g, wins=w, win_rate=(w / g if g else 0.0))
            for h, (g, w) in per_hero.items()
        ),
        key=lambda x: (x.games, x.win_rate),
        reverse=True,
    )[:8]

    n = len(matches)
    return PlayerResponse(
        account_id=account_id,
        match_count=n,
        win_rate=(wins / n if n else 0.0),
        top_heroes=top,
    )
