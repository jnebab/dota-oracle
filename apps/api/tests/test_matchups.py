import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import opendota

client = TestClient(app)

HEROES = [
    {"id": 1, "localized_name": "Anti-Mage"},
    {"id": 8, "localized_name": "Juggernaut"},
    {"id": 94, "localized_name": "Medusa"},
]


@pytest.fixture(autouse=True)
def _mock_heroes(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_heroes() -> list[dict]:
        return HEROES

    monkeypatch.setattr(opendota, "fetch_heroes", fake_heroes)


def test_matchups_computes_advantage(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_matchups(hero_id: int) -> list[dict]:
        assert hero_id == 94  # medusa
        return [
            {"hero_id": 1, "games_played": 200, "wins": 120},  # medusa 60% vs AM
            {"hero_id": 8, "games_played": 50, "wins": 40},  # below MIN_GAMES → dropped
        ]

    monkeypatch.setattr(opendota, "fetch_matchups", fake_matchups)
    res = client.get("/api/matchups", params={"vs": "medusa"})
    assert res.status_code == 200
    body = res.json()
    # advantage(AM vs Medusa) = 0.5 - 0.6 = -0.1; small-sample Jugg excluded.
    assert body["medusa"]["anti-mage"] == pytest.approx(-0.1)
    assert "juggernaut" not in body["medusa"]


def test_matchups_empty_query() -> None:
    assert client.get("/api/matchups", params={"vs": ""}).json() == {}


def test_matchups_unknown_slug(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_matchups(_hero_id: int) -> list[dict]:
        return []

    monkeypatch.setattr(opendota, "fetch_matchups", fake_matchups)
    # Unknown slug resolves to no hero id → simply omitted.
    assert client.get("/api/matchups", params={"vs": "not-a-hero"}).json() == {}


def test_matchups_upstream_error_502(monkeypatch: pytest.MonkeyPatch) -> None:
    async def boom(_hero_id: int) -> list[dict]:
        raise httpx.ConnectError("opendota down")

    monkeypatch.setattr(opendota, "fetch_matchups", boom)
    assert client.get("/api/matchups", params={"vs": "medusa"}).status_code == 502


def test_matchups_caps_enemies(monkeypatch: pytest.MonkeyPatch) -> None:
    heroes = [{"id": i, "localized_name": f"Hero{i}"} for i in range(1, 8)]  # 7 heroes
    calls: list[int] = []

    async def fake_heroes() -> list[dict]:
        return heroes

    async def fake_matchups(hero_id: int) -> list[dict]:
        calls.append(hero_id)
        return []

    monkeypatch.setattr(opendota, "fetch_heroes", fake_heroes)
    monkeypatch.setattr(opendota, "fetch_matchups", fake_matchups)
    vs = ",".join(f"hero{i}" for i in range(1, 8))  # 7 enemy slugs
    res = client.get("/api/matchups", params={"vs": vs})
    assert res.status_code == 200
    assert len(calls) == 5  # MAX_ENEMIES cap
