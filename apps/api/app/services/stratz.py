import httpx

from app.settings import get_settings

STRATZ_URL = "https://api.stratz.com/graphql"

# STRATZ requires the Bearer token AND a User-Agent containing "STRATZ_API"
# for token auth to be accepted.
_USER_AGENT = "STRATZ_API"

LIVE_MATCH_QUERY = """
query LiveMatch($id: Long!) {
  player(steamAccountId: $id) {
    liveMatch {
      matchId
      gameTime
      players {
        steamAccountId
        heroId
        isRadiant
      }
    }
  }
}
"""


class StratzNotConfigured(RuntimeError):
    """Raised when STRATZ_TOKEN is missing."""


async def fetch_live_match(account_id: int) -> dict | None:
    """Return the player's current live match payload, or ``None`` if not in one.

    Raises ``StratzNotConfigured`` when no token is set, and propagates
    ``httpx.HTTPError`` for transport/HTTP failures.
    """
    settings = get_settings()
    if not settings.stratz_token:
        raise StratzNotConfigured

    headers = {
        "Authorization": f"Bearer {settings.stratz_token}",
        "User-Agent": _USER_AGENT,
        "Content-Type": "application/json",
    }
    payload = {"query": LIVE_MATCH_QUERY, "variables": {"id": account_id}}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(STRATZ_URL, json=payload, headers=headers)
        res.raise_for_status()
        body = res.json()

    player = (body.get("data") or {}).get("player") or {}
    return player.get("liveMatch")
