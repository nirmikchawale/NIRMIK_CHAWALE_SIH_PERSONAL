#!/usr/bin/env python3
"""Fail-closed scope audit for MPR-10–17 release and safe maintenance candidates.

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
    # Exact UI-only portability exceptions for the renderer-owned block control
    # relocation. CI tests enforce original globe selection/science behavior.
    "frontend/src/components/OceanGlobe.tsx",
    "frontend/src/components/ImmersiveFullscreenButton.tsx",
    "frontend/src/components/BlockDetailsWorkspace.tsx",
    "frontend/src/components/PresentationGuide.tsx",
    "frontend/src/components/ExplorerConsolidationHost.tsx",
    "frontend/src/theme.ts",
    "frontend/index.html",
    "docs/MPR_DESKTOP_JOURNEY_ARCTIC_IMMERSIVE.md",
    "frontend/e2e/main-block-globe-integration.spec.ts",
    # Mobile HUD acceptance follows its existing relocation into ControlPanel.
    "frontend/e2e/main-block-engine.spec.ts",
    # Post-release RUI-02/MPR integration hardening: presentation + acceptance only.
    "frontend/src/components/ScientificContextHeader.tsx",
    "frontend/e2e/rui-context-header.spec.ts",
    "docs/MPR_SCIENTIFIC_CONTEXT_CONSOLIDATION.md",
    "frontend/src/linked-view-integrity.ts",
    # Existing app regression tests repaired using the 3DB-15 owner branch.
    "frontend/e2e/live.spec.ts",
    # Non-scientific Playwright selector migrations for the current MPR-12
    # DOM. These exact test files preserve checks for withheld planned data.
    "frontend/e2e/journey.spec.ts",
    "frontend/e2e/3db05-geographic-water-column-sync.spec.ts",
    # These exact existing full-browser acceptance cases validate the original
    # source-backed 3DB-07 & 3DB-15 behavior against MPR's relocated controls.
    # Do not add a broad 3DB or numerical-source exception.
    "frontend/e2e/3db07-time-aware-ocean-block-field.spec.ts",
    "frontend/e2e/3db15-stage-switch-basemap.spec.ts",
    "frontend/e2e/rui-nav-01-file-manager-shell.spec.ts",
    "frontend/e2e/document-layout.spec.ts",
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

# Independently reviewed recovery files from M001–M007. These exceptions are
# only available with the explicit joint integration gate; all raw ocean
# datasets, source registries, APIs, backend sources and NetCDF stay forbidden.
REVIEWED_SCIENCE_RECOVERY = frozenset({
    "docs/requirements/M001_M007_BASELINE_AUDIT.md",
    "scripts/fetch_verified_observation_breadth.py",
    "tests/test_m001_m007_scientific_baseline.py",
})


# ITM-05-B: exactly the previously CI-certified ITM-02 parent safety files,
# plus the independently reviewed M001-M007 science recovery trio. This is
# NOT an unrestricted allowance to edit safety/science files in a stacked PR.
# The candidate must descend from the exact parent, and ALL six original
# protected files must retain their pinned parent Git blob SHA unchanged.
ITM02_CERTIFIED_PARENT = "00a04a8ad09317cdc00e2d999ae7ede2c983c02d"
ITM02_INHERITED_BLOBS = {
    ".github/scripts/release-conductor.cjs": "bb0aa56e53f83389037701f9a1112c6fb0ff9648",
    ".github/workflows/release-conductor.yml": "813542f7a2b1ab19c7bd91d119bfffc85a823657",
    "scripts/test_release_conductor.cjs": "cfaec2d312fde2ca9a6b871534ac83461ab3da6a",
    "docs/requirements/M001_M007_BASELINE_AUDIT.md": "573a1232ecb592f5dcbf006baea76ce279fdc699",
    "scripts/fetch_verified_observation_breadth.py": "7a4f5f5025c59f337b813fc89a854c6205a37b17",
    "tests/test_m001_m007_scientific_baseline.py": "016020ce9cbe734ab77ca3163e17daee121a8c83",
}



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
    parser.add_argument("--reviewed-m001-m007-package", action="store_true",
                        help="Allow exactly the paired M001–M007 provider+test+audit trio")
    parser.add_argument("--reviewed-itm05-stack", action="store_true",
                        help="Allow ONLY the exact immutable ITM-02 safety+M001–M007 scientific parent blobs")
    args = parser.parse_args()
    changed = [p for p in git("diff", "--name-only", f"{args.base}...{args.head}").splitlines() if p]
    reviewed_science = bool(args.reviewed_m001_m007_package or args.reviewed_itm05_stack)
    reviewed = set(REVIEWED_SCIENCE_RECOVERY) if reviewed_science else set()
    if args.reviewed_itm05_stack:
        reviewed.update(ITM02_INHERITED_BLOBS)
    unexpected_science = set(REVIEWED_SCIENCE_RECOVERY).intersection(changed)
    forbidden = [path for path in changed if
                 path.startswith(DANGEROUS_PREFIXES) or
                 path.lower().endswith(DANGEROUS_SUFFIXES) or
                 not (allowed(path) or path in reviewed)]
    # Provider-side scientific changes are NEVER released without both the
    # genuine-source audit and numerical/immutable regression suite.
    if unexpected_science and unexpected_science != reviewed:
        forbidden.append("INCOMPLETE_REVIEWED_SCIENCE_RECOVERY_TRIO")
    if reviewed_science and not unexpected_science:
        forbidden.append("REVIEWED_SCIENCE_RECOVERY_ABSENT")
    if args.reviewed_itm05_stack:
        # Never accept a different integration ancestry or silently permit
        # edits to any inherited safety/scientific implementation.
        if subprocess.run(
            ["git", "merge-base", "--is-ancestor", ITM02_CERTIFIED_PARENT, args.head],
            check=False, capture_output=True
        ).returncode != 0:
            forbidden.append("ITM02_CERTIFIED_PARENT_NOT_ANCESTOR")
        absent = sorted(set(ITM02_INHERITED_BLOBS).difference(changed))
        if absent:
            forbidden.extend(f"ITM05_EXPECTED_PARENT_PATH_MISSING:{p}" for p in absent)
        for path, expected_blob in ITM02_INHERITED_BLOBS.items():
            try:
                actual_blob = git("rev-parse", f"{args.head}:{path}")
            except subprocess.CalledProcessError:
                actual_blob = "MISSING"
            if actual_blob != expected_blob:
                forbidden.append(f"ITM05_PROTECTED_BLOB_CHANGED:{path}")
    # Validate the actual candidate tree, NOT only the PR diff. Once MPR-10–17
    # is merged, valid maintenance PRs inherit its eight immutable ledgers.
    # The old diff-only check falsely rejected safe post-release UI fixes.
    documents = [f"docs/RUI_MPR_{index:02d}_" for index in range(10, 18)]
    head_tree = git("ls-tree", "-r", "--name-only", args.head).splitlines()
    present_docs = [p for p in head_tree if p.startswith(DOC_PREFIX) and p.endswith(".md")]
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
        "reviewed_m001_m007_science_package": sorted(unexpected_science),
        "itm05_certified_parent": ITM02_CERTIFIED_PARENT if args.reviewed_itm05_stack else None,
        "itm05_inherited_protected_blob_paths": sorted(ITM02_INHERITED_BLOBS) if args.reviewed_itm05_stack else [],
        "itm05_inherited_blobs_immutable": args.reviewed_itm05_stack and not any(
            str(error).startswith("ITM05_PROTECTED_BLOB_CHANGED:")
            for error in forbidden
        ),
        "scientific_raw_data_and_backend_unchanged": not any(
            path.startswith(DANGEROUS_PREFIXES) or path.lower().endswith(DANGEROUS_SUFFIXES)
            for path in changed),
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
    if args.reviewed_itm05_stack:
        print("SCOPE PASSED: exact inherited certified ITM-02 safety and M001-M007 blobs remain immutable.")
    elif args.reviewed_m001_m007_package:
        print("SCOPE PASSED: original MPR UI plus strictly reviewed M001–M007 scientific recovery trio.")
    else:
        print("SCOPE PASSED: changed surfaces are MPR UI, tests, docs and certification only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
