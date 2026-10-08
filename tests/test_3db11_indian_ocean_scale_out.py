"""3DB-11 conservative regression for genuine Indian Ocean scale-out."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from scripts.main_block_materialization import validate_manifest

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "frontend" / "public" / "main-blocks"


def test_3db11_exact_source_backed_scale_out_inventory():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    snapshot = validate_manifest(DATA, deep_payloads=True)
    assert manifest["phase"] == "3DB-11"
    assert snapshot.logical_blocks == 140
    assert snapshot.materialized_pilots == 35
    assert snapshot.planned_blocks == 105
    assert snapshot.multi_date_pilots == 6
    assert snapshot.payloads == 41
    assert snapshot.land_blocks_materialized == 0
    assert len(manifest["pilot_ids"]) == 35
    assert len(manifest["payloads"]) == 41
    assert sum(block["materialization"] == "planned" for block in manifest["blocks"]) == 105
    assert manifest["integrity"]["synthetic_measurements"] is False
    assert manifest["integrity"]["synthetic_timestamps"] is False
    assert manifest["integrity"]["synthetic_coordinates"] is False
    assert manifest["integrity"]["synthetic_depths"] is False
    assert manifest["integrity"]["vertical_component_available"] is False


def test_3db11_ten_new_payloads_are_real_region_diverse_and_scientifically_bounded():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    record = manifest["scale_out_3db11"]
    assert record["validated_before_promotion"] is True
    assert record["source_date"] == "2004-03-15"
    assert "tds.gdex.ucar.edu/thredds/dodsC" in record["service_url"]
    ids = record["block_ids"]
    assert len(ids) == len(set(ids)) == 10
    assert manifest["pilot_ids"][-10:] == ids
    by_id = {block["id"]: block for block in manifest["blocks"]}
    assert len({by_id[block_id]["region"] for block_id in ids}) >= 6
    assert len(record["records"]) == 10
    for row in record["records"]:
        block_id = row["block_id"]
        block = by_id[block_id]
        assert block["materialization"] == "pilot"
        assert block["ocean_relevance"] == "ocean"
        assert block["ocean_fraction"] >= 0.8
        assert block["available_dates"] == ["2004-03-15"]
        assert block["payloads"] == [
            {"date": row["date"], "path": row["path"], "sha256": row["sha256"]}
        ]
        assert len(row["sha256"]) == 64
        path = DATA / row["path"]
        assert path.is_file()
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row["sha256"]
        payload = json.loads(path.read_text(encoding="utf-8"))
        assert payload["block_id"] == block_id
        assert payload["time"][:10] == row["date"]
        assert set(("thetao", "so", "uo", "vo")).issubset(payload["variables"])
        assert payload["source"]["service_url"] == record["service_url"]
        assert payload["integrity"]["vertical_component_available"] is False
        assert all(payload["integrity"][flag] is False for flag in (
            "synthetic_measurements", "synthetic_timestamps",
            "synthetic_coordinates", "synthetic_depths",
        ))


def test_3db11_legacy_baseline_and_genuine_pilot_io029_remain_untouched():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    assert len(manifest["multi_date_pilot_ids"]) == 6
    assert set(manifest["multi_date_pilot_ids"]) == {
        "IO-001", "IO-016", "IO-045", "IO-053", "IO-115", "IO-119"
    }
    io029 = next(block for block in manifest["blocks"] if block["id"] == "IO-029")
    assert io029["available_dates"] == ["2004-03-15"]
    assert io029["payloads"][0]["sha256"] == (
        "3a9159a53999ad87c0886142c370d5789405aaff679389659cf2542e7d250b27"
    )
    assert io029["id"] not in manifest["scale_out_3db11"]["block_ids"]
    assert set(manifest["scale_out_3db11"]["block_ids"]).isdisjoint(
        set(manifest["multi_date_pilot_ids"])
    )


def test_3db11_remaining_planned_blocks_still_cannot_claim_source_data():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    planned = [b for b in manifest["blocks"] if b["materialization"] == "planned"]
    assert len(planned) == 105
    for block in planned:
        assert block["available_dates"] == []
        assert block["payloads"] == []
