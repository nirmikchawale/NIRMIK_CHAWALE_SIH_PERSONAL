# Ocean Canvas 3DB-04 — Cesium 3D Rendering Engine

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** 3DB — scientific 3D block capability  
**Phase:** 3DB-04 — Cesium 3D Rendering Engine

## Mission

Formalize the existing Geographic 3D renderer as a fail-closed scientific rendering engine for the canonical 3DB block system. This phase does **not** acquire new ocean data and does not redesign the RUI/RUI-NAV shell. It makes the existing Cesium surface consume the scientific block capability contract explicitly and prevents stale or geography-only selections from being presented as source-backed 3D evidence.

## Authoritative phase input

3DB-04 starts from the completed 3DB-03 Geographic Block Engine and preserves:

- 140 canonical geographic target blocks over 60–100°E and 5–25°N;
- deterministic 3DB-03 point-to-block ownership;
- 25 genuine source-backed GLORYS12V1 pilot blocks;
- 115 planned/geography-only blocks;
- 6 genuine multi-date pilots;
- 31 checksum-addressed pilot payloads;
- 0 land blocks materialized;
- the separate immutable `BASE-GLORYS-001` baseline, which remains the independently model–observation validated reference;
- no synthetic measurements, timestamps, coordinates or depths;
- horizontal `uo`/`vo` currents only, with no vertical-current claim.

The payload manifest remains the truthful 3DB-02 acquisition record. 3DB-04 does not relabel or mutate it.

## Existing renderer reused

Ocean Canvas already had a production Cesium renderer and a historical source-backed pilot renderer bridge from Phase 3.5D. 3DB-04 deliberately reuses those assets rather than rebuilding them:

- `pilot-main-block-loader.ts` continues to supply exact source-backed pilot fields/volumes/currents;
- `OceanGlobe.tsx` remains the Cesium presentation surface;
- the existing palette, depth exaggeration, point inspection, current glyphs, imagery fallback and camera tools remain intact;
- RUI/RUI-NAV continues to own final placement, navigation hierarchy and visual restructuring.

The missing contract was between block scientific truth and Cesium primitive creation.

## New canonical render contract

`frontend/src/main-block-cesium-renderer.ts` is the 3DB-04 scientific gate.

For every scalar slice, scalar volume or current slice it:

1. derives the canonical block capability contract;
2. rejects scientific rendering when `cesiumReady` is false;
3. preserves the active block's canonical 3DB-03 geographic bounds;
4. verifies every source longitude/latitude lies within that block;
5. verifies depth is finite, non-negative and positive-down;
6. verifies the payload date belongs to the block's genuine available dates;
7. verifies the requested variable is genuinely available;
8. rejects empty scientific payloads;
9. validates horizontal-current speed against `sqrt(uo² + vo²)`;
10. explicitly records that current rendering is horizontal-only;
11. reports source sample count and source extent without inventing scientific points.

A planned cell returns a blocked render plan. It remains selectable geography but cannot create scientific Cesium primitives.

## Geographic Cesium synchronization in this phase

The previous globe contained two baseline-specific assumptions even while genuine pilots could be active:

- the globe translucency window was permanently hard-coded around the verified baseline;
- the selected depth-plane rectangle was permanently hard-coded to 67–70°E / 12–14°N.

3DB-04 replaces those assumptions with the active canonical block bounds. The visual vertical exaggeration remains cosmetic only; source depth values are not changed.

## Lifecycle truth on the Cesium surface

The compatibility helper historically named `isVerifiedBaseline()` returns true for both the baseline and pilots so older rendering code can treat both as materialized. It must **not** be used as a scientific label.

3DB-04 therefore renders lifecycle language from `materialization` directly:

- `verified-baseline` → **VERIFIED BASELINE**;
- `pilot` → **SOURCE-BACKED PILOT**;
- `planned` → **PLANNED**.

A pilot is genuine source-backed evidence but does not inherit the baseline's independent Argo/model-observation validation claim.

## Fail-closed renderer behavior

When a user selects a planned block, the geographic footprint stays active but existing baseline/pilot scientific primitives are removed rather than remaining stale under the planned block identity.

When materialized scientific data fail the 3DB-04 contract (for example, a coordinate outside the active block, an unavailable timestamp, malformed shape or inconsistent current speed), the scientific primitive is rejected and the existing renderer fallback surface reports the contract error. No corrective or synthetic scientific values are generated.

## RUI / RUI-NAV boundary

3DB-04 changes only renderer-science semantics needed for scientific correctness. It does not create a new navigation surface, sidebar, inspector architecture, glass treatment or file-manager node.

The approved RUI-NAV hierarchy remains authoritative. Later RUI-NAV work may move or consolidate the existing block controls, Display Range and other Explorer controls without reimplementing 3DB-04 scientific logic.

This is the required **SYNC-A (RUI-04 ↔ 3DB-04)** boundary: RUI may change presentation around the Geographic renderer; 3DB-04 owns whether a block is scientifically allowed to render and what native coordinates/time/depth evidence that rendering represents.

## Acceptance criteria

3DB-04 is complete only when all of the following are true:

1. `MAIN_BLOCK_CESIUM_RENDERER_VERSION` is `3db-04-v1`.
2. The immutable verified baseline is Cesium-ready and remains independently validated.
3. All 25 genuine pilots remain eligible for Cesium scientific rendering through the capability contract.
4. All 115 planned cells remain geographic-only and fail closed for scientific primitives.
5. Scalar slices validate canonical block bounds, genuine time, native depth and finite source samples.
6. Scalar volumes validate every source coordinate/depth before primitive creation.
7. Current slices verify speed from native `uo`/`vo` only and do not create a vertical component.
8. Globe translucency and selected depth-plane footprint follow the active block bounds rather than baseline literals.
9. Pilot labels say source-backed pilot, not independently verified baseline.
10. 25 pilots / 115 planned / 6 multi-date / 31 payloads / 0 land materialized remain unchanged.
11. TypeScript, production build, Python scientific regressions and complete hosted browser acceptance pass.
12. Before merge, latest `main` and active RUI/RUI-NAV work are reconciled; no stale branch is merged.
13. After merge, exact-main `tests`, `final-mvp`, Pages build/deploy, HTTPS verification and live Chromium judge-flow all pass.

## Rollback

The implementation branch is `3db-04-cesium-3d-rendering-engine`, created from the authoritative production `main` observed at phase start.

Rollback is a normal revert of the 3DB-04 merge commit. Do not force-reset public `main`. 3DB-00 through 3DB-03 contracts and the 3DB-02 source payloads remain valid independent evidence.
