import httpx

from app.settings import get_settings


class RedisNotConfigured(RuntimeError):
    """Raised when Upstash Redis REST credentials are missing."""


def _conf() -> tuple[str, str]:
    s = get_settings()
    if not (s.upstash_redis_rest_url and s.upstash_redis_rest_token):
        raise RedisNotConfigured
    return s.upstash_redis_rest_url.rstrip("/"), s.upstash_redis_rest_token


async def get(key: str) -> str | None:
    """GET a key from Upstash via its REST API. Returns None if unset."""
    url, token = _conf()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{url}/get/{key}", headers={"Authorization": f"Bearer {token}"})
        res.raise_for_status()
        return res.json().get("result")


async def set(key: str, value: str) -> None:
    """SET a key in Upstash via its REST API (value passed as the request body)."""
    url, token = _conf()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            f"{url}/set/{key}",
            headers={"Authorization": f"Bearer {token}"},
            content=value,
        )
        res.raise_for_status()
