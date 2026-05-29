import httpx
from fastapi import APIRouter, Header, HTTPException

from app.services import meta_refresh, redis
from app.settings import get_settings

router = APIRouter()


def _authorize(authorization: str | None) -> None:
    """Require the Bearer CRON_SECRET when one is configured.

    Vercel Cron automatically sends ``Authorization: Bearer $CRON_SECRET`` when
    the env var is set. If no secret is configured the endpoint stays open
    (handy locally) — set CRON_SECRET in production to lock it down.
    """
    secret = get_settings().cron_secret
    if secret and authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="unauthorized")


async def _run() -> dict:
    try:
        snapshot = await meta_refresh.refresh_meta()
    except redis.RedisNotConfigured as exc:
        raise HTTPException(status_code=503, detail="Redis not configured") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="meta refresh failed upstream") from exc
    return {
        "status": "ok",
        "heroes": len(snapshot["tiers"]),
        "generated_at": snapshot["generated_at"],
    }


@router.get("/api/cron/refresh-meta")
async def refresh_meta_get(authorization: str | None = Header(default=None)) -> dict:
    """Cron entrypoint (Vercel Cron issues a GET)."""
    _authorize(authorization)
    return await _run()


@router.post("/api/cron/refresh-meta")
async def refresh_meta_post(authorization: str | None = Header(default=None)) -> dict:
    """Manual trigger."""
    _authorize(authorization)
    return await _run()
