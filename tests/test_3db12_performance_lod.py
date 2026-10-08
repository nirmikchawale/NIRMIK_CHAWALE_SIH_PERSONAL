"""3DB-12 independent scientific preservation checks for presentation-only LOD."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "frontend" / "public" / "main-blocks"


def test_3db12_all_41_scientific_source_payloads_remain_checksum_identical():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    assert len(manifest["blocks"]) == 140
    assert len(manifest["pilot_ids"]) == 35
    assert len(manifest["payloads"]) == 41
    assert len([entry for entry in manifest["blocks"] if entry["materialization"] == "planned"]) == 105
    for record in manifest["payloads"]:
        path = DATA / record["path"]
        assert path.is_file(), path
        assert hashlib.sha256(path.read_bytes()).hexdigest() == record["sha256"]
    for entry in manifest["blocks"]:
        if entry["materialization"] == "planned":
            assert entry["available_dates"] == []
            assert entry["payloads"] == []
    for key in ("synthetic_measurements", "synthetic_coordinates", "synthetic_depths", "synthetic_timestamps", "vertical_component_available"):
        assert manifest["integrity"][key] is False
