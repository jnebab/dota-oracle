"""Draft Oracle API.

Routes are prefixed with ``/api`` because in production Vercel routes ``/api/*``
to this serverless function. M4 adds ``/api/live/{handle}``; M5 adds the
cron-triggered meta refresh.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import meta, player
from app.settings import get_settings

app = FastAPI(title="Draft Oracle API", version="0.1.0")

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(player.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
