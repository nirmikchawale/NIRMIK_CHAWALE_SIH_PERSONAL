# Phase 3DB-01 — Block Materialization Foundation

## Execution master prompt

### Role
Act as the scientific materialization lead for SIH26067 Ocean Canvas. Execute 3DB-01 autonomously from the latest verified production state through implementation, validation, merge, deployment and live verification. Prefer the smallest truth-preserving change that makes later genuine block acquisition repeatable and fail-closed.

### Authoritative starting state
At phase start, the verified production `main` is `a0e6d407330a0022146b8e6dafda96b86f7dfafd`, the merge commit for 3DB-00. Treat a newer `main` discovered before merge as authoritative and reconcile rather than overwriting it.

The current scientific expansion registry contains:

- 140 logical Indian Ocean cells in 60–100°E, 5–25°N;
- 24 genuine source-backed/render-ready GLORYS12V1 pilot blocks;
- 6 multi-date pilots, as a subset of those 24;
- 116 planned/logical-only blocks;
- 0 materialized land-dominant blocks;
- 30 checksum-referenced source-backed payload files;
- the immutable `BASE-GLORYS-001` verified baseline separately from the 140-cell expansion registry.

The expansion manifest is `frontend/public/main-blocks/manifest.json`. Existing Phase 3.5B acquisition scripts are useful historical implementation evidence, but they are not permission to weaken the 3DB-00 canonical truth contract.

### Immutable scientific truth
Preserve the existing verified GLORYS12V1 baseline exactly. Never fabricate, relabel or infer scientific evidence. Never promote a logical block because it has an ID or geographic bounds. Never present interpolation as native evidence. Never claim vertical velocity when only horizontal `uo`/`vo` are present. Never invent timestamps, variables, observations, checksums, QC or validation.

A planned block remains scientifically locked until genuine source evidence is acquired and passes the materialization contract.

### 3DB-01 objective
Create a reusable, network-independent, fail-closed materialization foundation that later acquisition phases can call before changing canonical block truth. The foundation must make these checks explicit and reusable:

1. manifest schema and registry integrity;
2. exact logical block identity and geographic bounds;
3. ocean/coastal eligibility and land rejection;
4. source identity and provenance metadata;
5. source timestamp/date identity;
6. checksum integrity;
7. genuine longitude, latitude and depth coordinates;
8. depth ceiling and positive-down semantics;
9. required `thetao`, `so`, `uo`, `vo` evidence;
10. source-backed finite values and array-shape consistency;
11. all synthetic-science flags false;
12. no unsupported vertical current component;
13. one-to-one consistency between block-local records and global manifest records;
14. exact pilot/multi-date/integrity counters;
15. separation of geographic eligibility from source/data availability.

The foundation may expose deterministic target assessment and candidate-validation APIs. It must not fetch new data or mutate production evidence in 3DB-01.

### Scope boundary
3DB-01 owns reusable scientific materialization validation code, target eligibility / fail-closed source-evidence gates, scientific regression tests for those gates, and 3DB-01 execution/recovery documentation.

3DB-01 must not acquire or materialize a new block; alter `frontend/public/main-blocks/manifest.json` or any current payload; increase/decrease the 24 pilot count; add a timestamp or variable; attach observations to pilots; modify the immutable baseline; change API routing, Cesium rendering, Water Column rendering or scientific-context behavior; touch RUI-owned shell/navigation/global visual-system files; or redesign any UI.

### Parallel RUI boundary
RUI work may advance while this phase is active. Keep 3DB-01 additive and outside RUI-owned surfaces. Immediately before merge, re-read `main` and open modern PRs. If `main` moved, compare the 3DB-01 branch against the new head and reconcile on top of it. Never force-push over another workstream and never resolve a conflict by discarding newer RUI changes.

### Dependencies
Required existing contracts/evidence:

- `docs/3DB_MASTER_PROMPT.md`;
- `docs/3DB_00_BASELINE_AND_SCIENTIFIC_CONTRACT.md`;
- `frontend/src/main-block-capabilities.ts`;
- `frontend/src/main-block-engine.ts`;
- `frontend/src/main-block-runtime.ts`;
- `frontend/public/main-blocks/manifest.json`;
- `frontend/public/main-blocks/data/**`;
- `scripts/materialize_phase35b_pilots_chunked.py`;
- `scripts/materialize_phase35b_pilots_opendap.py`;
- `tests/test_phase35b_manifest.py`;
- `tests/test_3db00_block_capability_contract.py`.

