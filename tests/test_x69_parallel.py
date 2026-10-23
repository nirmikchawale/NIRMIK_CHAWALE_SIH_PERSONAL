"""X001–X069: 69 genuine GLORYS acquisitions x five truthful microphase contracts.

A geographic eligibility; B original data present; C native source validation;
D canonical registry/audit parity; E scientific renderer contract eligibility.
E is deliberately NOT a per-block live GPU or public deployment certificate.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import materialize_x69_parallel as x


MANIFEST = x.contract.load_manifest(x.BLOCK_ROOT)
REGISTRY = {block["id"]: block for block in MANIFEST["blocks"]}
IDS = tuple(MANIFEST["x69_parallel"]["block_ids"])
AUDIT = json.loads((x.BLOCK_ROOT / "capability-audit.json").read_text(encoding="utf-8"))
AUDITED = {block["id"]: block for block in AUDIT["blocks"]}


def test_x69_post_acquisition_exact_inventory_and_all_existing_source_sha():
    x.verify()  # Independently deep-validates ALL 110 original + new frames.
    assert len(IDS) == len(set(IDS)) == 69
    assert IDS == tuple(sorted(IDS))
    assert x.RESERVED not in IDS
    assert set(IDS).isdisjoint(set(MANIFEST["pilot_ids"][:35]))
    assert MANIFEST["pilot_ids"][-69:] == list(IDS)
    assert set(IDS) == {item for shard in range(x.SHARDS) for item in x.shard_ids(list(IDS), shard)}
    assert MANIFEST["x69_parallel"]["all_candidates_deep_validated_before_promotion"] is True
    assert AUDIT["summary"] == {
        "logicalBlocks": 140,
        "sourceBackedPilots": 104,
        "plannedBlocks": 36,
        "multiDatePilots": 6,
        "sourcePayloadFrames": 110,
        "landBlocksMaterialized": 0,
        "geographicallyEligiblePlannedBlocks": 1,
        "geographicallyIneligiblePlannedBlocks": 35,
        "independentlyObservationValidatedPilots": 0,
    }
    reserved = REGISTRY[x.RESERVED]
    assert reserved["materialization"] == "planned"
    assert reserved["payloads"] == reserved["available_dates"] == []


def test_x69_no_unsupported_native_time_or_source_promotions():
    assert MANIFEST["source"]["dates"] == ["2004-03-15", "2004-07-28"]
    assert MANIFEST["integrity"]["multi_date_pilot_count"] == 6
    for key in ("synthetic_measurements", "synthetic_timestamps",
                "synthetic_coordinates", "synthetic_depths", "vertical_component_available"):
        assert MANIFEST["integrity"][key] is False
    assert MANIFEST["x69_parallel"]["native_model_observation_matchup_claimed"] is False
    assert MANIFEST["x69_parallel"]["individual_gpu_render_certification_claimed"] is False
    assert MANIFEST["x69_parallel"]["public_deployment_certified"] is False
    assert len(MANIFEST["x69_parallel"]["original_41_payload_sha256"]) == 41


@pytest.mark.parametrize(("block_id", "stage"), [
    (block_id, stage) for block_id in IDS for stage in "ABCDE"
], ids=lambda value: value)
def test_x69_five_source_and_science_contract_microphases(block_id, stage):
    block = REGISTRY[block_id]
    audit = AUDITED[block_id]
    records = block["payloads"]
    assert len(records) == 1
    record = records[0]
    asset = x.BLOCK_ROOT / record["path"]

    if stage == "A":
        # Geography: legitimate water/coastal evidence with conserved target bounds.
        assert block["ocean_relevance"] in {"ocean", "coastal"}
        assert 0.20 <= block["ocean_fraction"] <= 1
        assert block["west"] < block["east"] and block["south"] < block["north"]
        assert audit["geographicallyEligibleForMaterialization"] is True

    elif stage == "B":
        # Materialization: original native payload exists (not just a logical ID).
        assert block["materialization"] == "pilot"
        assert block["available_dates"] == [x.SOURCE_DATE]
        assert asset.is_file()
        assert record["path"] == x.expected_path(block_id)
        assert x.contract.sha256_file(asset) == record["sha256"]

    elif stage == "C":
        # Native scientific integrity, original four variables and coordinates.
        payload = json.loads(asset.read_text(encoding="utf-8"))
        x.contract.validate_payload_document(
            payload, expected_block=block, expected_date=x.SOURCE_DATE,
            expected_source=MANIFEST["source"],
            maximum_depth_m=float(MANIFEST["source"]["maximum_depth_m"]),
            deep_values=True,
        )
        assert payload["source"]["product_id"] == "GLOBAL_MULTIYEAR_PHY_001_030"
        assert set(("thetao", "so", "uo", "vo")).issubset(payload["variables"])
        assert payload["integrity"]["vertical_component_available"] is False

    elif stage == "D":
        # Registered canonical identity; no extra invented times/variables.
        runtime = x.RUNTIME.read_text(encoding="utf-8")
        match = re.search(r"export const PHASE35B_PILOT_IDS = \[(.*?)\] as const;", runtime, re.S)
        assert match is not None and f'"{block_id}"' in match.group(1)
        assert block_id in MANIFEST["pilot_ids"]
        assert any(row["block_id"] == block_id and row["sha256"] == record["sha256"]
                   for row in MANIFEST["payloads"])
        assert audit["availableDates"] == [x.SOURCE_DATE]
        assert audit["sourcePayloads"] == [{
            "date": record["date"], "path": record["path"], "sha256": record["sha256"]
        }]

    elif stage == "E":
        # Contract eligibility only. No per-block GPU proof or invented in-situ matchup.
        assert audit["materialized"] is True
        assert audit["sourceSha256VerifiedByAudit"] is True
        assert audit["cesiumContractReady"] is True
        assert audit["waterColumnContractReady"] is True
        assert audit["availableVariables"] == ["thetao", "so", "currents"]
        assert audit["depthEvidence"] == "source-payload-native-depth"
        assert audit["independentModelObservationValidated"] is False
        assert audit["individualProduction3DRenderProven"] is False


def test_x69_reject_invalid_shard_indices():
    for bad in (-1, x.SHARDS, x.SHARDS + 1):
        with pytest.raises(ValueError, match="Invalid shard"):
            x.shard_ids(["IO-003"], bad)
