import re

from app.services import opendota


def slugify(name: str) -> str:
    """Match the TS ``slug()`` in @dota-oracle/data so ids line up across stacks."""
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", name.lower()))


async def hero_slug_map() -> dict[int, str]:
    """Map numeric Dota hero id → our hero slug, via OpenDota hero constants."""
    heroes = await opendota.fetch_heroes()
    out: dict[int, str] = {}
    for h in heroes:
        hero_id = h.get("id")
        name = h.get("localized_name")
        if isinstance(hero_id, int) and isinstance(name, str):
            out[hero_id] = slugify(name)
    return out
