from fastapi import APIRouter, HTTPException, Query

from app.schemas import MetaResponse
from app.services.meta import get_meta
from app.settings import get_settings

router = APIRouter()


@router.get("/api/meta", response_model=MetaResponse)
def meta(
    patch: str | None = Query(default=None),
    bracket: str | None = Query(default=None),
) -> MetaResponse:
    """Serve the meta snapshot for a patch (seed for now; computed in M5)."""
    settings = get_settings()
    try:
        return get_meta(patch or settings.default_patch, bracket)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
