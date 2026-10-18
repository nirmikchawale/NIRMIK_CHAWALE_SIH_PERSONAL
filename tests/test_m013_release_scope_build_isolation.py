"""M013 build-stage must not weaken MPR-only production release ownership."""
from scripts.verify_mpr_release_scope import allowed

def test_provider_code_is_not_mpr_scope():
    assert not allowed("scripts/fetch_verified_observation_breadth.py")
    assert not allowed("src/bgc_provider_qc.py")
    assert not allowed("frontend/public/main-blocks/manifest.json")

def test_original_scope_allows_original_owned_ui_tests():
    assert allowed("frontend/e2e/mpr-17-cross-phase-certification.spec.ts")
    assert allowed("frontend/src/theme.ts")

def test_m011_and_m012_are_development_tests_not_release_exemptions():
    assert not allowed("tests/test_m011_bgc_evidence.py")
    assert not allowed("tests/test_m012_provider_retry.py")
