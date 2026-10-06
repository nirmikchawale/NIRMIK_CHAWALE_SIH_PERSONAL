# Ocean Canvas 3DB-05 — Geographic ↔ Water Column Synchronization

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** 3DB — scientific 3D block capability  
**Phase:** 3DB-05 — Geographic ↔ Water Column Synchronization

## Mission

Make the active canonical 3DB block identity and scientific lifecycle remain truthful when a user moves from Geographic 3D into Water Column 3D. This phase does not acquire new ocean data, does not change the 140-block geography, and does not redesign the RUI/RUI-NAV shell.

3DB-04 made Cesium fail closed against the canonical block capability contract. 3DB-05 applies the corresponding synchronization discipline to the connected Water Column workflow: a verified baseline remains a verified baseline, a source-backed pilot remains a pilot, and a planned geographic cell remains an empty geographic shell with zero scientific values.

## Authoritative phase input

3DB-05 starts from the completed 3DB-04 production state and preserves:

- 140 canonical geographic target blocks over 60–100°E and 5–25°N;
- 25 genuine source-backed GLORYS12V1 pilot blocks;
- 115 planned/geography-only blocks;
- 6 genuine multi-date pilots;
- 31 checksum-addressed pilot payloads;
- 0 land blocks materialized;
- the immutable `BASE-GLORYS-001` baseline as the only independently model–observation validated block context;
- no synthetic measurements, timestamps, coordinates or depths;
- horizontal `uo`/`vo` currents only, with no vertical-current claim.

No payload or manifest acquisition truth is changed in this phase.

## Exact synchronization defect closed by 3DB-05

Phase 3.5D already routes pilot API calls to the selected source-backed block and deliberately reloads the application when entering or leaving a pilot source context. That protects the scientific catalog, field, volume, current, telemetry, anomaly and provenance families from being mixed across source contexts.

However, the legacy `WaterColumn3D` presentation surface still used a compatibility guard historically named `isVerifiedBaseline()`. That guard intentionally returns true for both the immutable baseline and genuine pilots so pilots can use the materialized scientific renderer. The Water Column DOM context itself still stamped every materialized volume as:

`BASE-GLORYS-001 · VERIFIED VOLUME`

That wording is scientifically wrong for a pilot. A pilot is checksum/source-integrity/renderer validated but does not inherit the baseline's independent Argo/model-observation validation.

3DB-05 closes that identity/lifecycle synchronization gap without rewriting the Water Column scientific arrays.

## Canonical 3DB-05 Water Column sync context

`frontend/src/main-block-runtime.ts` now exposes:

`MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION = "3db-05-v1"`

and `deriveMainBlockWaterColumnSyncContext()`.

The context is derived from the same canonical `deriveMainBlockCapabilities()` contract used by the 3DB workstream. It projects:

- active block ID;
- materialization state;
- geographic readiness;
- Water Column readiness;
- whether a scientific volume is allowed;
- Water Column mode: `scientific-volume` or `geographic-shell`;
- evidence class;
- validation level;
- exact canonical bounds;
- genuine available dates;
- source product.

The three lifecycle states therefore remain explicit:

### Immutable verified baseline

- mode: `scientific-volume`;
- evidence: `immutable-verified-baseline`;
- validation: `model-observation`;
- Water Column scientific volume allowed.

### Source-backed pilot

- mode: `scientific-volume`;
- evidence: `checksum-verified-pilot`;
- validation: `source-integrity-renderer`;
- Water Column scientific volume allowed;
- no independent Argo validation claim.

### Planned block

- mode: `geographic-shell`;
- evidence: `none`;
- validation: `none`;
- Water Column scientific volume locked;
- zero scientific values.

## Runtime synchronization bridge

`PilotMainBlockRendererBridge.tsx` already exists as the Phase 3.5D compatibility bridge between the source-backed pilot context and the legacy Geographic/Water Column presentation surfaces.

3DB-05 extends that existing bridge narrowly. When a real pilot is active and the canonical capability contract says Water Column science is allowed, it reconciles only the legacy Water Column **identity/lifecycle metadata**:

