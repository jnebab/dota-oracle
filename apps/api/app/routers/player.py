import httpx
from fastapi import APIRouter, HTTPException

from app.schemas import PlayerResponse
from app.services import opendota
from app.services.steamid import to_account_id

router = APIRouter()


@router.get("/api/player/{handle}", response_model=PlayerResponse)
async def player(handle: str) -> PlayerResponse:
    """Recent-match overview + top heroes for a SteamID64 or 32-bit account id."""
    try:
        account_id = to_account_id(handle)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="handle must be a numeric SteamID64 or 32-bit account id",
        ) from exc

    try:
        matches = await opendota.fetch_recent_matches(account_id)
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status == 404:
            raise HTTPException(status_code=404, detail="player not found") from exc
        raise HTTPException(status_code=502, detail="OpenDota request failed") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="OpenDota unreachable") from exc

    return opendota.summarize_player(account_id, matches)
