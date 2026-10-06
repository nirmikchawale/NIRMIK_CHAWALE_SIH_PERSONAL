from __future__ import annotations

import hashlib
import json
from pathlib import Path

from scripts.main_block_materialization import assess_materialization_target, validate_manifest

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
TARGET_ID = "IO-029"
SOURCE_DATE = "2004-03-15"
PAYLOAD_RELATIVE = "data/IO-029/2004-03-15.json"
PAYLOAD_SHA256 = "3a9159a53999ad87c0886142c370d5789405aaff679389659cf2542e7d250b27"
LEGACY_PILOTS = ('IO-001', 'IO-002', 'IO-015', 'IO-016', 'IO-031', 'IO-038', 'IO-045', 'IO-046', 'IO-052', 'IO-053', 'IO-065', 'IO-075', 'IO-089', 'IO-091', 'IO-096', 'IO-103', 'IO-105', 'IO-110', 'IO-115', 'IO-116', 'IO-119', 'IO-121', 'IO-129', 'IO-133')


def test_3db02_promotes_exactly_one_new_genuine_ocean_pilot() -> None:
    manifest = json.loads((BLOCK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    snapshot = validate_manifest(BLOCK_ROOT)
    assert snapshot.logical_blocks == 140
    assert snapshot.materialized_pilots == 25
    assert snapshot.planned_blocks == 115
    assert snapshot.multi_date_pilots == 6
    assert snapshot.payloads == 31
    assert snapshot.land_blocks_materialized == 0
    assert manifest["phase"] == "3DB-02"
    assert set(LEGACY_PILOTS).issubset(set(manifest["pilot_ids"]))
    assert TARGET_ID in manifest["pilot_ids"]
    assert TARGET_ID not in LEGACY_PILOTS
    assert TARGET_ID not in manifest["multi_date_pilot_ids"]


def test_3db02_new_pilot_is_checksum_verified_source_evidence() -> None:
    manifest = json.loads((BLOCK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    block = next(item for item in manifest["blocks"] if item["id"] == TARGET_ID)
    assert block["materialization"] == "pilot"
    assert block["ocean_relevance"] == "ocean"
    assert block["ocean_fraction"] >= 0.80
    assert block["available_dates"] == [SOURCE_DATE]
    assert block["payloads"] == [{"date": SOURCE_DATE, "path": PAYLOAD_RELATIVE, "sha256": PAYLOAD_SHA256}]

    payload_path = BLOCK_ROOT / PAYLOAD_RELATIVE
    assert hashlib.sha256(payload_path.read_bytes()).hexdigest() == PAYLOAD_SHA256
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    assert payload["block_id"] == TARGET_ID
    assert payload["time"][:10] == SOURCE_DATE
    assert payload["source"]["origin_product"] == "Copernicus Marine / Mercator Ocean GLORYS12V1"
    assert payload["source"]["product_id"] == "GLOBAL_MULTIYEAR_PHY_001_030"
    assert payload["source"]["dataset_id"] == "cmems_mod_glo_phy_my_0.083deg_P1D-m"
    assert "tds.gdex.ucar.edu/thredds/dodsC" in payload["source"]["service_url"]
    for name in ("thetao", "so", "uo", "vo"):
        assert payload["variables"][name]["finite_count"] > 0
    integrity = payload["integrity"]
    assert integrity["source_values_modified"] is False
    assert integrity["synthetic_measurements"] is False
    assert integrity["synthetic_timestamps"] is False
    assert integrity["synthetic_coordinates"] is False
    assert integrity["synthetic_depths"] is False
    assert integrity["vertical_component_available"] is False
    assert integrity["land_fill_preserved_as_missing"] is True


def test_3db02_target_now_reports_source_and_data_available() -> None:
    manifest = json.loads((BLOCK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    assessment = assess_materialization_target(manifest, TARGET_ID)
    assert assessment.state == "already-materialized"
    assert assessment.eligible_for_acquisition is False
    assert assessment.source_available is True
    assert assessment.data_available is True
