from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OBSERVATION_CONTRACT = ROOT / "frontend" / "src" / "main-block-observations.ts"
CAPABILITY_CONTRACT = ROOT / "frontend" / "src" / "main-block-capabilities.ts"
GLOBE = ROOT / "frontend" / "src" / "components" / "OceanGlobe.tsx"
APP = ROOT / "frontend" / "src" / "App.tsx"
API = ROOT / "frontend" / "src" / "api.ts"

SUMMARY_FILES = [
    ROOT / "data" / "comparison" / "profile_5907092_cycle012_A_summary.json",
    ROOT / "data" / "comparison" / "profile_5907092_cycle013_D_summary.json",
]


def test_3db09_verified_argo_profiles_are_real_io087_spatial_context() -> None:
    profiles = [json.loads(path.read_text(encoding="utf-8")) for path in SUMMARY_FILES]
    assert len(profiles) == 2

    for profile in profiles:
        longitude = profile["observation_longitude"]
        latitude = profile["observation_latitude"]
        assert 66 <= longitude < 69
        assert 11 < latitude <= 13
        assert profile["matched_level_count"] > 0
        assert profile["comparison_status"] == "diagnostic_only_with_documented_thermodynamic_and_temporal_limitations"


def test_3db09_runtime_separates_spatial_context_from_model_validation() -> None:
    contract = OBSERVATION_CONTRACT.read_text(encoding="utf-8")
    capabilities = CAPABILITY_CONTRACT.read_text(encoding="utf-8")
    api = API.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION = "3db-09-v1"' in contract
    assert '"independent-model-observation"' in contract
    assert '"spatial-context-only"' in contract
    assert "blockOwnsCoordinate" in contract
    assert "footprint membership does not imply temporal collocation" in contract
    assert "independentlyComparedToActiveModel: attachedToActiveBaseline" in contract
    assert 'evidenceRole: "spatial-context"' in contract

    assert "Observation context cannot promote a non-baseline main block" in capabilities
    assert "observationsAvailable: observationEvidence?.observationsAvailable ?? isBaseline" in capabilities

    assert 'if (activePilotId()) return { provider: PILOT_ARGO_PROVIDER' in api
    assert 'if (activePilotId()) throw new Error("Argo comparison profiles are not attached' in api


def test_3db09_judge_surface_exposes_block_scoped_observation_truth() -> None:
    globe = GLOBE.read_text(encoding="utf-8")
    app = APP.read_text(encoding="utf-8")

    assert 'deriveMainBlockObservationIntegration' in globe
    assert 'data-active-block-observation-count' in globe
    assert 'data-active-block-observation-evidence' in globe
    assert 'data-active-block-observation-validation' in globe
    assert 'data-testid="active-block-observation-context"' in globe
    assert "spatial context only; no block validation is implied" in globe
    assert "verifiedObservationProfiles={verifiedObservationProfiles}" in app
