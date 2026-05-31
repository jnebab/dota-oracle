from app.services import opendota
from app.services.heroes import hero_slug_map

# Drop tiny samples so an advantage figure is meaningful.
MIN_GAMES = 100
# Cap how many enemies we'll look up per request (a draft has at most 5).
MAX_ENEMIES = 5


async def get_matchups(enemy_slugs: list[str]) -> dict[str, dict[str, float]]:
    """For each enemy hero (by slug), return every other hero's win-rate advantage
    against it, as ``{enemySlug: {candidateSlug: advantage}}`` where advantage is a
    fraction (e.g. +0.04 = the candidate wins 54% vs that enemy).

    Derived from OpenDota head-to-head: advantage(C vs E) = 0.5 - winRate(E vs C).
    """
    id_to_slug = await hero_slug_map()
    slug_to_id = {slug: hero_id for hero_id, slug in id_to_slug.items()}

    out: dict[str, dict[str, float]] = {}
    for slug in enemy_slugs[:MAX_ENEMIES]:
        hero_id = slug_to_id.get(slug)
        if hero_id is None:
            continue
        rows = await opendota.fetch_matchups(hero_id)
        adv: dict[str, float] = {}
        for row in rows:
            opp_id = row.get("hero_id")
            games = int(row.get("games_played") or 0)
            wins = int(row.get("wins") or 0)
            if not isinstance(opp_id, int) or games < MIN_GAMES:
                continue
            opp_slug = id_to_slug.get(opp_id)
            if not opp_slug:
                continue
            adv[opp_slug] = round(0.5 - wins / games, 4)
        out[slug] = adv
    return out
