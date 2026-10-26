#!/usr/bin/env python3
"""Read-only ITM-09..15 Pages/CI/Stage-A production release evidence checker.

This tool cannot approve, merge, dispatch actions, or deploy. It refuses to
treat GitHub Pages HTTP 200, a skipped shard, or a successful conductor no-op
as real four-shard public Chromium certification.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
from pathlib import Path
from typing import Any

# Support both `python -m scripts.itm_production_evidence` and the
# standalone `python scripts/itm_production_evidence.py` CLI used by CI.
try:
    from scripts.itm_phase_queue import InvalidQueue, SHA_PATTERN, _github_read
except ModuleNotFoundError:
    from itm_phase_queue import InvalidQueue, SHA_PATTERN, _github_read

PAGES_NAME = "deploy-oceantwin-pages"
FINAL_NAME = "final-mvp"
MAIN_SHA_KEY = "head_sha"
PUBLIC_PREFIX = "verify-public"
EXPECTED_PUBLIC_SHARDS = 4
BASELINE_ROLLBACK_SHA_KEY = "rollback_baseline_sha"


def normalize_jobs(jobs: list[dict[str, Any]]) -> dict[str, Any]:
    """Summarize exact job conclusions without losing missing/duplicate shards."""
    public = [j for j in jobs if re.fullmatch(r"verify-public(?: \(\d+\))?", str(j.get("name", "")))]
    shard_names = [x.get("name") for x in public]
    # Require all four numbered shards; bare or out-of-range names cannot substitute.
    expected_names = {f"{PUBLIC_PREFIX} ({i})" for i in range(1, EXPECTED_PUBLIC_SHARDS + 1)}
    all_green = (len(public) == EXPECTED_PUBLIC_SHARDS and
                 set(shard_names) == expected_names and
                 all(j.get("status") == "completed" and
                     j.get("conclusion") == "success" for j in public))
    return {
        "public_shards": sorted(shard_names),
        "public_4_of_4_success": all_green,
        "jobs": [{"name": j.get("name"), "status": j.get("status"),
                  "conclusion": j.get("conclusion")} for j in jobs],
    }


def latest_matching_runs(runs: list[dict[str, Any]], workflow_name: str,
                         sha: str) -> list[dict[str, Any]]:
    return sorted(
        (x for x in runs if x.get("name") == workflow_name
         and x.get(MAIN_SHA_KEY) == sha and x.get("event") in {"push", "workflow_dispatch"}),
        key=lambda x: (x.get("created_at", ""), x.get("id", 0)),
        reverse=True,
    )


def assess_production(snapshot: dict[str, Any]) -> dict[str, Any]:
    sha = snapshot.get("main_sha")
    if not isinstance(sha, str) or not SHA_PATTERN.fullmatch(sha):
        raise InvalidQueue("Main SHA must be independently retrieved exact commit")
    runs = snapshot.get("runs")
    jobs = snapshot.get("jobs")
    if not isinstance(runs, list) or not isinstance(jobs, dict):
        raise InvalidQueue("Live actions run and job inventories required")
    pages = latest_matching_runs(runs, PAGES_NAME, sha)
    final = latest_matching_runs(runs, FINAL_NAME, sha)
    reasons = []
    if not pages:
        reasons.append("no matching exact-main Pages workflow run")
    if not final:
        reasons.append("no matching exact-main final-mvp workflow run")
    pages_ok = []
    for run in pages:
        jid = str(run["id"])
        info = normalize_jobs(jobs.get(jid, []))
        # A Pages run may have successful build/deploy but a FAILED public
        # acceptance job. The full workflow must be green as well.
        build = [x for x in info["jobs"] if x["name"] == "build"]
        deploy = [x for x in info["jobs"] if x["name"] == "deploy"]
        passed = (run.get("status") == "completed" and run.get("conclusion") == "success"
                  and len(build) == 1 and build[0]["conclusion"] == "success"
                  and len(deploy) == 1 and deploy[0]["conclusion"] == "success"
                  and info["public_4_of_4_success"])
        pages_ok.append({"run_id": run["id"], "success": passed, **info})
    final_ok = []
    for run in final:
        v = jobs.get(str(run["id"]), [])
        if not isinstance(v, list):
            raise InvalidQueue("Malformed final-mvp job evidence")
        names = {x.get("name"): x for x in v}
        required = {"react-cesium", "science-api-and-fallback", "static-hosted-failsafe"}
        # Browser matrix is named 'static-browser-acceptance' in final-mvp.
        browser_jobs = [x for x in v if re.fullmatch(
            r"static-browser-acceptance(?: \(\d+\))?", str(x.get("name", "")))]
        expected_browser = {f"static-browser-acceptance ({i})" for i in range(1, 5)}
        is_valid = (run.get("status") == "completed" and run.get("conclusion") == "success"
                    and all(names.get(name, {}).get("conclusion") == "success" for name in required)
                    and len(browser_jobs) == 4
                    and {j["name"] for j in browser_jobs} == expected_browser
                    and all(j.get("status") == "completed" and
                            j.get("conclusion") == "success" for j in browser_jobs))
        final_ok.append({"run_id": run["id"], "success": is_valid,
                         "browser_shards": [j.get("name") for j in browser_jobs]})
    publication = bool(pages_ok and pages_ok[0]["success"] and final_ok and final_ok[0]["success"])
    if not publication:
        reasons.append("latest exact-main Pages and final-mvp are not BOTH fully green")
    repeated = (len([p for p in pages_ok if p["success"]]) >= 2
                and len([f for f in final_ok if f["success"]]) >= 2)
    if not repeated:
        reasons.append("ITM-12 requires two independent successful live certification runs")
    baseline = snapshot.get(BASELINE_ROLLBACK_SHA_KEY)
    baseline_valid = isinstance(baseline, str) and bool(SHA_PATTERN.fullmatch(baseline))
    if not baseline_valid:
        reasons.append("recorded exact rollback main SHA missing or invalid")
    # Explicit human approvals cannot be inferred from repository checks.
    # Both are always separate from this read-only machine report.
    return {
        "exact_main_sha": sha,
        "pages": pages_ok,
        "final_mvp": final_ok,
        "itm11_publication_certified": publication,
        "itm12_repeat_certified": publication and repeated and baseline_valid,
        "itm13_stage_a_handoff": "NOT_AUTHORIZED_BY_THIS_TOOL",
        "itm14_stage_b": "NOT_AUTHORIZED_BY_THIS_TOOL",
        "itm15_final": "NOT_AUTHORIZED_BY_THIS_TOOL",
        "reasons": reasons,
        "automatic_merge_or_deploy": False,
    }


def capture_live(token: str) -> dict[str, Any]:
    if not token:
        raise InvalidQueue("GITHUB_TOKEN required; empty fixtures cannot certify production")
    main = _github_read("branches/main", token)["commit"]["sha"]
    # A busy repo has dozens of conductor no-op runs per hour. The first
    # actions/runs page can omit the most recent actual Pages/final-mvp runs,
    # so failing to paginate creates a false claim that those runs never ran.
    matched: list[dict[str, Any]] = []
    counts = {PAGES_NAME: 0, FINAL_NAME: 0}
    for page in range(1, 21):
        recent = _github_read(f"actions/runs?branch=main&per_page=100&page={page}", token)
        batch = recent.get("workflow_runs")
        if not isinstance(batch, list):
            raise InvalidQueue("GitHub returned malformed run pagination data")
        for run in batch:
            if run.get("name") in counts and run.get("head_sha") == main:
                matched.append(run)
                counts[run["name"]] += 1
        if all(value >= 2 for value in counts.values()) or len(batch) < 100:
            break
    else:
        raise InvalidQueue("GitHub run pagination exceeded 20 pages; never infer missing release results")
    jobs = {}
    for run in matched:
        rsp = _github_read(f"actions/runs/{run['id']}/jobs?per_page=100", token)
        items = rsp.get("jobs", [])
        if len(items) >= 100:
            raise InvalidQueue(f"Possible truncation in workflow {run['id']}")
        jobs[str(run["id"])] = items
    if _github_read("branches/main", token)["commit"]["sha"] != main:
        raise InvalidQueue("main advanced during Pages and final-mvp evidence collection")
    return {"provenance": "exact-main-github-actions-rest-read-only",
            "main_sha": main, "runs": matched, "jobs": jobs,
            BASELINE_ROLLBACK_SHA_KEY: None}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Previously captured live read-only JSON")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--rollback-sha", help="Recorded independently verified rollback SHA")
    parser.add_argument("--report-only", action="store_true",
                        help="Write honest blocked evidence report without certifying release")
    args = parser.parse_args(argv)
    try:
        snap = json.loads(args.input.read_text()) if args.input else capture_live(os.getenv("GITHUB_TOKEN", ""))
        if args.rollback_sha:
            snap[BASELINE_ROLLBACK_SHA_KEY] = args.rollback_sha
        result = assess_production(snap)
        data = json.dumps(result, indent=2) + "\n"
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(data, encoding="utf-8")
        print(data, end="")
        # Running from an incomplete production tree is not a successful
        # release certificate even if HTTP assets exist.
        return 0 if args.report_only or (result["itm11_publication_certified"] and result["itm12_repeat_certified"]) else 2
    except (OSError, ValueError, InvalidQueue, KeyError, urllib.error.URLError) as e:
        print(f"Production certification BLOCKED: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
