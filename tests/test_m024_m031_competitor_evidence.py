"""M024–M031 research guardrails: actual snapshots versus marketing claims."""
from copy import deepcopy
import json
import pytest
from src.competitor_evidence_audit import (
    COMPETITOR_CENSUS, classify_candidate_claim, load_census, validate_census
)


def test_sample_eight_verified_snapshots_not_fictitious_ninety_eight():
    r = load_census()
    assert r["exact_snapshots"] == 8
    assert r["historical_98_complete"] is False
    assert r["historic_300_descriptions_recovered"] is False
    assert r["levels"]["CODE_INSPECTED"] == 3


def test_no_duplicate_mirrors_in_current_verified_eight():
    j = json.loads(COMPETITOR_CENSUS.read_text())
    j["entries"].append(deepcopy(j["entries"][0]))
    with pytest.raises(ValueError, match="Duplicate"):
        validate_census(j)


def test_public_code_has_no_automatic_copy_permission():
    j = json.loads(COMPETITOR_CENSUS.read_text())
    j["entries"][0]["adoption_status"] = "SHIPPED"
    with pytest.raises(ValueError, match="copying"):
        validate_census(j)


@pytest.mark.parametrize("source,expected", [
    ("synthetic", "DEMONSTRATION_ONLY"),
    ("demo", "DEMONSTRATION_ONLY"),
    ("unknown", "UNKNOWN"),
    ("model", "UNVERIFIED_SOURCE"),
])
def test_claims_never_magically_verify_science(source, expected):
    assert classify_candidate_claim(source_kind=source, raw_sha=None,
                                    provider_rights=False, model_match=False) == expected


def test_observation_with_sha_rights_still_not_independent_match():
    r = classify_candidate_claim(source_kind="observation", raw_sha="f" * 64,
                                 provider_rights=True, model_match=False)
    assert r == "OBSERVATION_CONTEXT_ONLY"


def test_model_observation_sign_convention_warning_preserved():
    j = json.loads(COMPETITOR_CENSUS.read_text())
    f = next(x for x in j["entries"] if x["repository"] == "quantumcoder2026/Fathom")
    assert f["decision"] == "REQUIRES_SIGN_CONVERSION"
    assert "observed-minus-model" in f["code_evidence"]
