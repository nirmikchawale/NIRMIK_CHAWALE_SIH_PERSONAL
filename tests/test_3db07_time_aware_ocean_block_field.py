from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "frontend" / "public" / "main-blocks" / "manifest.json"
OCEAN_MASK = ROOT / "frontend" / "src" / "main-block-ocean-mask.ts"
TIME_CONTRACT = ROOT / "frontend" / "src" / "main-block-time.ts"
RUNTIME = ROOT / "frontend" / "src" / "main-block-runtime.ts"
GLOBE = ROOT / "frontend" / "src" / "components" / "OceanGlobe.tsx"
BLOCK_ENGINE = ROOT / "frontend" / "src" / "components" / "Phase35MainBlockEngine.tsx"
API = ROOT / "frontend" / "src" / "api.ts"


def _manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def _payload(relative_path: str) -> dict:
    path = ROOT / "frontend" / "public" / "main-blocks" / relative_path
    return json.loads(path.read_text(encoding="utf-8"))


def test_3db07_ocean_mask_keeps_any_ocean_intersection_and_removes_only_zero_ocean_cells() -> None:
    manifest = _manifest()
    retained = [block for block in manifest["blocks"] if block["ocean_fraction"] > 0]
    excluded = [block for block in manifest["blocks"] if block["ocean_fraction"] == 0]

    assert len(manifest["blocks"]) == 140
    assert len(retained) == 112
    assert len(excluded) == 28
    assert any(block["ocean_relevance"] == "land" and block["ocean_fraction"] > 0 for block in retained)

    source = OCEAN_MASK.read_text(encoding="utf-8")
    assert 'MAIN_BLOCK_OCEAN_MASK_VERSION = "3db-07-ocean-mask-v1"' in source
    assert "OCEAN_INTERSECTING_BLOCK_COUNT" in source
    assert "LAND_ONLY_BLOCK_COUNT" in source
    for block in excluded:
        assert f'"{block["id"]}"' in source


def test_3db07_native_time_axis_is_exact_source_time_only() -> None:
    manifest = _manifest()
    source = TIME_CONTRACT.read_text(encoding="utf-8")
    api_source = API.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_TIME_INTEGRATION_VERSION = "3db-07-v1"' in source
    assert "assertNativeTimeAxis" in source
    assert "strictly increasing and unique" in source
    assert "planned block ${block.id} cannot receive scientific timestamps" in source
    assert 'from "./main-block-time"' in api_source

    for entry in manifest["blocks"]:
        if entry["materialization"] != "pilot":
            continue
        payload_times = [_payload(record["path"])["time"] for record in entry["payloads"]]
        assert [timestamp[:10] for timestamp in payload_times] == entry["available_dates"]
        assert payload_times == sorted(set(payload_times))
        assert all(timestamp.endswith("Z") for timestamp in payload_times)

    assert manifest["integrity"]["multi_date_pilot_count"] == 6


def test_3db07_removes_baseline_block_overlap_and_page_reload_selection_path() -> None:
    runtime = RUNTIME.read_text(encoding="utf-8")
    globe = GLOBE.read_text(encoding="utf-8")
    block_engine = BLOCK_ENGINE.read_text(encoding="utf-8")

    assert "window.location.reload" not in runtime
    assert "ACTIVE_MAIN_BLOCK_EVENT" in runtime
    assert "verified-main-block-footprint" not in globe
    assert 'id: "model-domain-boundary"' not in globe
    assert "Enable field-click entry" not in globe
    assert "field-entry-actions" not in globe
    assert "OCEAN_INTERSECTING_MAIN_BLOCKS" in globe
    assert "oceanCoverageYellow" in globe
    assert "CURRENT_VERIFIED_BASELINE" not in block_engine
    assert "baseline-overlap" not in block_engine
    assert "oceanCoverageYellowGradient" in block_engine
