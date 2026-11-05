"""M016–M023 deterministic negative and positive science contract fixtures.

Test-only JSON / bytes never enter deployed Ocean Canvas data directories.
"""
from __future__ import annotations

from dataclasses import replace
from hashlib import sha256
import json

import pytest
from src.science_evidence_pipeline import (
    EvidenceStage, ScientificFacets, lint_public_claims, portable_provenance,
    validate_chronological_frame, rights_decision, matchup_eligibility,
    classify_s_profile, atomic_promote_source,
)


def test_m016_independent_status_facets_and_no_truthy_shortcut():
    f = ScientificFacets(source=EvidenceStage.BLOCKED,
                         observation=EvidenceStage.OBSERVATION_CONTEXT_ONLY)
    assert f.source == EvidenceStage.BLOCKED
    assert replace(f, renderer=EvidenceStage.RENDER_READY).source == EvidenceStage.BLOCKED
    with pytest.raises(TypeError):
        ScientificFacets(source="VERIFIED")


def test_m017_linter_blocks_unearned_independent_operational_forecast_claims():
    f = ScientificFacets(matchup=EvidenceStage.MATCHUP_DIAGNOSTIC)
    claims = "Independently validated real-time ocean observations. Forecast verified."
    findings = lint_public_claims(claims, facets=f)
    assert len(findings) == 3
    assert lint_public_claims("Not independently validated", facets=f) == ()


def test_m018_public_provenance_keeps_hash_without_secret_or_local_path():
    src = {"provider": "TEST-ONLY", "dataset_id": "TEST-ONLY", "sha256": "b" * 64,
           "source_uri": "https://data.pmel.noaa.gov/archive/a.nc?api_token=SECRET",
           "source_path": "C:\\Users\\private\\ocean\\source.nc", "password": "SECRET"}
    clean = portable_provenance(src)
    assert clean["sha256"] == "b" * 64
    assert clean["source_filename"] == "source.nc"
    assert clean["public_source_url"].endswith("/archive/a.nc")
    assert "SECRET" not in json.dumps(clean)
    assert "private" not in json.dumps(clean)
    with pytest.raises(ValueError):
        portable_provenance({**src, "sha256": ""})


def test_m019_original_2004_pilot_separate_from_2024_argo():
    good = {"block_id": "IO-001", "date": "2004-03-15", "sha256": "c" * 64,
            "native_times_utc": ["2004-03-15T12:00:00Z"]}
    assert validate_chronological_frame(good)["observations_independently_validated"] is False
    with pytest.raises(ValueError, match="baseline"):
        validate_chronological_frame({**good, "date": "2024-01-02",
                                      "native_times_utc": ["2024-01-02T12:00:00Z"]})
    with pytest.raises(ValueError, match="contradict"):
        validate_chronological_frame({**good, "native_times_utc": ["2024-01-02T12:00:00Z"]})


def test_m020_source_readability_does_not_authorize_public_redistribution():
    base = {"provider": "TEST-ONLY", "source_url": "https://example.test/data.nc",
            "licence": "TEST-ONLY explicit", "attribution": "TEST-ONLY"}
    assert rights_decision(base)[0] is False
    assert rights_decision({**base, "redistribution_status": "verified"})[0] is True


def model():
    return {"source_verified": True, "variable": "temperature", "units": "degree_C",
            "time": "2004-03-15T12:00:00Z", "west": 66, "east": 69,
            "south": 11, "north": 13, "depths_m": [0.5, 100, 450]}


def obs():
    return {"qc_accepted": True, "variable": "temperature", "units": "degree_C",
            "time": "2004-03-15T12:00:00Z", "longitude": 68, "latitude": 12,
            "depth_m": 80}


def test_m021_date_year_depth_space_and_variable_gates():
    assert matchup_eligibility(model(), obs(), max_time_delta_hours=1)[0] is True
    for bad in [
        {**obs(), "time": "2024-01-02T12:00:00Z"},
        {**obs(), "longitude": 110}, {**obs(), "depth_m": 900},
        {**obs(), "variable": "salinity"}, {**obs(), "qc_accepted": False},
    ]:
        assert matchup_eligibility(model(), bad, max_time_delta_hours=1)[0] is False
    assert matchup_eligibility(model(), obs(), max_time_delta_hours=-2)[0] is False


def test_m022_bgc_arbitrary_demo_cannot_be_authenticated():
    actual = {"format": "argo-s-profile-netcdf", "raw_sha256": "d" * 64,
              "platform_id": "TEST-ONLY-FLOAT", "cycle": 13,
              "parameters": {"DOXY": {"mode": "D", "qc": "1", "units": "umol/kg"}}}
    assert classify_s_profile(actual)[0] == "OBSERVATION_CONTEXT_ONLY"
    assert classify_s_profile({**actual, "raw_sha256": ""})[0] == "UNAVAILABLE"
    assert classify_s_profile({**actual, "format": "synthetic"})[0] == "INELIGIBLE"
    assert classify_s_profile({**actual, "parameters": {"DOXY": {"mode": "D", "qc": "9"}}})[0] == "INELIGIBLE"


def test_m023_atomic_promotion_checks_hash_mask_chronology_and_immutability(tmp_path):
    root = tmp_path / "isolated-test-store"
    raw = b'{"test_only":true,"values":[]}'
    digest = sha256(raw).hexdigest()
    attrs = {"native_times_utc": ["2004-03-15T12:00:00Z"],
             "wet_mask_verified": True}
    with pytest.raises(ValueError, match="checksum mismatch"):
        atomic_promote_source(root, block_id="IO-001", frame_date="2004-03-15",
                              raw_payload=raw, expected_sha256="0" * 64, metadata=attrs)
    assert not root.exists()
    with pytest.raises(ValueError, match="wet mask"):
        atomic_promote_source(root, block_id="IO-001", frame_date="2004-03-15",
                              raw_payload=raw, expected_sha256=digest,
                              metadata={**attrs, "wet_mask_verified": False})
    assert not root.exists()
    pointer = atomic_promote_source(root, block_id="IO-001", frame_date="2004-03-15",
                                    raw_payload=raw, expected_sha256=digest, metadata=attrs)
    published = json.loads(pointer.read_text())
    assert published["sha256"] == digest
    assert (root / published["object"]).read_bytes() == raw
    assert atomic_promote_source(root, block_id="IO-001", frame_date="2004-03-15",
                                 raw_payload=raw, expected_sha256=digest,
                                 metadata=attrs) == pointer
    newer = b'{"test_only":true,"values":[1]}'
    with pytest.raises(ValueError, match="versioned migration"):
        atomic_promote_source(root, block_id="IO-001", frame_date="2004-03-15",
                              raw_payload=newer, expected_sha256=sha256(newer).hexdigest(),
                              metadata=attrs)
    assert json.loads(pointer.read_text())["sha256"] == digest
