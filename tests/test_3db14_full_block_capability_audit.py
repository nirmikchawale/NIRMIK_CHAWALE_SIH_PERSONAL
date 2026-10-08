"""3DB-14 fail-closed 140-block inventory, source and runtime parity."""
from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from scripts.audit_3db14_capabilities import (
    REPORT, RUNTIME, assert_runtime_manifest_parity,
    assert_snapshot_matches, build_audit,
)
from scripts.main_block_materialization import MaterializationContractError, load_manifest


def test_all_140_logical_blocks_and_reference_are_disjoint_and_source_backed():
    audit = build_audit()
    summary = audit["summary"]
    assert summary["logicalBlocks"] == 140
    assert summary["sourceBackedPilots"] == 35
    assert summary["plannedBlocks"] == 105
    assert summary["multiDatePilots"] == 6
    assert summary["sourcePayloadFrames"] == 41
    assert summary["landBlocksMaterialized"] == 0
    assert summary["independentlyObservationValidatedPilots"] == 0
    assert len(audit["blocks"]) == 140
    assert audit["verifiedBaselineSeparateFrom140"]["id"] == "BASE-GLORYS-001"
    assert sum(b["materialized"] for b in audit["blocks"]) == 35
    assert sum(len(b["sourcePayloads"]) for b in audit["blocks"]) == 41
    assert sum(len(b["availableDates"]) == 2 for b in audit["blocks"]) == 6
    assert_snapshot_matches(audit, json.loads(REPORT.read_text(encoding="utf-8")))


def test_planned_and_land_cells_cannot_claim_science_or_rendering():
    audit = build_audit()
    for block in audit["blocks"]:
        assert block["individualProduction3DRenderProven"] is False
        assert block["independentModelObservationValidated"] is False
        if not block["materialized"]:
            assert block["evidenceClass"] == "geography-only-planned"
            assert block["cesiumContractReady"] is False
            assert block["waterColumnContractReady"] is False
            assert block["sourceSha256VerifiedByAudit"] is False
            assert block["sourcePayloads"] == []
            assert block["availableDates"] == []
            assert block["availableVariables"] == []
            assert block["depthEvidence"] == "none"
        else:
            assert block["geographicallyEligibleForMaterialization"] is True
            assert block["sourceSha256VerifiedByAudit"] is True
            assert block["availableVariables"] == ["thetao", "so", "currents"]
        if block["oceanRelevance"] == "land":
            assert block["materialized"] is False
            assert block["geographicallyEligibleForMaterialization"] is False


def test_audit_fails_closed_on_runtime_drift():
    manifest = load_manifest()
    source = RUNTIME.read_text(encoding="utf-8")
    assert_runtime_manifest_parity(manifest, source)
    tampered = source.replace('"IO-001", "IO-002"', '"IO-003", "IO-002"', 1)
    with pytest.raises(MaterializationContractError, match="Runtime pilot IDs"):
        assert_runtime_manifest_parity(manifest, tampered)
    tampered_multi = source.replace(
        'export const PHASE35B_MULTI_DATE_PILOT_IDS = [',
        'export const PHASE35B_MULTI_DATE_PILOT_IDS = ["IO-002",', 1,
    )
    with pytest.raises(MaterializationContractError, match="Runtime multi-date IDs"):
        assert_runtime_manifest_parity(manifest, tampered_multi)


def test_public_audit_rejects_false_promotion_and_fake_observation_claim():
    real = build_audit()
    forged = copy.deepcopy(real)
    planned = next(b for b in forged["blocks"] if not b["materialized"])
    planned["materialized"] = True
    planned["cesiumContractReady"] = True
    with pytest.raises(MaterializationContractError, match="overclaims"):
        assert_snapshot_matches(real, forged)
    forged2 = copy.deepcopy(real)
    forged2["blocks"][0]["independentModelObservationValidated"] = True
    with pytest.raises(MaterializationContractError, match="overclaims"):
        assert_snapshot_matches(real, forged2)
