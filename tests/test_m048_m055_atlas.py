"""M048–M055 protect all 105 planned cells and refuse fabricated evidence."""
from __future__ import annotations
from copy import deepcopy
from hashlib import sha256
import json

import pytest
from src.feasibility_atlas import (
    build_from_original_files, build_feasibility_atlas,
    serialized_atlas, MANIFEST, CAPABILITIES
)
from scripts.export_feasibility_atlas import REPO


def test_m048_055_all_105_positions_deterministic_and_7_consecutive_15_cell_batches():
    atlas = build_from_original_files()
    assert atlas["schema"] == "oceancanvas-105-planned-block-source-feasibility-v1"
    assert len(atlas["blocks"]) == 105
    assert {r["planned_position"] for r in atlas["blocks"]} == set(range(1, 106))
    assert [(x["phase"], x["position_start"], x["position_end"])
            for x in atlas["batches"]] == [
                (f"M{x:03d}", 1+(x-49)*15, (x-48)*15) for x in range(49, 56)
            ]
    assert all(len(x["block_ids"]) == 15 for x in atlas["batches"])
    assert sha256(serialized_atlas(atlas)).hexdigest() == sha256(
        serialized_atlas(build_from_original_files())).hexdigest()


def test_source_snapshot_original_sha_and_eligibility_frozen():
    atlas = build_from_original_files()
    assert atlas["source_manifest_sha256"] == sha256(MANIFEST.read_bytes()).hexdigest()
    assert atlas["capability_audit_sha256"] == sha256(CAPABILITIES.read_bytes()).hexdigest()
    assert atlas["summary"]["original_logical_cells"] == 140
    assert atlas["summary"]["original_pilots"] == 35
    assert atlas["summary"]["original_pilot_frames"] == 41
    assert atlas["summary"]["geographically_eligible_unmaterialized"] == 70
    assert atlas["summary"]["geographically_ineligible"] == 35


def test_planned_only_not_observations_or_true_3d_or_source_download():
    atlas = build_from_original_files()
    for row in atlas["blocks"]:
        assert row["source_discovery"] == "NOT_QUERIED"
        assert row["source_time_coverage"] == "UNKNOWN"
        assert row["observation_availability"] == "NOT_QUERIED"
        assert row["raw_model_data"] == "NOT_ACQUIRED"
        assert row["new_materialized_frames"] == 0
        assert row["source_frame_sha256"] is None
        assert row["true_3d_render_certified"] is False
        assert row["independent_model_observation_matchup"] == "NOT_ESTABLISHED"
    assert atlas["summary"]["new_observation_matches_verified"] == 0
    assert atlas["summary"]["new_source_acquisitions_verified"] == 0


def originals():
    return json.loads(MANIFEST.read_text()), json.loads(CAPABILITIES.read_text())


def validated(a, b):
    return build_feasibility_atlas(a, b,
         manifest_sha256=sha256(MANIFEST.read_bytes()).hexdigest(),
         capabilities_sha256=sha256(CAPABILITIES.read_bytes()).hexdigest())


def test_reject_fabricated_planned_frame_date_and_payload():
    a, b = originals()
    planned = next(x for x in a["blocks"] if x["materialization"] == "planned")
    planned["available_dates"] = ["2024-01-02"]
    with pytest.raises(ValueError, match="planned"):
        validated(a, b)


def test_reject_forged_capability_eligibility_and_duplicated_rows():
    a, b = originals()
    target = next(x for x in b["blocks"] if not x["materialized"])
    target["geographicallyEligibleForMaterialization"] = not target["geographicallyEligibleForMaterialization"]
    with pytest.raises(ValueError, match="feasibility mismatch"):
        validated(a, b)
    a, b = originals()
    a["blocks"][0]["id"] = a["blocks"][1]["id"]
    with pytest.raises(ValueError, match="Duplicate"):
        validated(a, b)


def test_io087_is_not_promoted_merely_by_geographic_eligibility():
    a = build_from_original_files()
    row = next(r for r in a["blocks"] if r["id"] == "IO-087")
    assert row["geographical_materialization_eligibility"] is True
    assert row["new_materialized_frames"] == 0
    assert row["source_discovery"] == "NOT_QUERIED"
    assert row["observation_availability"] == "NOT_QUERIED"
