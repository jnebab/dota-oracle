"""Draft Oracle API.

Routes are prefixed with ``/api`` because in production Vercel routes ``/api/*``
to this serverless function. M4 adds ``/api/live/{handle}``; M5 adds the
cron-triggered meta refresh.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import cron, meta, player, recent
from app.settings import get_settings

log = logging.getLogger("dota_oracle")

app = FastAPI(title="Draft Oracle API", version="0.1.0")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return the real error instead of a bare 500 so failures are diagnosable."""
    log.exception("unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": f"{type(exc).__name__}: {exc}"})

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(player.router)
app.include_router(recent.router)
app.include_router(cron.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
