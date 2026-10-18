"""M011 genuine BGC optical oxygen / S-prof authenticity gate tests."""
from __future__ import annotations

import pytest
from src.bgc_provider_qc import classify_bgc_record
from scripts import fetch_verified_observation_breadth as provider


def bgc_fixture(**changes):
    return {
        "sensor_type": "bgc", "variable": "dissolved_oxygen",
        "units": "micromoles/kg", "qc_flag": "1",
        "source": "TEST-ONLY provider", "dataset_id": "TEST-ONLY",
        "platform_id": "TEST-ONLY", "longitude": -66, "latitude": 15,
        "depth_m": 31.2, "timestamp": "2025-09-15T10:30:00Z",
        "value": 198.2, **changes,
    }


def test_qc_accepted_does_not_mean_model_match_or_verified_provenance():
    state, why = classify_bgc_record(bgc_fixture())
    assert state == "OBSERVATION_CONTEXT_ONLY"
    assert "raw bytes" in why


@pytest.mark.parametrize("change", [
    {"qc_flag": "9"}, {"qc_flag": None}, {"variable": "missing"},
    {"units": "unknown"}, {"platform_id": ""}, {"depth_m": -1},
    {"latitude": 91}, {"timestamp": "not-a-date"},
    {"value": float("nan")}, {"value": -1},
    {"instrument_type": "satellite"}, {"sensor_type": "ctd"},
])
def test_reject_missing_or_invalid_genuine_bgc_evidence(change):
    assert classify_bgc_record({**bgc_fixture(), **change})[0] == "INELIGIBLE"


def test_sha_and_rights_are_separate_from_matchup():
    verified = {**bgc_fixture(), "original_source_sha256": "a" * 64,
                "redistribution_status": "verified"}
    assert classify_bgc_record(verified)[0] == "SOURCE_VERIFIED"
    verified["redistribution_status"] = "unverified"
    assert classify_bgc_record(verified)[0] == "OBSERVATION_CONTEXT_ONLY"


def test_aoml_oxygen_is_not_synthesized_when_oxygen_qc_missing(monkeypatch):
    row = {
        "profile_id": "1414", "trajectory": "TEST-ONLY",
        "profile_time": "2025-09-15T10:30:00Z",
        "profile_lon": "-66", "profile_lat": "15", "depth": "20",
        "temperature": "20", "temperature_qc": "1",
        "salinity": "35", "salinity_qc": "1",
        "aanderaa4831_dissolved_oxygen": "200",
        "aanderaa4831_dissolved_oxygen_qc": "9",
    }
    monkeypatch.setattr(provider, "_csv_rows", lambda _url: [row])
    physical, bgc, _ = provider._fetch_aoml_profile(1414)
    assert len(physical) == 2 and bgc == []
