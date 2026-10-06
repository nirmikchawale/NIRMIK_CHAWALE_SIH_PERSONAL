from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
MANIFEST_PATH = BLOCK_ROOT / "manifest.json"
GEOGRAPHY_SOURCE = ROOT / "frontend" / "src" / "main-block-geography.ts"
RUNTIME_SOURCE = ROOT / "frontend" / "src" / "main-block-runtime.ts"


def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_3db03_manifest_geography_is_a_complete_stable_10_by_14_grid() -> None:
    manifest = _manifest()
    domain = manifest["target_domain"]
    blocks = manifest["blocks"]

    assert domain == {
        "west": 60.0,
        "east": 100.0,
        "south": 5.0,
        "north": 25.0,
        "columns": 14,
        "rows": 10,
        "logical_block_count": 140,
    }
    assert len(blocks) == 140
    assert [block["id"] for block in blocks] == [f"IO-{index:03d}" for index in range(1, 141)]
    assert len({block["id"] for block in blocks}) == 140
    assert len({(block["row"], block["column"]) for block in blocks}) == 140

    by_position = {(block["row"], block["column"]): block for block in blocks}
    covered_area = 0.0

    for row in range(domain["rows"]):
        for column in range(domain["columns"]):
            block = by_position[(row, column)]
            assert block["west"] < block["east"]
            assert block["south"] < block["north"]
            assert domain["west"] <= block["west"] < block["east"] <= domain["east"]
            assert domain["south"] <= block["south"] < block["north"] <= domain["north"]
            covered_area += (block["east"] - block["west"]) * (block["north"] - block["south"])

            if column < domain["columns"] - 1:
                east_neighbor = by_position[(row, column + 1)]
                assert block["east"] == east_neighbor["west"]
                assert block["south"] == east_neighbor["south"]
                assert block["north"] == east_neighbor["north"]

            if row < domain["rows"] - 1:
                south_neighbor = by_position[(row + 1, column)]
                assert block["south"] == south_neighbor["north"]
                assert block["west"] == south_neighbor["west"]
                assert block["east"] == south_neighbor["east"]

    expected_area = (domain["east"] - domain["west"]) * (domain["north"] - domain["south"])
    assert covered_area == expected_area == 800.0


def test_3db03_geography_changes_no_scientific_inventory_truth() -> None:
    manifest = _manifest()
    blocks = manifest["blocks"]

    # 3DB-03 is a geographic-engine phase. The payload manifest remains the
    # source-backed 3DB-02 acquisition record rather than being relabelled.
    assert manifest["phase"] == "3DB-02"
    assert manifest["integrity"]["logical_block_count"] == 140
    assert manifest["integrity"]["pilot_block_count"] == 25
    assert manifest["integrity"]["multi_date_pilot_count"] == 6
    assert manifest["integrity"]["land_blocks_materialized"] == 0
    assert len(manifest["payloads"]) == 31
    assert sum(block["materialization"] == "pilot" for block in blocks) == 25
    assert sum(block["materialization"] == "planned" for block in blocks) == 115
    assert all(
        block["materialization"] == "planned"
        for block in blocks
        if block["ocean_relevance"] == "land"
    )
    assert manifest["integrity"]["synthetic_measurements"] is False
    assert manifest["integrity"]["synthetic_timestamps"] is False
    assert manifest["integrity"]["synthetic_coordinates"] is False
    assert manifest["integrity"]["synthetic_depths"] is False
    assert manifest["integrity"]["vertical_component_available"] is False


def test_3db03_runtime_uses_the_single_canonical_geographic_resolver() -> None:
    geography = GEOGRAPHY_SOURCE.read_text(encoding="utf-8")
    runtime = RUNTIME_SOURCE.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_GEOGRAPHY_VERSION = "3db-03-v1"' in geography
    assert "findGeographicMainBlockAt" in geography
    assert "easternEdgeOwner" in geography
    assert "southernEdgeOwner" in geography
    assert 'from "./main-block-geography"' in runtime
    assert "return findGeographicMainBlockAt(longitude, latitude);" in runtime

    # The previous inclusive scan made a shared edge eligible for both adjacent
    # cells. The public runtime must no longer contain that implementation.
    assert "longitude >= block.west && longitude <= block.east" not in runtime
    assert "latitude >= block.south && latitude <= block.north" not in runtime
