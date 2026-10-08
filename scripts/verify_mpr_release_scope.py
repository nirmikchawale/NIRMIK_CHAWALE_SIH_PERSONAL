#!/usr/bin/env python3
"""Fail-closed scope audit for Ocean Canvas RUI MPR-10–17 release candidates.

All numerical science/3DB/data/provenance/API sources are protected. Run against
latest main as the comparison base, not only a stacked PR's immediate parent.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

EXACT_FILES = {
    "frontend/src/App.tsx",
    "frontend/src/main.tsx",
    "frontend/src/components/ControlPanel.tsx",
    "frontend/src/components/SmartDualViewNavigator.tsx",
    "frontend/src/components/WaterColumnControlDock.tsx",
    "frontend/src/components/ExplorerInspectorAccess.tsx",
    "frontend/src/linked-view-integrity.ts",
    "scripts/verify_mpr_release_scope.py",
    ".github/workflows/mpr-release-certification.yml",
}
DOC_PREFIX = "docs/RUI_MPR_"
TEST_PREFIX = "frontend/e2e/mpr-"
CSS_PREFIX = "frontend/src/mpr-"
DANGEROUS_PREFIXES = (
    "backend/", "api/", "data/", "oceantwin/", "src/",
    "frontend/public/science-static/", "frontend/public/operational/",
    "frontend/public/observations/", "frontend/public/scientific/",
)
DANGEROUS_SUFFIXES = (".nc", ".nc4", ".netcdf", ".zarr", ".h5", ".hdf5")


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def allowed(path: str) -> bool:
    if path in EXACT_FILES:
        return True
    if path.startswith(DOC_PREFIX) and path.endswith(".md"):
        return True
    if path.startswith(TEST_PREFIX) and path.endswith(".spec.ts"):
        return True
    if path.startswith(CSS_PREFIX) and path.endswith(".css"):
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--output", default="mpr-release-scope.json")
    args = parser.parse_args()
    changed = [p for p in git("diff", "--name-only", f"{args.base}...{args.head}").splitlines() if p]
    forbidden = [path for path in changed if
                 path.startswith(DANGEROUS_PREFIXES) or
                 path.lower().endswith(DANGEROUS_SUFFIXES) or
                 not allowed(path)]
    # Ensure all eight intended phase docs are present in release tree.
    documents = [f"docs/RUI_MPR_{index:02d}_" for index in range(10, 18)]
    present_docs = [p for p in changed if p.startswith(DOC_PREFIX) and p.endswith(".md")]
    missing = [prefix for prefix in documents if not any(p.startswith(prefix) for p in present_docs)]
    manifest = {
        "schema": "oceancanvas-mpr-release-scope-v1",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "base": git("rev-parse", args.base),
        "head": git("rev-parse", args.head),
        "source_changes_checked": len(changed),
        "changed_files": changed,
        "forbidden_files": forbidden,
        "missing_phase_docs": missing,
        "science_backend_registry_and_datasets_untouched": len(forbidden) == 0,
        "all_eight_phase_ledgers_present": len(missing) == 0,
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({k: v for k, v in manifest.items() if k != "changed_files"}, indent=2))
    if forbidden or missing:
        print("RELEASE BLOCKED: scope changed forbidden files or required phase documents are missing.")
        return 1
    print("SCOPE PASSED: changed surfaces are MPR UI, tests, docs and certification only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
