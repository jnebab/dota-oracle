"""Draft Oracle API.

Routes are prefixed with ``/api`` because in production Vercel routes ``/api/*``
to this serverless function. M3 builds out ``/api/meta`` and ``/api/player/{id}``;
M4 adds ``/api/live/{handle}``.
"""

from fastapi import FastAPI

app = FastAPI(title="Draft Oracle API", version="0.1.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
