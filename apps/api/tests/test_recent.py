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

MATCH = {
    "id": 7777,
    "didRadiantWin": True,
    "durationSeconds": 2400,
    "players": [
        {"steamAccountId": 42, "heroId": 8, "isRadiant": True, "position": "POSITION_1"},
        {"steamAccountId": 99, "heroId": 1, "isRadiant": False, "position": "POSITION_2"},
        {"steamAccountId": 77, "heroId": 41, "isRadiant": True, "position": "POSITION_3"},
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


def test_recent_maps_heroes_and_roles(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_last(_id: int) -> dict:
        return MATCH

    monkeypatch.setattr(stratz, "fetch_last_match", fake_last)
    res = client.get("/api/recent/42")
    assert res.status_code == 200
    body = res.json()
    assert body["duration_seconds"] == 2400
    assert body["match_id"] == 7777
    assert body["searched_is_radiant"] is True
    assert set(body["radiant"]) == {"juggernaut", "faceless-void"}
    assert body["dire"] == ["anti-mage"]
    jugg = next(p for p in body["players"] if p["hero"] == "juggernaut")
    assert jugg["position"] == "Carry"


def test_recent_resolves_name(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, int] = {}

    async def fake_search(_q: str) -> list[dict]:
        return [{"account_id": 42, "personaname": "someone"}]

    async def fake_last(account_id: int) -> dict:
        captured["id"] = account_id
        return MATCH

    monkeypatch.setattr(opendota, "search_players", fake_search)
    monkeypatch.setattr(stratz, "fetch_last_match", fake_last)
    res = client.get("/api/recent/someone")
    assert res.status_code == 200
    assert captured["id"] == 42


def test_recent_no_match_404(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_last(_id: int) -> None:
        return None

    monkeypatch.setattr(stratz, "fetch_last_match", fake_last)
    assert client.get("/api/recent/42").status_code == 404


def test_recent_no_token_503(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_last(_id: int) -> dict:
        raise stratz.StratzNotConfigured

    monkeypatch.setattr(stratz, "fetch_last_match", fake_last)
    assert client.get("/api/recent/42").status_code == 503


def test_recent_graphql_error_502(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_last(_id: int) -> dict:
        raise stratz.StratzError("STRATZ HTTP 400: Cannot query field 'foo'")

    monkeypatch.setattr(stratz, "fetch_last_match", fake_last)
    res = client.get("/api/recent/42")
    assert res.status_code == 502
    assert "400" in res.json()["detail"]


def test_recent_upstream_error_502(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_last(_id: int) -> dict:
        raise httpx.ConnectError("boom")

    monkeypatch.setattr(stratz, "fetch_last_match", fake_last)
    assert client.get("/api/recent/42").status_code == 502


def test_recent_search_error_502(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_search(_q: str) -> list[dict]:
        raise httpx.ConnectError("opendota down")

    monkeypatch.setattr(opendota, "search_players", fake_search)
    assert client.get("/api/recent/somename").status_code == 502


def test_recent_name_no_match(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_search(_q: str) -> list[dict]:
        return []

    monkeypatch.setattr(opendota, "search_players", fake_search)
    assert client.get("/api/recent/ghostname").status_code == 404


def test_hero_slug_map_uses_constants() -> None:
    import asyncio

    result = asyncio.run(heroes.hero_slug_map())
    assert result[11] == "shadow-fiend"
