import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import opendota
from app.services.steamid import STEAM64_BASE, to_account_id

client = TestClient(app)

SAMPLE = [
    {"hero_id": 1, "player_slot": 0, "radiant_win": True},  # radiant, win
    {"hero_id": 1, "player_slot": 0, "radiant_win": False},  # radiant, loss
    {"hero_id": 2, "player_slot": 128, "radiant_win": False},  # dire, win
]


def test_to_account_id() -> None:
    assert to_account_id(123) == 123
    assert to_account_id(STEAM64_BASE + 1) == 1
    assert to_account_id(str(STEAM64_BASE + 42)) == 42
    with pytest.raises(ValueError):
        to_account_id("not-a-number")


def test_summarize_player() -> None:
    res = opendota.summarize_player(42, SAMPLE)
    assert res.account_id == 42
    assert res.match_count == 3
    assert res.win_rate == pytest.approx(2 / 3)
    by_hero = {h.hero_id: h for h in res.top_heroes}
    assert by_hero[1].games == 2
    assert by_hero[1].wins == 1
    assert by_hero[2].wins == 1


def test_player_route(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake(_account_id: int) -> list[dict]:
        return SAMPLE

    monkeypatch.setattr(opendota, "fetch_recent_matches", fake)
    res = client.get("/api/player/42")
    assert res.status_code == 200
    assert res.json()["match_count"] == 3


def test_player_resolves_steam64(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, int] = {}

    async def fake(account_id: int) -> list[dict]:
        captured["id"] = account_id
        return []

    monkeypatch.setattr(opendota, "fetch_recent_matches", fake)
    res = client.get(f"/api/player/{STEAM64_BASE + 7}")
    assert res.status_code == 200
    assert captured["id"] == 7


def test_player_bad_handle() -> None:
    res = client.get("/api/player/not-a-number")
    assert res.status_code == 400
