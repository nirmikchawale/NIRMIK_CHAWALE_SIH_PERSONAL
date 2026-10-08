# 3DB-14 — Full Block Capability Audit

## Authoritative checkpoint
Started from main `393736853d96cce0c1b30257b7ba19fdf3e57fab` (3DB-13 merged and exact-main tests/final-mvp/Pages successful). Parallel RUI/MPR PRs, all 16 design themes, and the independent model-observation comparison PR #159 are out of scope.

## What this audit proves
The canonical manifest is deep-validated, including every original source file's SHA-256, native coordinates, array dimensions, non-synthetic values and provenance. The manifest ID/date sets are cross-checked with the TypeScript runtime selectors. A deterministic 140-row machine-readable report is committed to `frontend/public/main-blocks/capability-audit.json`, so it can be publicly served through GitHub Pages once this phase's deployment passes. Browser tests compare every report row with the live TypeScript scientific readiness projection, and verify HTTP accessibility and native bytes for representative pilots.

The report distinguishes materialized source-backed pilots from geography-only logical targets; excludes the single immutable independently observation-validated baseline from the 140 logical blocks; and **does not** pretend a per-block GPU end-to-end render test was performed simply because the Cesium/Water Column runtime gate is eligible.

## Defensible results and limitations
- 140 logical geographic targets; 35 source-backed pilot blocks; **105 geography-only, scientifically locked** targets; six source-backed multi-date pilots; 41 original SHA-256 source payload frames.
- 35 pilots have genuine temperature, salinity and horizontal-current components, depth and dates from source. They are Cesium/Water Column *contract-ready*, not independently Argo-validated.
- No new pilot Argo independent model-observation validations are claimed; verified GLORYS12V1 baseline has its own 2024-01-02 observation-comparison evidence and 31 native depth levels.
- All geographically eligible but unmaterialized blocks still require acquisition, source authentication, payload validation, renderer acceptance and deployment. Land targets must remain locked.
- `individualProduction3DRenderProven: false` denotes **not assessed individually by this audit**, not a claim that the renderer fails.
- Source validation is a CI/check execution fact; independent live browser and GitHub Pages publication require separate production workflow passes. A PR or local build does not establish public availability.

## Non-fabrication / concurrency
No source bytes, coordinates, measurements, original SHA-256 manifest digests, timestamps, renderer science, QC, observations, CSS, navigation, features or 16 themes were changed. Report changes are informational and read-only. No parallel RUI-owned files edited.

## Reproduction
`python -m scripts.audit_3db14_capabilities --check` fails when report and canonical scientific source/runtime disagree. `--write` regenerates only the audit JSON after full native source verification. The dedicated 3DB-14 workflow runs source verification, Python negative tests, frontend build/typecheck and browser published-asset tests. All normal `tests` and `final-mvp` shared gates must pass on the exact PR head.

## Roadmap interpretation
Completing 3DB-14 and 3DB-15 means the **verified available** 3D rendering capabilities have been accepted and publicly deployed. It **does not materialize the 105 missing targets**. Delivering all 140 genuine 3D models would require an additional scientific data acquisition/coverage expansion milestone outside the currently authored 16-phase roadmap.

## Phase acceptance (populate after independent evidence)
- Base SHA: `393736853d96cce0c1b30257b7ba19fdf3e57fab`
- Branch: `3db-14-full-block-capability-audit`
- PR/merge SHA: not recorded before merge
- Exact-main Pages/live Chromium: not recorded before deployment
- Next phase: **3DB-15 — Final 3D Block Acceptance & Production Deployment**.
