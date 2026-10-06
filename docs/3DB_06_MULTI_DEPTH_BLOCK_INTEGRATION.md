# 3DB-06 — Multi-Depth Block Integration

## Phase objective

3DB-06 closes the depth-integration gap left intentionally open by the earlier block phases. The 25 source-backed pilot blocks already contain genuine GLORYS12V1 water-column payloads; this phase does **not** acquire or invent additional scientific data. It makes the retained native source depth axis an explicit fail-closed runtime contract shared by pilot depth slices, scalar volumes, horizontal-current slices and horizontal-current volumes.

## Authoritative starting state

The phase originated from the fully verified 3DB-05 production merge `2c2f869dd67000e1da067c022fe22b2e9a9507bc`. During exact-head acceptance, authoritative `main` advanced through the independently validated RUI-VIS-01 merge to `ff3cd2e5bb8721e4cb3879a43bdfbca0e9845750`. Before 3DB-06 merge, the phase was rebuilt from that newer production commit and its exact scientific changes were reapplied without overwriting the RUI visual integration. The reconciled exact head must pass the full acceptance gate again.

Existing scientific inventory remains unchanged:

- 140 canonical Indian Ocean geographic blocks;
- 25 genuine source-backed pilots;
- 115 planned/geography-only blocks;
- 6 multi-date pilots;
- 31 checksum-addressed pilot payloads;
- 0 land blocks materialized.

The immutable verified demo baseline remains scientifically distinct from pilot blocks. Pilot blocks are source-integrity and renderer accepted but do not inherit the baseline's independent Argo model-observation validation claim.

## Verified source depth evidence

Every currently materialized pilot payload retains the same 31 native GLORYS12V1 levels, positive down, from approximately 0.494025 m to 453.937714 m. The depth axis is read directly from each checksum-addressed payload. It is not reconstructed from a nominal range and is not interpolated or resampled by 3DB-06.

The runtime contract requires the native depth axis to be:

- present for a materialized baseline/pilot context;
- positive-down;
- at least two genuine levels;
- finite and non-negative;
- strictly increasing and unique;
- consistent with the payload's declared depth dimension.

A planned block remains depth-empty. Passing scientific depth values into a planned block is a contract violation.

## Implementation

### `frontend/src/main-block-depth.ts`

Introduces `MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION = "3db-06-v1"` and the reusable lifecycle-aware depth contract.

The module provides:

- native source depth-axis validation;
- materialized-vs-planned depth integration state;
- exact native depth-index selection;
- exact depth-axis equality checks across scientific surfaces;
- native-depth sample membership validation.

No function generates a depth value.

### `frontend/src/pilot-main-block-loader.ts`

The pilot ingestion and scientific render adapters now share the same depth gate:

- a fetched pilot payload is rejected before use if its native depth axis violates the contract;
- scalar volumes iterate the validated native axis;
- scalar slices resolve their selected depth directly from that axis;
- horizontal-current volumes expose the validated native axis as `depths_m`;
- horizontal-current slices resolve their selected depth directly from that axis.

Current speed remains derived only as `sqrt(uo² + vo²)` from genuine horizontal source components. No vertical velocity component is created or implied.

### Existing Water Column 3D

`WaterColumn3D` already derives visible depth layers from the scientific volume coordinates and exposes `data-depth-count`. 3DB-06 deliberately reuses that renderer rather than creating a second depth implementation. For a source-backed pilot, the live Water Column must expose all 31 retained native levels and the selected layer must remain expressed in source metres, positive down.

The existing planned Water Column shell remains unchanged and fail closed with zero scientific values and a pending source depth axis.

## Scientific truth firewall

3DB-06 introduces:

- no synthetic measurements;
- no synthetic timestamps;
- no synthetic coordinates;
- no synthetic depths;
- no vertical interpolation;
- no duplicated depth layers;
- no vertical-current claim;
- no baseline values copied into pilots or planned blocks;
- no changes to the immutable verified baseline scientific payload.

## Acceptance gates

The phase is acceptable only when all of the following are true:

1. all 31 existing pilot payloads preserve the genuine 31-level positive-down native axis;
2. payload depth length equals the declared depth dimension;
3. all four scientific variables retain value-array lengths consistent with native depth × latitude × longitude shape;
4. pilot field/volume/current adapters pass through the shared 3DB-06 depth contract;
5. selected slices use exact source depth coordinates rather than reconstructed or interpolated values;
6. current volumes expose the exact source depth inventory and remain uo/vo-only;
7. planned blocks remain depth-empty and scientifically locked;
8. the live pilot Explorer reports 31 verified depth levels;
9. the live pilot Water Column reports 31 genuine depth levels and the same selected native depth;
10. repository tests, final-MVP checks, hosted browser acceptance, GitHub Pages deployment, public HTTPS verification and live Chromium judge flow all pass on the exact merged `main` SHA.

## Concurrency / ownership boundary

3DB-06 owns scientific depth contracts and source-backed depth integration. It does not redesign navigation, Explorer hierarchy, panels, styling or RUI shell behavior. Concurrent RUI work must be reconciled before merge if `main` moves, and the exact reconciled 3DB-06 head must be fully re-tested before merge.

RUI-VIS-01 is explicitly preserved by the reconciliation onto `ff3cd2e5bb8721e4cb3879a43bdfbca0e9845750`. RUI-NAV-02 remains a separate concurrent workstream and must be race-checked again immediately before merge.

## Phase completion definition

Only after exact-head CI succeeds, the PR is merged onto the then-current authoritative `main`, exact-main CI succeeds, GitHub Pages deploys that exact merge, and public HTTPS plus live Chromium acceptance succeed may the phase be reported as:

**3DB-06 — MERGED → DEPLOYED → LIVE → VERIFIED**
