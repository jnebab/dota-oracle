import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import heroes, opendota, stratz
from app.services.heroes import slugify

client = TestClient(app)

HEROES = [
    {"id": 1, "localized_name": "Anti-Mage"},
    {"id": 8, "localized_name": "Juggernaut"},
    {"id": 11, "localized_name": "Shadow Fiend"},
    {"id": 41, "localized_name": "Faceless Void"},
]

LIVE_MATCH = {
    "matchId": 123,
    "gameTime": 600,
    "players": [
        {"steamAccountId": 42, "heroId": 8, "isRadiant": True},
        {"steamAccountId": 99, "heroId": 1, "isRadiant": False},
        {"steamAccountId": 77, "heroId": 41, "isRadiant": True},
    ],
}


@pytest.fixture(autouse=True)
def _mock_heroes(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_heroes() -> list[dict]:
        return HEROES

    monkeypatch.setattr(opendota, "fetch_heroes", fake_heroes)


def test_slugify_matches_ts() -> None:
    assert slugify("Anti-Mage") == "anti-mage"
    assert slugify("Shadow Fiend") == "shadow-fiend"
    assert slugify("Nature's Prophet") == "nature-s-prophet"


def test_live_maps_heroes(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_live(_id: int) -> dict:
        return LIVE_MATCH

    monkeypatch.setattr(stratz, "fetch_live_match", fake_live)
    res = client.get("/api/live/42")
    assert res.status_code == 200
    body = res.json()
    assert body["game_time"] == 600
    assert body["searched_is_radiant"] is True
    assert set(body["radiant"]) == {"juggernaut", "faceless-void"}
    assert body["dire"] == ["anti-mage"]


def test_live_resolves_name(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, int] = {}

    async def fake_search(_q: str) -> list[dict]:
        return [{"account_id": 42, "personaname": "someone"}]

    async def fake_live(account_id: int) -> dict:
        captured["id"] = account_id
        return LIVE_MATCH

    monkeypatch.setattr(opendota, "search_players", fake_search)
    monkeypatch.setattr(stratz, "fetch_live_match", fake_live)
    res = client.get("/api/live/someone")
    assert res.status_code == 200
    assert captured["id"] == 42


def test_live_no_match_404(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_live(_id: int) -> None:
        return None

    monkeypatch.setattr(stratz, "fetch_live_match", fake_live)
    assert client.get("/api/live/42").status_code == 404


def test_live_no_token_503(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_live(_id: int) -> dict:
        raise stratz.StratzNotConfigured

    monkeypatch.setattr(stratz, "fetch_live_match", fake_live)
    assert client.get("/api/live/42").status_code == 503


def test_live_upstream_error_502(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_live(_id: int) -> dict:
        raise httpx.ConnectError("boom")

    monkeypatch.setattr(stratz, "fetch_live_match", fake_live)
    assert client.get("/api/live/42").status_code == 502


def test_name_resolution_no_match(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_search(_q: str) -> list[dict]:
        return []

    monkeypatch.setattr(opendota, "search_players", fake_search)
    assert client.get("/api/live/ghostname").status_code == 404


def test_hero_slug_map_uses_constants() -> None:
    import asyncio

    result = asyncio.run(heroes.hero_slug_map())
    assert result[11] == "shadow-fiend"
