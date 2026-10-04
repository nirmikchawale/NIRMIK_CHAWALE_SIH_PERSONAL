from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "frontend" / "public" / "main-blocks" / "manifest.json"


def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_3db00_planned_blocks_cannot_claim_materialized_science() -> None:
    manifest = _manifest()
    pilots = set(manifest["pilot_ids"])
    blocks = manifest["blocks"]

    planned = [block for block in blocks if block["id"] not in pilots]
    assert len(blocks) == manifest["integrity"]["logical_block_count"]
    assert len(planned) + len(pilots) == len(blocks)

    for block in planned:
        assert block["materialization"] == "planned"
        assert block["available_dates"] == []
        assert block["payloads"] == []


def test_3db00_source_backed_blocks_require_real_payload_evidence() -> None:
    manifest = _manifest()
    by_id = {block["id"]: block for block in manifest["blocks"]}

    for block_id in manifest["pilot_ids"]:
        block = by_id[block_id]
        assert block["materialization"] == "pilot"
        assert block["available_dates"]
        assert block["payloads"]
        assert len(block["available_dates"]) == len(block["payloads"])
        assert block["ocean_relevance"] in {"ocean", "coastal"}

        for payload in block["payloads"]:
            assert payload["date"] in block["available_dates"]
            assert payload["path"].startswith(f"data/{block_id}/")
            assert payload["sha256"]


def test_3db00_manifest_integrity_never_promotes_synthetic_evidence() -> None:
    integrity = _manifest()["integrity"]

    assert integrity["synthetic_measurements"] is False
    assert integrity["synthetic_timestamps"] is False
    assert integrity["synthetic_coordinates"] is False
    assert integrity["synthetic_depths"] is False
    assert integrity["land_blocks_materialized"] == 0
    assert integrity["vertical_component_available"] is False
