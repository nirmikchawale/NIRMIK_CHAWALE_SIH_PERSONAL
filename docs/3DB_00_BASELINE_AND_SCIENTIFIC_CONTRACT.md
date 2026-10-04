# 3DB-00 — Block Baseline & Scientific Contract

## Phase status at branch creation

- Phase: 3DB-00
- Starting authoritative `main`: `c50004a4faf286a7027a199685e6a1b6236e30ce`
- Branch: `3db-00-block-baseline-scientific-contract`
- Scope: scientific block truth model, baseline inventory, capability contract and regression guards only.
- RUI redesign: explicitly out of scope.

## Verified immutable baseline

The existing baseline remains unchanged:

| Field | Verified value |
|---|---|
| Block | `BASE-GLORYS-001` |
| Product | Copernicus Marine GLORYS12V1 / `GLOBAL_MULTIYEAR_PHY_001_030` |
| Dataset | `cmems_mod_glo_phy_my_0.083deg_P1D-m` |
| Date | `2024-01-02` |
| Bounds | 67–70°E, 12–14°N |
| Grid | 31 depth × 25 latitude × 37 longitude |
| Depth | 0.49402499198913574–453.9377136230469 m |
| Variables | `thetao`, `so`, horizontal `uo`/`vo` currents |
| Observation context | Existing verified Argo comparison/QC/provenance |
| Mutation in 3DB-00 | None |

## Current logical block inventory

The Indian Ocean target registry contains 140 logical cells over 60–100°E, 5–25°N.

At the 3DB-00 baseline:

- 24 cells are genuine source-backed Phase 3.5B pilot blocks.
- 6 of those pilots contain two genuine source dates.
- 116 cells are planned/logical targets with no materialized payload.
- 0 land-classified cells are materialized.
- The immutable `BASE-GLORYS-001` baseline is separate from the 140-cell expansion registry.

### Defensible capability classification

| Category | Count | Scientific interpretation |
|---|---:|---|
| Immutable verified baseline | 1 | Source-backed, render-ready, existing model-observation validation |
| Source-backed/render-ready pilots | 24 | Genuine checksum-backed GLORYS payloads, shared Cesium/Water Column route; no independent observation validation attached |
| Partially materialized | 0 | No current cell is being promoted into this ambiguous category |
| Metadata/geography-only / planned | 116 | Bounds and logical identity exist; scientific payload/render path remains locked |
| Multi-date pilots | 6 | Subset of the 24 pilots, not an additional block count |

## Existing implementation map

### Registries and status
- `frontend/src/main-block-engine.ts`
  - 140 logical cells.
  - immutable baseline definition.
  - logical region/bounds generation.
  - historical `verified-baseline | pilot | planned` materialization vocabulary.
- `frontend/src/main-block-runtime.ts`
  - 24 source-backed pilot IDs.
  - 6 multi-date pilot IDs.
  - selection persistence/deep linking.
  - planned blocks stay geographic context; pilot selection changes scientific source context.

### Scientific payload manifest/data
- `frontend/public/main-blocks/manifest.json`
  - source metadata, source dates, integrity flags, pilot IDs, block rows/bounds, payload checksums.
- `frontend/public/main-blocks/data/<block>/<date>.json`
  - genuine GLORYS payloads with retained lon/lat/depth coordinates and `thetao`, `so`, `uo`, `vo`.

### Loaders and API/static routing
- `frontend/src/pilot-main-block-loader.ts`
  - rejects non-pilot or integrity-invalid payloads.
  - constructs scalar volumes/slices and horizontal-current vectors from genuine payloads.
- `frontend/src/api.ts`
  - routes active pilot blocks to source-backed static pilot payloads.
  - preserves baseline API/static science for non-pilot scientific context.
  - correctly withholds Argo profile comparison from pilots.

### Renderer integration
- Geographic/Cesium and Water Column renderers already share the selected scientific context.
- `frontend/e2e/phase35d-pilot-renderer-sync.spec.ts` verifies a genuine pilot reaches both renderer families without synthetic fallback.
- Planned-region browsing does not replace the active scientific renderer source.

### Existing scientific tests
- `tests/test_phase35b_manifest.py`
  - manifest/source/integrity checks.
  - payload checksum and variable/depth/source verification.
