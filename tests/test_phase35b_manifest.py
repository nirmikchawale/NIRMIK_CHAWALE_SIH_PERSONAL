from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
MANIFEST_PATH = BLOCK_ROOT / "manifest.json"


def _load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_phase35b_manifest_scientific_contract() -> None:
    manifest = _load(MANIFEST_PATH)

    assert manifest["schema"] == "oceancanvas-main-block-manifest-v1"
    assert manifest["phase"] == "3.5B"
    assert manifest["target_domain"] == {
        "west": 60.0,
        "east": 100.0,
        "south": 5.0,
        "north": 25.0,
        "columns": 14,
        "rows": 10,
        "logical_block_count": 140,
    }

    source = manifest["source"]
    assert source["origin_product"] == "Copernicus Marine / Mercator Ocean GLORYS12V1"
    assert source["product_id"] == "GLOBAL_MULTIYEAR_PHY_001_030"
    assert source["dataset_id"] == "cmems_mod_glo_phy_my_0.083deg_P1D-m"
    assert source["transport"] == "OPeNDAP DAP2"
    assert source["time_semantics"] == "daily_mean"
    assert source["maximum_depth_m"] == 500.0

    integrity = manifest["integrity"]
    assert integrity["logical_block_count"] == 140
    assert 20 <= integrity["pilot_block_count"] <= 25
    assert integrity["pilot_block_count"] == len(manifest["pilot_ids"])
    assert integrity["multi_date_pilot_count"] >= 4
    assert integrity["multi_date_pilot_count"] == len(manifest["multi_date_pilot_ids"])
    assert integrity["land_blocks_materialized"] == 0
    assert integrity["synthetic_measurements"] is False
    assert integrity["synthetic_timestamps"] is False
    assert integrity["synthetic_coordinates"] is False
    assert integrity["synthetic_depths"] is False
    assert integrity["vertical_component_available"] is False

    blocks = manifest["blocks"]
    assert len(blocks) == 140
    assert len({block["id"] for block in blocks}) == 140
    by_id = {block["id"]: block for block in blocks}

    for block_id in manifest["pilot_ids"]:
        block = by_id[block_id]
        assert block["materialization"] == "pilot"
        assert block["ocean_relevance"] in {"ocean", "coastal"}
        assert block["ocean_fraction"] >= 0.20
        assert block["available_dates"]
        assert len(block["available_dates"]) == len(block["payloads"])

    for block in blocks:
        if block["ocean_relevance"] == "land":
            assert block["materialization"] != "pilot"


def test_phase35b_payload_checksums_and_source_evidence() -> None:
    manifest = _load(MANIFEST_PATH)
    seen_payloads: set[tuple[str, str]] = set()

    for record in manifest["payloads"]:
        key = (record["block_id"], record["date"])
        assert key not in seen_payloads
        seen_payloads.add(key)

        payload_path = BLOCK_ROOT / record["path"]
        assert payload_path.is_file()
        assert hashlib.sha256(payload_path.read_bytes()).hexdigest() == record["sha256"]

        payload = _load(payload_path)
        assert payload["schema"] == "oceancanvas-main-block-pilot-v1"
        assert payload["block_id"] == record["block_id"]
        assert payload["time"][:10] == record["date"]
        assert payload["time_semantics"] == "daily_mean"
        assert payload["ocean_relevance"] in {"ocean", "coastal"}
        assert payload["ocean_fraction"] >= 0.20

        coordinates = payload["coordinates"]
        assert coordinates["longitude"]
        assert coordinates["latitude"]
        assert coordinates["depth_m"]
        assert coordinates["depth_positive"] == "down"
        assert max(coordinates["depth_m"]) <= 500.0

        shape = payload["shape"]
        expected_values = shape["depth"] * shape["latitude"] * shape["longitude"]
        assert expected_values > 0
        for variable in ("thetao", "so", "uo", "vo"):
            evidence = payload["variables"][variable]
            assert len(evidence["values"]) == expected_values
            assert evidence["finite_count"] > 0
            assert evidence["minimum"] is not None
            assert evidence["maximum"] is not None
            assert evidence["minimum"] <= evidence["maximum"]

        source = payload["source"]
        assert source["origin_product"] == "Copernicus Marine / Mercator Ocean GLORYS12V1"
        assert source["product_id"] == "GLOBAL_MULTIYEAR_PHY_001_030"
        assert source["dataset_id"] == "cmems_mod_glo_phy_my_0.083deg_P1D-m"
        assert "tds.gdex.ucar.edu/thredds/dodsC" in source["service_url"]

        integrity = payload["integrity"]
        assert integrity == {
            "source_values_modified": False,
            "synthetic_measurements": False,
            "synthetic_timestamps": False,
            "synthetic_coordinates": False,
            "synthetic_depths": False,
            "vertical_component_available": False,
            "land_fill_preserved_as_missing": True,
        }

    assert len(seen_payloads) == len(manifest["payloads"])
    assert len(seen_payloads) == manifest["integrity"]["pilot_block_count"] + manifest["integrity"]["multi_date_pilot_count"]