- `data-main-block-id` becomes the active pilot ID;
- `data-materialization` becomes `pilot`;
- `data-water-column-sync` becomes `synchronized`;
- the sync contract version is exposed as `3db-05-v1`;
- the evidence class is exposed as `checksum-verified-pilot`;
- the context heading becomes `IO-xxx · SOURCE-BACKED PILOT VOLUME`;
- the context states that the pilot has no independent Argo validation claim.

The bridge does **not** modify:

- `volume.points`;
- `currentsVolume.vectors`;
- field values;
- source coordinates;
- source depths;
- source timestamps;
- color mapping;
- scientific geometry;
- telemetry;
- anomaly results;
- provenance payloads;
- current components.

The actual pilot scientific family continues to be hydrated by the existing Phase 3.5D `api.ts` path from checksum-addressed pilot payloads. 3DB-05 synchronizes the identity presented by Water Column with that already-active scientific family.

## Planned-block fail-closed behavior

Planned cells retain the existing Water Column geographic shell and remain outside the materialized scientific renderer. The shell continues to expose:

- the exact block footprint;
- `data-materialization="planned"`;
- `data-scientific-values="0"`;
- `PLANNED TARGET · NO MATERIALIZED VOLUME`;
- zero bundled values;
- no copied baseline values;
- no fabricated temperature, salinity, currents or depths.

Thus a geographic selection can always stay synchronized with Water Column without pretending that geography alone is scientific materialization.

## Geographic ↔ Water Column synchronization semantics

The synchronization chain is:

`canonical geographic block selection → main-block runtime → capability projection → source-context hydration → Water Column lifecycle identity`

For pilots, a source-context transition still uses the existing deterministic reload because the current App constructs its scientific catalog at boot. This remains the safe fail-closed behavior: it prevents a new active block identity from being shown briefly over a previous block's scientific payload family.

For planned cells, the connected Water Column shell can change immediately because no scientific payload is permitted.

No block selection rewrites source evidence.

## RUI / RUI-NAV boundary

3DB-05 owns the scientific synchronization semantics only. It does not change:

- sidebar/file-manager hierarchy;
- workspace parentage;
- breadcrumbs;
- global glassmorphism;
- typography system;
- responsive shell architecture;
- inspector placement;
- navigation routes.

This is the required **SYNC-B (RUI-05 ↔ 3DB-05)** boundary. RUI may later reposition or restyle the Geographic and Water Column surfaces, but it must preserve the 3DB-05 block identity, materialization, evidence class and fail-closed planned-shell semantics.

## Acceptance criteria

3DB-05 is complete only when all of the following are true:

1. `MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION` is `3db-05-v1`.
2. `BASE-GLORYS-001` resolves to `scientific-volume`, `immutable-verified-baseline`, and `model-observation` validation.
3. A genuine pilot such as `IO-001` resolves to `scientific-volume`, `checksum-verified-pilot`, and `source-integrity-renderer` validation.
4. A planned cell such as `IO-003` resolves to `geographic-shell`, has no evidence class, and cannot render a scientific Water Column volume.
5. A pilot Water Column DOM surface reports the actual pilot ID and `pilot` materialization rather than `BASE-GLORYS-001` / verified-volume identity.
6. Pilot Water Column copy explicitly avoids an independent Argo validation claim.
7. Pilot Water Column retains the genuine pilot timestamp and source-backed depth evidence.
8. Planned Water Column retains zero scientific values and does not relocate baseline values.
9. 25 pilots / 115 planned / 6 multi-date / 31 payloads / 0 land materialized remain unchanged.
10. No synthetic scientific measurements, timestamps, coordinates, depths or vertical-current component are introduced.
11. Existing 3DB-04 Cesium scientific rendering remains unchanged.
12. TypeScript, production build, Python scientific regressions and complete hosted browser acceptance pass.
13. Before merge, latest `main` and active RUI/RUI-NAV work are reconciled; no stale branch is merged.
14. After merge, exact-main `tests`, `final-mvp`, Pages build/deploy, HTTPS verification and live Chromium judge-flow all pass.

## Rollback

Phase start SHA: `d1fe5a95e1ead5f6a55a77c869987997bda0010a`.

Implementation branch: `3db-05-geographic-water-column-sync`.

Rollback is a normal revert of the 3DB-05 merge commit. Do not force-reset public `main`. 3DB-00 through 3DB-04 and all source-backed pilot payloads remain valid independent evidence.
