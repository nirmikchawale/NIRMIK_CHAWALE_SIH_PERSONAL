from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
MANIFEST_PATH = BLOCK_ROOT / "manifest.json"
RENDERER_CONTRACT = ROOT / "frontend" / "src" / "main-block-cesium-renderer.ts"
GLOBE_SOURCE = ROOT / "frontend" / "src" / "components" / "OceanGlobe.tsx"


def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_3db04_does_not_change_acquisition_or_materialization_truth() -> None:
    manifest = _manifest()
    blocks = manifest["blocks"]

    assert manifest["phase"] == "3DB-11"
    assert manifest["integrity"]["logical_block_count"] == 140
    assert manifest["integrity"]["pilot_block_count"] == 35
    assert manifest["integrity"]["multi_date_pilot_count"] == 6
    assert manifest["integrity"]["land_blocks_materialized"] == 0
    assert len(manifest["payloads"]) == 41
    assert sum(block["materialization"] == "pilot" for block in blocks) == 35
    assert sum(block["materialization"] == "planned" for block in blocks) == 105

    integrity = manifest["integrity"]
    assert integrity["synthetic_measurements"] is False
    assert integrity["synthetic_timestamps"] is False
    assert integrity["synthetic_coordinates"] is False
    assert integrity["synthetic_depths"] is False
    assert integrity["vertical_component_available"] is False


def test_3db04_renderer_contract_is_fail_closed_and_source_coordinate_preserving() -> None:
    source = RENDERER_CONTRACT.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_CESIUM_RENDERER_VERSION = "3db-04-v1"' in source
    assert "deriveMainBlockCapabilities" in source
    assert "deriveMainBlockCapabilities(block).cesiumReady" in source
    assert "Scientific Cesium rendering is locked" in source
    assert "nativeCoordinatesPreserved: true" in source
    assert "nativeDepthPreserved: true" in source
    assert "source coordinate" in source
    assert "genuine available date" in source
    assert "Math.hypot(u, v)" in source
    assert "horizontalCurrentOnly: true" in source

    # The render contract validates source values; it must not generate scientific
    # longitudes, latitudes, depths, timestamps or a vertical current component.
    forbidden = (
        "synthetic_measurements: true",
        "synthetic_timestamps: true",
        "synthetic_coordinates: true",
        "synthetic_depths: true",
        "vertical_component_available: true",
    )
    assert all(token not in source for token in forbidden)


def test_3db04_live_globe_uses_active_block_bounds_and_contract_gate() -> None:
    globe = GLOBE_SOURCE.read_text(encoding="utf-8")

    assert 'from "../main-block-cesium-renderer"' in globe
    assert "buildCesiumFieldRenderPlan(block, field)" in globe
    assert "buildCesiumVolumeRenderPlan(block, volume)" in globe
    assert "buildCesiumCurrentsRenderPlan(block, currents)" in globe
    assert "canCesiumRenderMainBlock(block)" in globe

    # The selected scientific depth plane and translucent globe window must use
    # the active block footprint rather than a permanently hard-coded baseline.
    assert "Rectangle.fromDegrees(block.west, block.south, block.east, block.north)" in globe
    assert "Rectangle.fromDegrees(67, 12, 70, 14)" not in globe
    assert "Rectangle.fromDegrees(66.85, 11.85, 70.15, 14.15)" not in globe

    # A pilot is source-backed evidence but is not the independently validated
    # baseline. The legacy compatibility guard must not label a pilot VERIFIED.
    assert "SOURCE-BACKED PILOT" in globe
    assert "data-active-main-block-materialization={activeMaterialization}" in globe
    assert "isVerifiedBaseline(activeMainBlock) ? \"verified-baseline\"" not in globe