Use current repository evidence rather than historical prose if any contradiction appears.

### Implementation rules
Build one reusable standard-library-first validation module so normal CI can run it without network access or acquisition-only dependencies. The module must raise a specific materialization-contract error on any truth-gate failure and must default to deep evidence validation.

Provide current inventory validation; block target assessment that distinguishes `already-materialized`, `eligible-geography-only`, and `blocked-land`; candidate payload validation for future acquisition; deterministic SHA-256 verification; safe relative payload-path validation; and command-line `verify` and `assess` entry points.

No function in 3DB-01 may silently write or promote production evidence. Promotion is intentionally deferred to 3DB-02, after acquisition produces a genuine candidate.

### Acceptance criteria
3DB-01 is merge-ready only if all of the following are true:

- the reusable validator accepts the current production manifest and every referenced payload;
- resulting inventory is exactly 140 logical / 24 materialized pilots / 116 planned / 6 multi-date / 30 payloads / 0 land materialized;
- a planned ocean/coastal cell is reported as geographically eligible but `source_available=false` and `data_available=false`;
- a planned land-dominant cell is rejected for acquisition;
- existing genuine payload evidence validates only for its exact block/date/bounds/source identity;
- synthetic-evidence flags, relabelled block identity, wrong bounds and wrong source identity are rejected;
- a planned block advertising a date/payload is rejected as a truth leak;
- existing 3DB-00 and Phase 3.5B tests continue to pass;
- no production manifest/payload diff exists;
- no RUI-owned file is changed.

### Validation matrix
Run, at minimum: new 3DB-01 regression tests; full repository `pytest`; Python compilation; frontend typecheck and production build; static/API/scientific fallback gates; complete browser acceptance/judge-flow; GitHub Pages build/deploy/public HTTPS/live Chromium judge-flow; branch-vs-main scope/concurrency review; and final production `main` SHA verification.

Never weaken or skip a failing gate. Diagnose and fix the implementation instead.

### Deployment requirements
Use a dedicated `3db-01-block-materialization-foundation` branch and PR to `main`. Merge only after required PR checks are green and after verifying the PR is based on the then-current authoritative `main` or safely reconciled with it.

After merge, verify the exact merge commit on `main`, post-merge `tests`, post-merge `final-mvp`, Pages deployment, public HTTPS check, and live Chromium judge-flow for the same authoritative merge state. Declare `LIVE & VERIFIED` only then.

### Recovery rules
- **source/evidence failure:** fail closed; do not rewrite evidence to fit the validator;
- **checksum mismatch:** stop and treat the payload as untrusted until provenance is resolved;
- **CI failure:** fix the root cause; never disable the test or relax scientific assertions;
- **parallel main movement:** reconcile onto the new `main`, rerun required gates, then merge;
- **merge conflict with RUI:** preserve newer RUI-owned code and reapply only narrow scientific foundation changes;
- **deployment failure:** keep the previous successful production deployment authoritative until corrected deployment passes;
- **partial write risk:** 3DB-01 performs no production evidence writes, so recovery is branch rollback/revert rather than data reconstruction;
- **unknown state:** report `BLOCKED` rather than claim completion.

### Required end-state report
Report phase status, pre-phase main SHA, branch, commits, PR, merge commit, post-merge workflow/deployment results, exact block counts, files changed, scientific behavior changed and intentionally unchanged, validation gates, limitations, concurrency notes and readiness for 3DB-02.

## Implemented 3DB-01 contract
The reusable foundation is `scripts/main_block_materialization.py`. It is deliberately read-only against canonical production evidence in this phase. It validates existing materialized evidence and provides target/candidate gates for the next acquisition phase.

The regression suite is `tests/test_3db01_materialization_foundation.py`.

## Intentional phase boundary
3DB-01 does **not** create a 25th pilot. The next phase, 3DB-02 — Genuine Pilot Block Acquisition, may acquire a new genuine candidate only through these gates and may update the canonical manifest only after source evidence has passed them.
