"""ITM-09–15 production certification requires real exact-main and Chromium."""
from copy import deepcopy

import pytest

from scripts import itm_production_evidence as audit
from scripts.itm_phase_queue import InvalidQueue

SHA = "b" * 40
OTHER = "c" * 40


def pages_jobs():
    return [
        {"name": "build", "status": "completed", "conclusion": "success"},
        {"name": "deploy", "status": "completed", "conclusion": "success"},
        *[{"name": f"verify-public ({i})", "status": "completed", "conclusion": "success"}
          for i in range(1, 5)],
    ]


def final_jobs():
    return [
        *[{"name": name, "status": "completed", "conclusion": "success"}
          for name in ("react-cesium", "science-api-and-fallback", "static-hosted-failsafe")],
        *[{"name": f"static-browser-acceptance ({i})", "status": "completed", "conclusion": "success"}
          for i in range(1, 5)],
    ]


def fixture(repeats=1):
    runs, jobs = [], {}
    for i in range(repeats):
        p = 100 + i
        f = 200 + i
        for rid, name in ((p, audit.PAGES_NAME), (f, audit.FINAL_NAME)):
            runs.append({"id": rid, "name": name, "head_sha": SHA,
                         "event": "push", "status": "completed",
                         "conclusion": "success", "created_at": f"2026-10-18T{10+i:02d}:00:00Z"})
        jobs[str(p)] = pages_jobs()
        jobs[str(f)] = final_jobs()
    return {"main_sha": SHA, "runs": runs, "jobs": jobs,
            "rollback_baseline_sha": OTHER}


def test_real_exact_main_and_four_public_shards_are_required():
    r = audit.assess_production(fixture())
    assert r["itm11_publication_certified"] is True
    assert r["itm12_repeat_certified"] is False


def test_repeated_independent_runs_and_rollback_sha_pass_itm12_only():
    r = audit.assess_production(fixture(repeats=2))
    assert r["itm11_publication_certified"] is True
    assert r["itm12_repeat_certified"] is True
    assert r["itm14_stage_b"] == "NOT_AUTHORIZED_BY_THIS_TOOL"
    assert r["itm15_final"] == "NOT_AUTHORIZED_BY_THIS_TOOL"


def test_skipped_or_missing_public_shard_cannot_certify():
    for kind in ("skip", "remove", "duplicate"):
        x = fixture()
        jobs = x["jobs"]["100"]
        if kind == "skip":
            jobs[-1]["conclusion"] = "skipped"
        elif kind == "remove":
            jobs.pop()
        else:
            jobs[-1]["name"] = jobs[-2]["name"]
        assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_page_upload_success_does_not_override_public_browser_failure():
    x = fixture()
    x["runs"][0]["conclusion"] = "failure"
    assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_skipped_final_mvp_science_gate_blocks_public_acceptance():
    x = fixture()
    x["jobs"]["200"][1]["conclusion"] = "failure"
    assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_old_head_green_results_are_not_new_main_certification():
    x = fixture()
    x["main_sha"] = OTHER
    assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_invalid_or_missing_main_sha_fails_closed():
    x = fixture()
    x["main_sha"] = "deadbeef"
    with pytest.raises(InvalidQueue):
        audit.assess_production(x)


def test_release_conductor_noop_does_not_count_as_pages():
    x = fixture()
    for r in x["runs"]:
        if r["name"] == audit.PAGES_NAME:
            r["name"] = "ocean-canvas-release-conductor"
    assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_production_evidence_always_requires_separate_human_stage_b():
    r = audit.assess_production(fixture(repeats=2))
    assert r["itm13_stage_a_handoff"] != "CERTIFIED"
    assert r["itm14_stage_b"] != "CERTIFIED"
    assert r["automatic_merge_or_deploy"] is False


def test_bare_or_out_of_range_public_shard_never_substitutes_for_shard_four():
    for substitute in ("verify-public", "verify-public (5)"):
        x = fixture()
        x["jobs"]["100"][-1]["name"] = substitute
        assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_bare_or_out_of_range_final_mvp_shard_never_substitutes_for_shard_four():
    for substitute in ("static-browser-acceptance", "static-browser-acceptance (5)"):
        x = fixture()
        x["jobs"]["200"][-1]["name"] = substitute
        assert audit.assess_production(x)["itm11_publication_certified"] is False


def test_pending_final_mvp_shard_never_certifies():
    x = fixture()
    x["jobs"]["200"][-1]["status"] = "in_progress"
    assert audit.assess_production(x)["itm11_publication_certified"] is False


@pytest.mark.parametrize("rollback", ["invalid", "", None, SHA])
def test_invalid_or_current_main_rollback_never_certifies_repeat(rollback):
    x = fixture(repeats=2)
    x["rollback_baseline_sha"] = rollback
    result = audit.assess_production(x)
    assert result["itm11_publication_certified"] is True
    assert result["itm12_repeat_certified"] is False


@pytest.mark.parametrize("latest_workflow", [audit.PAGES_NAME, audit.FINAL_NAME])
def test_latest_failed_run_blocks_repeat_even_when_two_older_runs_pass(latest_workflow):
    x = fixture(repeats=3)
    latest = next(run for run in x["runs"]
                  if run["name"] == latest_workflow and run["id"] in {102, 202})
    latest["conclusion"] = "failure"
    result = audit.assess_production(x)
    assert result["itm11_publication_certified"] is False
    assert result["itm12_repeat_certified"] is False
