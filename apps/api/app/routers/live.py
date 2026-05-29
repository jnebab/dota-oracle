import logging

import httpx
from fastapi import APIRouter, HTTPException

from app.schemas import LiveMatchResponse, LivePlayer
from app.services import opendota, stratz
from app.services.heroes import hero_slug_map
from app.services.steamid import to_account_id

router = APIRouter()
log = logging.getLogger("dota_oracle.live")


async def resolve_account_id(handle: str) -> int:
    """Resolve a handle to a 32-bit account id: numeric → steamid math, else name search."""
    try:
        return to_account_id(handle)
    except ValueError:
        pass  # not numeric → fall through to a name search

    try:
        results = await opendota.search_players(handle)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="player search (OpenDota) failed") from exc

    account_id = results[0].get("account_id") if results else None
    if not isinstance(account_id, int):
        raise HTTPException(status_code=404, detail="no player matches that name")
    return account_id


@router.get("/api/live/{handle}", response_model=LiveMatchResponse)
async def live(handle: str) -> LiveMatchResponse:
    """Resolve a player and return their current live match, mapped onto hero slugs."""
    account_id = await resolve_account_id(handle)

    try:
        match = await stratz.fetch_live_match(account_id)
    except stratz.StratzNotConfigured as exc:
        raise HTTPException(status_code=503, detail="STRATZ token not configured") from exc
    except stratz.StratzError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        detail = f"STRATZ returned HTTP {exc.response.status_code}"
        raise HTTPException(status_code=502, detail=detail) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"STRATZ request failed: {exc}") from exc

    if not match:
        raise HTTPException(status_code=404, detail="no live match for that player right now")

    try:
        slug_by_id = await hero_slug_map()
    except httpx.HTTPError:
        log.warning("hero constants fetch failed; returning numeric hero ids only")
        slug_by_id = {}

    players: list[LivePlayer] = []
    radiant: list[str] = []
    dire: list[str] = []
    searched_is_radiant: bool | None = None

    for p in match.get("players", []) or []:
        raw_hero = p.get("heroId")
        hero_id = raw_hero if isinstance(raw_hero, int) else 0
        is_radiant = bool(p.get("isRadiant"))
        slug = slug_by_id.get(hero_id)
        players.append(LivePlayer(hero_id=hero_id, hero=slug, is_radiant=is_radiant))
        if slug:
            (radiant if is_radiant else dire).append(slug)
        if p.get("steamAccountId") == account_id:
            searched_is_radiant = is_radiant

    return LiveMatchResponse(
        match_id=match.get("matchId"),
        game_time=int(match.get("gameTime") or 0),
        searched_account_id=account_id,
        searched_is_radiant=searched_is_radiant,
        radiant=radiant,
        dire=dire,
        players=players,
    )
