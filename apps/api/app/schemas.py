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


class LivePlayer(BaseModel):
    """One player in a live match."""

    hero_id: int
    hero: str | None = None  # our hero slug, when the numeric id maps cleanly
    is_radiant: bool


class LiveMatchResponse(BaseModel):
    """Live match served by ``GET /api/live/{handle}``.

    ``radiant``/``dire`` are hero-slug lists ready to drop onto the board;
    ``searched_is_radiant`` says which side the looked-up player is on so the
    client can pick ally vs enemy.
    """

    match_id: int | None = None
    game_time: int
    searched_account_id: int
    searched_is_radiant: bool | None = None
    radiant: list[str]
    dire: list[str]
    players: list[LivePlayer]
