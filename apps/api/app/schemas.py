from pydantic import BaseModel


class MetaTierOut(BaseModel):
    """One hero's meta read in a snapshot."""

    hero_id: str
    tier: str
    note: str


class MetaResponse(BaseModel):
    """Meta snapshot served by ``GET /api/meta``."""

    patch: str
    bracket: str | None = None
    source: str  # "seed" now; "computed" once M5 lands
    tiers: list[MetaTierOut]


class PlayerHero(BaseModel):
    """A hero the player has been playing recently."""

    hero_id: int
    games: int
    wins: int
    win_rate: float


class PlayerResponse(BaseModel):
    """Player overview served by ``GET /api/player/{id}``."""

    account_id: int
    match_count: int
    win_rate: float
    top_heroes: list[PlayerHero]
