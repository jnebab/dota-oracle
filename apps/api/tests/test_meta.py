from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_meta_default_patch() -> None:
    res = client.get("/api/meta")
    assert res.status_code == 200
    body = res.json()
    assert body["patch"] == "7.41c"
    assert body["source"] == "seed"
    tiers = {t["hero_id"]: t for t in body["tiers"]}
    assert tiers["spectre"]["tier"] == "S"
    assert tiers["anti-mage"]["tier"] == "D"


def test_meta_echoes_bracket() -> None:
    res = client.get("/api/meta", params={"bracket": "Archon"})
    assert res.status_code == 200
    assert res.json()["bracket"] == "Archon"


def test_meta_unknown_patch_404() -> None:
    res = client.get("/api/meta", params={"patch": "0.00"})
    assert res.status_code == 404
