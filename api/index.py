"""Vercel Python serverless entrypoint.

Vercel maps files under ``/api`` to serverless functions and routes ``/api/*``
here (see the rewrite in ``vercel.json``). The FastAPI app itself lives in the
monorepo at ``apps/api/app`` (source of truth for local dev + pytest); we add
that directory to ``sys.path`` and re-export the ASGI ``app``.
"""

import os
import sys

_API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api"))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

from app.main import app  # noqa: E402

__all__ = ["app"]