- `frontend/e2e/main-block-engine.spec.ts`
  - 140-cell registry / source-backed pilot UI state.
  - renderer lock for planned cells.
- `frontend/e2e/phase35d-pilot-renderer-sync.spec.ts`
  - real pilot activation and Geographic ↔ Water Column renderer continuity.

## Problem found by 3DB-00

The repository already prevents many false claims, but capability truth is distributed across:

- `materialization` strings;
- hard-coded pilot ID membership;
- loader integrity checks;
- API routing;
- renderer compatibility guards;
- UI lock behavior.

That makes future phases vulnerable to conflating:

- “the block ID exists,”
- “the block has bounds,”
- “the block has genuine data,” and
- “the block may render science.”

3DB-00 therefore adds one canonical, conservative capability projection without replacing the working legacy contracts.

## Canonical capability contract

`frontend/src/main-block-capabilities.ts` is the compatibility-safe 3DB contract.

It separately exposes:

- logical existence;
- data availability;
- materialization;
- source-integrity scientific validation;
- geographic readiness;
- Cesium readiness;
- Water Column readiness;
- final render readiness;
- actually available variables;
- genuine available times;
- depth-range resolution state;
- observation availability;
- provenance class;
- source/renderer/model-observation validation levels;
- explicit limitations.

### Important semantics

1. **Planned block**
   - `logicalExists = true`
   - `geographicReady = true` when bounds are valid
   - all scientific availability/readiness flags are false
   - available variables/times are empty
   - provenance evidence class is `none`
   - renderer remains locked

2. **Source-backed pilot**
   - genuine payload exists
   - source-integrity and shared renderer acceptance are valid
   - Cesium and Water Column may render
   - variables/times come only from materialized evidence
   - independent model-observation validation remains false
   - exact depth coordinates remain payload-resolved rather than guessed in registry metadata

3. **Verified baseline**
   - remains the immutable source-backed baseline
   - exact 31-level depth range is carried from verified model inspection
   - observation/model-validation availability remains distinct from pilot capability

## Regression guards added

### Frontend contract test
`frontend/e2e/3db00-capability-contract.spec.ts` enforces:

- all 116 non-pilot logical cells remain scientifically locked;
- all 24 current pilots expose only their genuine source-backed capability;
- pilots do not claim independent model-observation validation;
- the baseline retains its verified time, variables and exact depth range.

### Scientific manifest test
`tests/test_3db00_block_capability_contract.py` enforces:

- planned blocks contain no payloads or available source dates;
- pilots must carry actual payload evidence;
- synthetic science flags remain false;
- land blocks remain unmaterialized.

## Ownership boundary

### CHAT 2 owned
- `frontend/src/main-block-engine.ts`
- `frontend/src/main-block-runtime.ts`
- `frontend/src/main-block-capabilities.ts`
- `frontend/src/pilot-main-block-loader.ts`
- `frontend/public/main-blocks/**`
- scientific block materialization scripts
- scientific API/static block routing
- scientific block tests/e2e acceptance
- 3DB scientific documentation

### Shared scientific/UI interfaces — edit minimally
- `frontend/src/api.ts`
- `frontend/src/components/OceanGlobe.tsx`
- `frontend/src/components/WaterColumn3D.tsx`
- scientific-context / block-launcher integration points
- acceptance tests that span scientific state and judge-facing UI

### CHAT 1 / RUI owned
- application shell and navigation redesign
- global responsive shell
- glass/sidebar aesthetics
- global inspector/drawer styling
- design-system aesthetics
- global accessibility restructuring

3DB-00 does not alter these RUI surfaces.

## Intentional non-changes

This phase does **not**:

- materialize a new block;
- add a new timestamp;
- add a new variable;
- attach observations to pilots;
- change the immutable GLORYS baseline;
- redesign the block launcher or app shell;
- change Cesium visual styling;
- change Water Column visual styling;
- claim vertical velocity;
- claim pilot model-observation validation.

Those belong to later phases only when evidence supports them.

## 3DB-01 readiness gate

3DB-01 may proceed once 3DB-00 is merged and production-verified. It should build materialization foundations on top of the canonical capability contract rather than introducing another parallel truth model.
