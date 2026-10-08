from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from scripts.main_block_materialization import (
    MaterializationContractError,
    assess_materialization_target,
    load_manifest,
    validate_manifest,
    validate_payload_document,
)

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"


def _manifest() -> dict:
    return load_manifest(BLOCK_ROOT)


def _block(manifest: dict, block_id: str) -> dict:
    return next(block for block in manifest["blocks"] if block["id"] == block_id)


def _first_planned(manifest: dict, relevance: set[str]) -> dict:
    return next(
        block
        for block in manifest["blocks"]
        if block["materialization"] == "planned" and block["ocean_relevance"] in relevance
    )


def _first_payload(manifest: dict) -> tuple[dict, dict, dict]:
    record = manifest["payloads"][0]
    block = _block(manifest, record["block_id"])
    payload = json.loads((BLOCK_ROOT / record["path"]).read_text(encoding="utf-8"))
    return record, block, payload


def test_3db01_reusable_foundation_validates_current_inventory() -> None:
    snapshot = validate_manifest(BLOCK_ROOT)
    assert snapshot.logical_blocks == 140
    assert snapshot.materialized_pilots == 35
    assert snapshot.planned_blocks == 105
    assert snapshot.multi_date_pilots == 6
    assert snapshot.payloads == 41
    assert snapshot.land_blocks_materialized == 0


def test_3db01_target_assessment_keeps_geography_separate_from_source_and_data_truth() -> None:
    manifest = _manifest()
    ocean_target = _first_planned(manifest, {"ocean", "coastal"})
    ocean = assess_materialization_target(manifest, ocean_target["id"])
    assert ocean.state == "eligible-geography-only"
    assert ocean.eligible_for_acquisition is True
    assert ocean.source_available is False
    assert ocean.data_available is False

    land_target = _first_planned(manifest, {"land"})
    land = assess_materialization_target(manifest, land_target["id"])
    assert land.state == "blocked-land"
    assert land.eligible_for_acquisition is False
    assert land.source_available is False
    assert land.data_available is False


def test_3db01_candidate_gate_accepts_existing_genuine_payload_for_its_exact_identity() -> None:
    manifest = _manifest()
    record, block, payload = _first_payload(manifest)
    validate_payload_document(
        payload,
        expected_block=block,
        expected_date=record["date"],
        expected_source=manifest["source"],
        maximum_depth_m=float(manifest["source"]["maximum_depth_m"]),
    )


def test_3db01_candidate_gate_fails_closed_on_synthetic_or_relabelled_evidence() -> None:
    manifest = _manifest()
    record, block, payload = _first_payload(manifest)

    synthetic = copy.deepcopy(payload)
    synthetic["integrity"]["synthetic_timestamps"] = True
    with pytest.raises(MaterializationContractError, match="Synthetic scientific evidence is forbidden"):
        validate_payload_document(
            synthetic,
            expected_block=block,
            expected_date=record["date"],
            expected_source=manifest["source"],
            maximum_depth_m=float(manifest["source"]["maximum_depth_m"]),
            deep_values=False,
        )

    relabelled = copy.deepcopy(payload)
    relabelled["block_id"] = "IO-999"
    with pytest.raises(MaterializationContractError, match="block identity mismatch"):
        validate_payload_document(
            relabelled,
            expected_block=block,
            expected_date=record["date"],
            expected_source=manifest["source"],
            maximum_depth_m=float(manifest["source"]["maximum_depth_m"]),
            deep_values=False,
        )


def test_3db01_candidate_gate_rejects_wrong_bounds_and_source_identity() -> None:
    manifest = _manifest()
    record, block, payload = _first_payload(manifest)

    wrong_bounds = copy.deepcopy(payload)
    wrong_bounds["bounds"]["west"] = float(wrong_bounds["bounds"]["west"]) + 0.5
    with pytest.raises(MaterializationContractError, match="west bound mismatch"):
        validate_payload_document(
            wrong_bounds,
            expected_block=block,
            expected_date=record["date"],
            expected_source=manifest["source"],
            maximum_depth_m=float(manifest["source"]["maximum_depth_m"]),
            deep_values=False,
        )

    wrong_source = copy.deepcopy(payload)
    wrong_source["source"]["dataset_id"] = "not-the-verified-dataset"
    with pytest.raises(MaterializationContractError, match="source dataset_id mismatch"):
        validate_payload_document(
            wrong_source,
            expected_block=block,
            expected_date=record["date"],
            expected_source=manifest["source"],
            maximum_depth_m=float(manifest["source"]["maximum_depth_m"]),
            deep_values=False,
        )


def test_3db01_manifest_gate_rejects_truth_leak_from_planned_block(tmp_path: Path) -> None:
    manifest = _manifest()
    planned = _first_planned(manifest, {"ocean", "coastal"})
    corrupted = copy.deepcopy(manifest)
    target = _block(corrupted, planned["id"])
    target["available_dates"] = ["2000-01-01"]

    block_root = tmp_path / "main-blocks"
    block_root.mkdir()
    (block_root / "manifest.json").write_text(json.dumps(corrupted), encoding="utf-8")
    with pytest.raises(MaterializationContractError, match="must not advertise scientific evidence"):
        validate_manifest(block_root, deep_payloads=False)
