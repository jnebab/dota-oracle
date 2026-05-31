import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services import matchups

router = APIRouter()


@router.get("/api/matchups")
async def matchups_route(
    vs: str = Query(description="comma-separated enemy hero slugs"),
) -> dict[str, dict[str, float]]:
    """Win-rate advantage of every hero against each enemy on the board.

    Returns ``{enemySlug: {candidateSlug: advantage}}`` for the engine to fold
    into scoring. Empty object when nothing resolves.
    """
    slugs = [s.strip() for s in vs.split(",") if s.strip()]
    if not slugs:
        return {}
    try:
        return await matchups.get_matchups(slugs)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="matchup lookup (OpenDota) failed") from exc
