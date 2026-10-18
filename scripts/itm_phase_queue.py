#!/usr/bin/env python3
"""ITM build-ahead / certification-in-order queue. READ-ONLY by design.

The build train can prepare ITM-05..15 code without bypassing the existing
ITM-02, ITM-03 and ITM-04 release gates. This tool NEVER merges, deploys,
approves, dispatches workflows, or writes to GitHub.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "docs/integration/ITM_05_15_BUILD_QUEUE.json"
REPO = "nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL"
SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")
ACCEPTED_CONCLUSION = "success"
READ_ONLY_METHOD = "GET"
REQUIRED_RELEASE_APPROVALS = {"RELEASE_APPROVED", "STAGE_A_CERTIFIED", "STAGE_B_APPROVED", "FINAL_RELEASE_APPROVED"}


class InvalidQueue(ValueError):
    """An invalid queue or evidence contract must fail closed."""


def load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise InvalidQueue("Root must be a JSON object")
    return data


def validate_manifest(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    if manifest.get("schema_version") != 1:
        raise InvalidQueue("Unsupported schema version")
    if manifest.get("production_automation_enabled") is not False:
        raise InvalidQueue("Production automation must remain disabled")
    if manifest.get("merge_or_deploy_automatically") is not False:
        raise InvalidQueue("Automatic merge/deployment prohibited")
    phases = manifest.get("phases")
    if not isinstance(phases, list):
        raise InvalidQueue("phases must be a list")
    expected = [f"ITM-{i:02d}" for i in range(2, 16)]
    ids = [p.get("id") for p in phases]
    if ids != expected:
        raise InvalidQueue(f"Expected ordered unique phases {expected}, received {ids}")
    seen: set[str] = set()
    for phase in phases:
        pid = phase["id"]
        deps = phase.get("dependencies")
        checks = phase.get("required_checks")
        approvals = phase.get("required_approvals")
        if not isinstance(deps, list) or any(x not in seen for x in deps):
            raise InvalidQueue(f"{pid} has unresolved, reordered, or unknown dependency")
        if not isinstance(checks, list) or not checks or len(set(checks)) != len(checks):
            raise InvalidQueue(f"{pid} lacks unambiguous required checks")
        if not isinstance(approvals, list):
            raise InvalidQueue(f"{pid} missing approval contract")
        if not set(approvals).issubset(REQUIRED_RELEASE_APPROVALS):
            raise InvalidQueue(f"{pid} has unknown approval marker")
        if phase.get("default_certification") != "NOT_CERTIFIED":
            raise InvalidQueue(f"{pid} cannot be certified by default")
        seen.add(pid)
    for pid, prereq in [("ITM-03", "ITM-02"), ("ITM-04", "ITM-03"),
                        ("ITM-05", "ITM-04"), ("ITM-14", "ITM-13"),
                        ("ITM-15", "ITM-14")]:
        phase = phases[expected.index(pid)]
        if prereq not in phase["dependencies"]:
            raise InvalidQueue(f"{pid} must depend on {prereq}")
    if manifest.get("stage_a_exclusive_pr") != 204:
        raise InvalidQueue("Stage A exclusive PR #204 must be preserved")
    return phases


def evaluate_queue(manifest: dict[str, Any], evidence: dict[str, Any] | None = None,
                   observed_heads: dict[str, str] | None = None) -> list[dict[str, Any]]:
    """Fail-closed certification evaluation, never a release authorization.

    A green result requires ALL phase checks and approvals at a single exact
    current head. Caller must supply independently observed current refs;
    an unverified pasted certificate is not sufficient.
    """
    phases = validate_manifest(manifest)
    certs = (evidence or {}).get("phase_certificates", {})
    if not isinstance(certs, dict):
        raise InvalidQueue("phase_certificates must be an object")
    heads = observed_heads or {}
    completed: set[str] = set()
    rows = []
    for phase in phases:
        pid = phase["id"]
        missing = [x for x in phase["dependencies"] if x not in completed]
        cert = certs.get(pid)
        reasons = []
        if missing:
            reasons.append("dependencies incomplete: " + ", ".join(missing))
        if not isinstance(cert, dict):
            reasons.append("no independently verified phase certificate")
        else:
            sha = cert.get("head_sha")
            if not isinstance(sha, str) or not SHA_PATTERN.fullmatch(sha):
                reasons.append("invalid exact 40-character phase SHA")
            # Independently verified source-head input is essential; do not
            # trust a certificate that repeats its own SHA as 'current'.
            if not isinstance(heads.get(pid), str) or heads[pid] != sha:
                reasons.append("current phase head not independently confirmed")
            checks = cert.get("checks")
            if not isinstance(checks, dict):
                reasons.append("missing exact-head CI evidence")
            else:
                for name in phase["required_checks"]:
                    row = checks.get(name)
                    if not isinstance(row, dict) or row.get("conclusion") != ACCEPTED_CONCLUSION or row.get("head_sha") != sha:
                        reasons.append(f"check missing, stale, skipped or failed: {name}")
            approvals = cert.get("approvals", [])
            if not isinstance(approvals, list):
                approvals = []
            for marker in phase["required_approvals"]:
                if marker not in approvals:
                    reasons.append(f"explicit approval absent: {marker}")
            if cert.get("stage_a_untouched") is not True:
                reasons.append("Stage A isolation not independently confirmed")
            if pid in {"ITM-10", "ITM-11", "ITM-12", "ITM-14", "ITM-15"}:
                if cert.get("release_artifact_verified") is not True:
                    reasons.append("merge/deployment artifact evidence absent")
            if pid in {"ITM-11", "ITM-12", "ITM-15"}:
                if cert.get("public_chromium_verified") is not True:
                    reasons.append("real public Chromium evidence absent")
        state = "CERTIFIED" if not reasons else "BLOCKED"
        if not reasons:
            completed.add(pid)
        rows.append({"phase": pid, "title": phase["title"], "state": state,
                     "dependencies": phase["dependencies"], "blockers": reasons,
                     "coding_can_proceed": pid >= "ITM-05" and pid <= "ITM-09"})
    return rows


def _github_read(path: str, token: str) -> dict[str, Any]:
    if not token:
        raise InvalidQueue("GITHUB_TOKEN required for independent live verification")
    request = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/{path}",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                 "User-Agent": "ocean-canvas-itm-read-only"},
        method=READ_ONLY_METHOD,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def live_snapshot(token: str) -> dict[str, Any]:
    """Retrieve current immutable evidence; no GitHub mutation endpoint."""
    main = _github_read("branches/main", token)
    pr_refs = {}
    check_runs = {}
    for pr in (204, 208, 209, 210):
        data = _github_read(f"pulls/{pr}", token)
        head = data["head"]["sha"]
        pr_refs[str(pr)] = {
            "head_sha": head, "base_sha": data["base"]["sha"],
            "draft": data["draft"], "merged": data["merged"], "state": data["state"],
        }
        checks = _github_read(f"commits/{head}/check-runs?per_page=100", token)
        check_runs[str(pr)] = [
            {"name": c["name"], "head_sha": head, "status": c["status"],
             "conclusion": c["conclusion"], "job_id": c["id"]}
            for c in checks.get("check_runs", [])
        ]
    return {
        "provenance": "live-read-only-github-api",
        "main_sha": main["commit"]["sha"],
        "prs": pr_refs, "checks": check_runs,
        "ready_for_release": False,  # human approval and public evidence are separate
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["validate", "plan", "snapshot", "verify"])
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--evidence", type=Path)
    parser.add_argument("--observed-heads", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    try:
        manifest = load_json(args.manifest)
        validate_manifest(manifest)
        if args.command == "validate":
            result = {"valid": True, "phases": len(manifest["phases"]),
                      "automatic_merge": False, "automatic_deploy": False}
        elif args.command == "snapshot":
            result = live_snapshot(os.environ.get("GITHUB_TOKEN", ""))
        else:
            evidence = load_json(args.evidence) if args.evidence else None
            heads = load_json(args.observed_heads) if args.observed_heads else None
            result = {"mode": manifest["mode"], "automatic_release": False,
                      "queue": evaluate_queue(manifest, evidence, heads),
                      "all_certified": False}
            result["all_certified"] = all(p["state"] == "CERTIFIED" for p in result["queue"])
            if args.command == "verify" and not result["all_certified"]:
                print(json.dumps(result, indent=2))
                return 2
        output = json.dumps(result, indent=2) + "\n"
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(output, encoding="utf-8")
        print(output, end="")
        return 0
    except (InvalidQueue, OSError, ValueError, KeyError, urllib.error.URLError) as exc:
        print(f"ITM queue failed closed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
