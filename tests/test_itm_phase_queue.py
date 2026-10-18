"""ITM-05–15: build-ahead queue is fail-closed, not an auto-release engine."""
from copy import deepcopy
from pathlib import Path

import pytest

from scripts import itm_phase_queue as q


def manifest():
    return q.load_json(q.DEFAULT_MANIFEST)


def head():
    return "a" * 40


def passed(phase):
    return {
        "head_sha": head(),
        "stage_a_untouched": True,
        "checks": {
            name: {"head_sha": head(), "conclusion": "success"}
            for name in phase["required_checks"]
        },
        "approvals": list(phase["required_approvals"]),
        "release_artifact_verified": True,
        "public_chromium_verified": True,
    }


def test_all_fourteen_phases_defined_in_strict_sequence():
    p = q.validate_manifest(manifest())
    assert [x["id"] for x in p] == [f"ITM-{n:02d}" for n in range(2, 16)]


def test_automatic_merging_or_deployment_is_rejected():
    for field in ("production_automation_enabled", "merge_or_deploy_automatically"):
        m = manifest()
        m[field] = True
        with pytest.raises(q.InvalidQueue):
            q.validate_manifest(m)


def test_reordered_or_duplicate_phases_are_rejected():
    m = manifest()
    m["phases"][4], m["phases"][5] = m["phases"][5], m["phases"][4]
    with pytest.raises(q.InvalidQueue):
        q.validate_manifest(m)


def test_skipping_itm04_to_start_itm05_is_rejected():
    m = manifest()
    m["phases"][3]["dependencies"].clear()
    with pytest.raises(q.InvalidQueue):
        q.validate_manifest(m)


def test_no_later_phase_can_skip_its_immediate_predecessor():
    for phase_index in range(1, 14):
        m = manifest()
        m["phases"][phase_index]["dependencies"].clear()
        with pytest.raises(q.InvalidQueue):
            q.validate_manifest(m)


def test_default_queue_never_claims_green():
    rows = q.evaluate_queue(manifest())
    assert len(rows) == 14
    assert all(p["state"] == "BLOCKED" for p in rows)
    assert "no independently verified phase certificate" in rows[0]["blockers"]


def test_pasted_green_checks_without_independent_current_sha_are_rejected():
    m = manifest()
    cert = passed(m["phases"][0])
    rows = q.evaluate_queue(m, {"phase_certificates": {"ITM-02": cert}})
    assert rows[0]["state"] == "BLOCKED"
    assert any("independently confirmed" in x for x in rows[0]["blockers"])


def test_exact_head_evidence_certifies_only_current_phase():
    m = manifest()
    cert = passed(m["phases"][0])
    rows = q.evaluate_queue(m, {"phase_certificates": {"ITM-02": cert}},
                            {"ITM-02": head()})
    assert rows[0]["state"] == "CERTIFIED"
    assert rows[1]["state"] == "BLOCKED"


def test_stale_or_skipped_check_always_blocks():
    m = manifest()
    cert = passed(m["phases"][0])
    name = m["phases"][0]["required_checks"][0]
    for bogus in ["skipped", "failure", "cancelled", None]:
        stale = deepcopy(cert)
        stale["checks"][name]["conclusion"] = bogus
        rows = q.evaluate_queue(m, {"phase_certificates": {"ITM-02": stale}},
                                {"ITM-02": head()})
        assert rows[0]["state"] == "BLOCKED"
    stale = deepcopy(cert)
    stale["checks"][name]["head_sha"] = "b" * 40
    assert q.evaluate_queue(m, {"phase_certificates": {"ITM-02": stale}},
                            {"ITM-02": head()})[0]["state"] == "BLOCKED"


def test_human_release_approval_is_never_implicit():
    m = manifest()
    phase = next(x for x in m["phases"] if x["id"] == "ITM-10")
    assert "RELEASE_APPROVED" in phase["required_approvals"]
    phase = next(x for x in m["phases"] if x["id"] == "ITM-14")
    assert "STAGE_B_APPROVED" in phase["required_approvals"]


def test_uncorroborated_stage_a_is_hard_block():
    m = manifest()
    cert = passed(m["phases"][0])
    cert["stage_a_untouched"] = False
    assert q.evaluate_queue(m, {"phase_certificates": {"ITM-02": cert}},
                            {"ITM-02": head()})[0]["state"] == "BLOCKED"


def test_public_chromium_required_after_deployment():
    m = manifest()
    x = next(p for p in m["phases"] if p["id"] == "ITM-11")
    assert "public-chromium-all-four" in x["required_checks"]
    assert x["dependencies"] == ["ITM-10"]


def test_stage_a_must_remain_owned_by_pr204():
    m = manifest()
    m["stage_a_exclusive_pr"] = 209
    with pytest.raises(q.InvalidQueue):
        q.validate_manifest(m)
