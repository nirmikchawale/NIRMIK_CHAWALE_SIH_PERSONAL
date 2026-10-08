from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "frontend" / "public" / "main-blocks" / "manifest.json"
DEPTH_CONTRACT = ROOT / "frontend" / "src" / "main-block-depth.ts"
PILOT_LOADER = ROOT / "frontend" / "src" / "pilot-main-block-loader.ts"
WATER_COLUMN = ROOT / "frontend" / "src" / "components" / "WaterColumn3D.tsx"


def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _payload(relative_path: str) -> dict:
    path = ROOT / "frontend" / "public" / "main-blocks" / relative_path
    return json.loads(path.read_text(encoding="utf-8"))


def test_3db06_every_materialized_payload_preserves_one_genuine_multi_depth_axis() -> None:
    manifest = _manifest()
    expected_axis: list[float] | None = None

    assert manifest["integrity"]["pilot_block_count"] == 35
    assert len(manifest["payloads"]) == 41
    assert manifest["integrity"]["synthetic_depths"] is False
    assert manifest["integrity"]["land_blocks_materialized"] == 0

    for record in manifest["payloads"]:
        payload = _payload(record["path"])
        depths = payload["coordinates"]["depth_m"]

        assert payload["block_id"] == record["block_id"]
        assert payload["integrity"]["synthetic_depths"] is False
        assert payload["coordinates"]["depth_positive"] == "down"
        assert payload["shape"]["depth"] == len(depths)
        assert len(depths) == 31
        assert all(isinstance(value, (int, float)) and value >= 0 for value in depths)
        assert all(depths[index] > depths[index - 1] for index in range(1, len(depths)))
        assert depths[0] == 0.494025
        assert depths[-1] == 453.937714

        if expected_axis is None:
            expected_axis = depths
        else:
            assert depths == expected_axis

        expected_values = payload["shape"]["depth"] * payload["shape"]["latitude"] * payload["shape"]["longitude"]
        for variable in ("thetao", "so", "uo", "vo"):
            assert len(payload["variables"][variable]["values"]) == expected_values


def test_3db06_runtime_contract_is_fail_closed_and_native_only() -> None:
    source = DEPTH_CONTRACT.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION = "3db-06-v1"' in source
    assert "assertNativeDepthAxis" in source
    assert "deriveMainBlockDepthIntegration" in source
    assert "resolveNativeDepthSelection" in source
    assert "assertExactNativeDepthAxisMatch" in source
    assert 'depthPositive !== "down"' in source
    assert "requires at least two genuine source depth levels" in source
    assert "strictly increasing and unique" in source
    assert "planned block ${block.id} cannot receive scientific depth values" in source
    assert 'mode: "locked"' in source
    assert "levelCount: 0" in source


def test_3db06_pilot_loader_routes_all_depth_products_through_the_native_axis_gate() -> None:
    source = PILOT_LOADER.read_text(encoding="utf-8")

    assert 'from "./main-block-depth"' in source
    assert "function nativeDepthAxis(payload: PilotBlockPayload)" in source
    assert "nativeDepthAxis(payload);" in source
    assert source.count("const depth_m = nativeDepthAxis(payload);") == 2
    assert source.count("resolveNativeDepthSelection(") == 2
    assert "depth_m: selectedDepth.depthM" in source
    assert "depth_index: selectedDepth.depthIndex" in source
    assert "depths_m: [...depth_m]" in source
    assert "vertical_component_available: false" in source

    forbidden = (
        "synthetic_depths: true",
        "vertical_component_available: true",
        "Math.round(payload.coordinates.depth_m",
        "interpolateDepth",
        "interpolatedDepth",
    )
    assert all(token not in source for token in forbidden)


def test_3db06_water_column_retains_native_depth_count_and_planned_depth_lock() -> None:
    source = WATER_COLUMN.read_text(encoding="utf-8")

    assert 'data-depth-count={depthLevels.length}' in source
    assert "Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b)" in source
    assert "currentsVolume?.depths_m.slice().sort((a, b) => a - b)" in source
    assert "Depth (m, positive down)" in source
    assert "SOURCE DEPTH AXIS PENDING" in source
    assert 'data-materialization="planned"' in source
    assert 'data-scientific-values="0"' in source
