# Phase 3DB-03 — Geographic Block Engine

## Mission

Turn the existing 140-cell Indian Ocean logical grid into one canonical, renderer-neutral geographic contract without changing scientific payload truth, materialization counts, source provenance, or RUI/RUI-NAV layout.

3DB-03 is intentionally a **geography hardening phase**, not a new acquisition phase and not a UI restructuring phase.

## Starting authoritative state

- 140 logical target cells (`IO-001` … `IO-140`)
- target domain: 60–100°E, 5–25°N
- 10 rows × 14 columns
- 25 genuine source-backed pilots
- 115 planned cells
- 6 multi-date pilots
- 31 checksum-referenced payloads
- 0 land-dominant materialized cells
- immutable `BASE-GLORYS-001` remains separate from the 140-cell target registry

The scientific payload manifest remains the 3DB-02 acquisition record. 3DB-03 does not rewrite its phase label because no payload/source acquisition occurs here.

## Problem corrected

The pre-3DB-03 runtime selected a target using an inclusive rectangle scan:

- `longitude >= west && longitude <= east`
- `latitude >= south && latitude <= north`

Adjacent cells share their geographic edges. Therefore, an exact shared meridian or parallel could satisfy two or four target rectangles simultaneously, and array order silently decided which ID won.

That is acceptable for drawing adjacent rectangles but not for a canonical geographic-selection contract.

## Canonical point-ownership rule

3DB-03 establishes deterministic half-open ownership while preserving all four outer domain boundaries:

### Longitude

- normal columns own `[west, east)`
- the final eastern column also owns the outer `100°E` boundary

### Latitude

- normal rows own `(south, north]`
- the final southern row also owns the outer `5°N` boundary

Examples:

- `63°E, 24°N` → `IO-002`
- `61°E, 23°N` → `IO-015`
- `63°E, 23°N` → `IO-016`
- `60°E, 25°N` → `IO-001`
- `100°E, 25°N` → `IO-014`
- `60°E, 5°N` → `IO-127`
- `100°E, 5°N` → `IO-140`

Coordinates outside the configured domain fail closed and resolve to no target block.

## Geographic engine

Canonical implementation:

- `frontend/src/main-block-geography.ts`

It provides:

- `MAIN_BLOCK_GEOGRAPHY_VERSION`
- explicit point-ownership semantics
- target-domain membership checks
- deterministic point → target resolution
- stable renderer-neutral block footprints
- stable block centers
- closed polygon rings
- ID → footprint lookup
- a complete geographic audit
- a fail-fast canonical geography assertion

The geographic footprint layer is derived from the existing block registry. It does not create new scientific values or source claims.

## Runtime integration

`frontend/src/main-block-runtime.ts` retains the existing public `findTargetBlockAt()` API for compatibility, but delegates its result to `findGeographicMainBlockAt()`.

This means existing Cesium click-selection behavior inherits the deterministic 3DB-03 ownership contract without a high-risk renderer rewrite.

## Coverage contract

The configured domain area in longitude/latitude degree space is:

`(100 - 60) × (25 - 5) = 800 degree²`

The 140 footprints must satisfy all of the following:

1. exactly 140 blocks;
2. 140 unique stable IDs;
3. 140 unique row/column coordinates;
4. every block lies inside the target domain;
5. every block has positive width and height;
6. adjacent row/column bounds meet exactly;
7. total footprint area equals the configured domain area;
8. every block center resolves back to itself;
9. all four outer target-domain corners resolve to a block;
10. out-of-domain and non-finite coordinates resolve to no block.

## Scientific truth deliberately unchanged

3DB-03 does **not**:

- acquire another GLORYS volume;
- promote another pilot;
- create timestamps;
- create coordinates or depths;
- alter existing payload checksums;
- claim vertical current velocity;
- attach observation validation to pilots;
- convert planned cells into scientific data;
- alter the immutable verified GLORYS baseline;
- change the 25-pilot / 115-planned inventory;
- modify scientific colour maps or renderer values.

Logical/geographic availability remains distinct from scientific/render readiness under the 3DB-00 capability contract.

## RUI / RUI-NAV ownership boundary

3DB-03 owns the scientific/geographic capability only.

It does not decide the final visual placement of:

- Indian Ocean Block Engine
- Active Main Block
- Block Selector
- Planned / Verified status
- geographic hierarchy inside the sidebar

Those are RUI-NAV information-architecture responsibilities. The eventual RUI-NAV path may expose this capability under the agreed file-manager hierarchy, for example:

`Explore → 3D Explorer → Block System → Active Main Block`

Any later UI surface should consume the 3DB geographic contract rather than recreate block-boundary logic independently.

## Acceptance coverage

### TypeScript / Playwright contract

`frontend/e2e/3db03-geographic-block-engine.spec.ts`

Verifies:

- canonical 140-footprint inventory;
- unique IDs and row/column coordinates;
- exact domain coverage;
- closed footprint polygons;
- center self-resolution;
- deterministic shared-edge ownership;
- outer-corner ownership;
- fail-closed out-of-domain behavior;
- runtime delegation;
- unchanged 25-pilot / 115-planned state;
- no dates/times invented for planned cells.

### Python regression contract

`tests/test_3db03_geographic_block_engine.py`

Verifies:

- the manifest remains a complete deterministic 10×14 grid;
- row/column adjacency joins exactly;
- total domain coverage remains 800 degree²;
- 3DB-02 scientific inventory remains unchanged;
- no land block is materialized;
- no synthetic-science integrity flags change;
- runtime selection uses the canonical 3DB-03 resolver rather than the former inclusive scan.

## Production completion gate

3DB-03 is complete only after:

1. exact branch tests pass;
2. TypeScript typecheck passes;
3. production build passes;
4. existing scientific/API/fallback gates pass;
5. existing 3DB-00/01/02 regressions pass;
6. complete hosted browser acceptance passes;
7. branch is reconciled with latest `main` if `main` moves;
8. PR merges from the tested head;
9. exact-main tests pass;
10. exact-main `final-mvp` passes;
11. GitHub Pages builds and deploys;
12. live HTTPS verification passes;
13. full live Chromium judge-flow passes;
14. final latest-main/concurrency state is checked.

Only then may the phase be reported as:

**MERGED → DEPLOYED → LIVE → VERIFIED**

## Next phase

3DB-04 is the **Cesium 3D Rendering Engine** phase. It should consume the canonical geographic footprint/ownership layer created here rather than introducing a parallel geography implementation.

Do not begin 3DB-04 automatically as part of 3DB-03.
