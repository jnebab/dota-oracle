import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import meta_refresh, opendota, redis
from app.services.meta_refresh import compute_tiers

client = TestClient(app)


def _hero(name: str, picks: int, win_rate: float) -> dict:
    """Build a heroStats-shaped row with all picks/wins in bracket 5."""
    return {"localized_name": name, "5_pick": picks, "5_win": int(picks * win_rate)}


def test_compute_tiers_buckets_by_winrate() -> None:
    stats = [_hero(f"Hero {i}", 5000, 0.40 + i * 0.01) for i in range(10)]
    tiers = compute_tiers(stats, min_picks=1000)
    # Highest win rate (Hero 9) lands at the top band, lowest (Hero 0) at the bottom.
    assert tiers["hero-9"]["tier"] == "S"
    assert tiers["hero-0"]["tier"] == "D"
    assert "win rate" in tiers["hero-9"]["note"]


def test_compute_tiers_drops_low_sample() -> None:
    stats = [_hero("Tiny Sample", 10, 0.9), _hero("Big Sample", 5000, 0.5)]
    tiers = compute_tiers(stats, min_picks=1000)
    assert "tiny-sample" not in tiers
    assert "big-sample" in tiers


def test_meta_falls_back_to_seed_without_redis() -> None:
    # No Redis configured in the test env → /api/meta serves the bundled seed.
    res = client.get("/api/meta")
    assert res.status_code == 200
    assert res.json()["source"] == "seed"


def test_meta_serves_computed_snapshot(monkeypatch: pytest.MonkeyPatch) -> None:
    snapshot = {
        "patch": "7.41d",
        "source": "computed",
        "tiers": {"spectre": {"tier": "A", "note": "auto · 52.0% win rate"}},
    }

    async def fake_get(_key: str) -> str:
        return json.dumps(snapshot)

    monkeypatch.setattr(redis, "get", fake_get)
    res = client.get("/api/meta")
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "computed"
    assert body["tiers"][0]["hero_id"] == "spectre"


def test_refresh_meta_stores_snapshot(monkeypatch: pytest.MonkeyPatch) -> None:
    stored: dict[str, str] = {}

    async def fake_stats() -> list[dict]:
        return [_hero("Spectre", 5000, 0.55), _hero("Anti-Mage", 5000, 0.45)]

    async def fake_set(key: str, value: str) -> None:
        stored[key] = value

    import asyncio

    monkeypatch.setattr(opendota, "fetch_hero_stats", fake_stats)
    monkeypatch.setattr(redis, "set", fake_set)
    snap = asyncio.run(meta_refresh.refresh_meta())
    assert snap["source"] == "computed"
    assert "meta:current" in stored
    assert "spectre" in snap["tiers"]


def test_cron_requires_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CRON_SECRET", "s3cret")
    from app.settings import get_settings

    get_settings.cache_clear()
    assert client.get("/api/cron/refresh-meta").status_code == 401
    assert (
        client.get("/api/cron/refresh-meta", headers={"Authorization": "Bearer wrong"}).status_code
        == 401
    )
    get_settings.cache_clear()


def test_cron_runs_with_valid_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CRON_SECRET", "s3cret")
    from app.settings import get_settings

    get_settings.cache_clear()

    async def fake_refresh() -> dict:
        return {
            "source": "computed",
            "generated_at": "2026-05-29T00:00:00+00:00",
            "tiers": {"a": 1},
        }

    monkeypatch.setattr(meta_refresh, "refresh_meta", fake_refresh)
    res = client.get("/api/cron/refresh-meta", headers={"Authorization": "Bearer s3cret"})
    assert res.status_code == 200
    assert res.json()["heroes"] == 1
    get_settings.cache_clear()
