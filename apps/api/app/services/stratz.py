import httpx

from app.settings import get_settings

STRATZ_URL = "https://api.stratz.com/graphql"

# STRATZ requires the Bearer token AND a User-Agent containing "STRATZ_API"
# for token auth to be accepted.
_USER_AGENT = "STRATZ_API"

# STRATZ has no per-player live-match lookup (live data only covers watch-listed
# pro/league games). The reliable, universal source is the player's most recent
# match via PlayerType.matches, which also exposes each player's role/position.
LAST_MATCH_QUERY = """
query LastMatch($id: Long!) {
  player(steamAccountId: $id) {
    matches(request: { take: 1 }) {
      id
      didRadiantWin
      durationSeconds
      players {
        steamAccountId
        heroId
        isRadiant
        position
      }
    }
  }
}
"""


class StratzNotConfigured(RuntimeError):
    """Raised when STRATZ_TOKEN is missing."""


class StratzError(RuntimeError):
    """Raised when STRATZ returns a GraphQL error or an unparseable body."""


async def fetch_last_match(account_id: int) -> dict | None:
    """Return the player's most recent match, or ``None`` if they have none.

    Raises ``StratzNotConfigured`` when no token is set, ``StratzError`` on
    GraphQL/HTTP errors (with the upstream message attached).
    """
    settings = get_settings()
    if not settings.stratz_token:
        raise StratzNotConfigured

    headers = {
        "Authorization": f"Bearer {settings.stratz_token}",
        "User-Agent": _USER_AGENT,
        "Content-Type": "application/json",
    }
    payload = {"query": LAST_MATCH_QUERY, "variables": {"id": account_id}}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(STRATZ_URL, json=payload, headers=headers)

    # Surface the upstream body on HTTP errors (STRATZ explains 400s in the body).
    if res.status_code >= 400:
        raise StratzError(f"STRATZ HTTP {res.status_code}: {res.text[:400]}")

    try:
        body = res.json()
    except ValueError as exc:  # non-JSON body (e.g. HTML error page)
        raise StratzError(f"STRATZ returned a non-JSON response: {res.text[:200]!r}") from exc

    if isinstance(body, dict) and body.get("errors"):
        messages = "; ".join(
            str(e.get("message", e)) for e in body["errors"] if isinstance(e, dict)
        )
        raise StratzError(f"STRATZ GraphQL error: {messages or body['errors']}")

    player = (body.get("data") or {}).get("player") or {}
    matches = player.get("matches") or []
    return matches[0] if matches else None
