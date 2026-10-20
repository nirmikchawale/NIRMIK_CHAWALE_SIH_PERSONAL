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


def test_live_audit_paginates_past_busy_conductor_runs(monkeypatch):
    """Genuine Pages results may be on page 2 behind many conductor no-ops."""
    expected = fixture()
    queried = []
    def fake_read(path, token):
        assert token == "read-only-test"
        queried.append(path)
        if path == "branches/main":
            return {"commit": {"sha": SHA}}
        if path == "actions/runs?branch=main&per_page=100&page=1":
            return {"workflow_runs": [
                {"id": i, "name": "ocean-canvas-release-conductor",
                 "head_sha": SHA, "event": "schedule"}
                for i in range(1, 101)
            ]}
        if path == "actions/runs?branch=main&per_page=100&page=2":
            return {"workflow_runs": expected["runs"]}
        if path == "actions/runs/100/jobs?per_page=100":
            return {"jobs": expected["jobs"]["100"]}
        if path == "actions/runs/200/jobs?per_page=100":
            return {"jobs": expected["jobs"]["200"]}
        raise AssertionError(f"Unexpected GitHub endpoint: {path}")
    monkeypatch.setattr(audit, "_github_read", fake_read)
    snap = audit.capture_live("read-only-test")
    assert any("page=2" in value for value in queried)
    assert len(snap["runs"]) == 2
    assert audit.assess_production(snap)["itm11_publication_certified"] is True


def test_mid_read_main_sha_race_blocks_live_certification(monkeypatch):
    expected = fixture()
    calls = {"main": 0}
    def fake_read(path, token):
        if path == "branches/main":
            calls["main"] += 1
            return {"commit": {"sha": SHA if calls["main"] == 1 else OTHER}}
        if path == "actions/runs?branch=main&per_page=100&page=1":
            return {"workflow_runs": expected["runs"]}
        if path == "actions/runs/100/jobs?per_page=100":
            return {"jobs": expected["jobs"]["100"]}
        if path == "actions/runs/200/jobs?per_page=100":
            return {"jobs": expected["jobs"]["200"]}
        raise AssertionError(f"Unexpected GitHub endpoint: {path}")
    monkeypatch.setattr(audit, "_github_read", fake_read)
    with pytest.raises(InvalidQueue, match="main advanced"):
        audit.capture_live("read-only-test")
