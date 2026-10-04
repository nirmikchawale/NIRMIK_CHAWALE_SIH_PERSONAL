# Ocean Canvas — Phase 3.5B Pilot Acquisition Master Prompt

## Mission
Materialize the first genuinely new Ocean Canvas main blocks from source-backed GLORYS12V1 data without changing, copying or fabricating the existing `BASE-GLORYS-001` volume. Phase 3.5B is the scientific acquisition bridge between the already-deployed 140-cell geographic planning lattice and later Phase 4 renderer synchronization.

## Reconciliation with work already completed in other workstreams
Treat the repository as authoritative before making any change.

Already merged on `main` at the start of this phase:
- Phase 3.5-HF: Appearance Lab viewport alignment.
- Phase 3.5A: 140 logical target cells across 60–100°E and 5–25°N.
- Phase 3.5C: provenance-aware time architecture; no synthetic timestamps or enabled interpolation.
- Phase 3.5A-G: all 140 logical shells integrated into the main Cesium Earth and Water Column workflow, while keeping planned shells scientifically empty.
- Phase 3.5A-G live acceptance fixes: production baseline `aa05b7faa4e92e800d137e30bf5b940a54020d98` at the start of this phase.

An independent Phase 5.0 Shared Scientific Context Bridge exists in open PR #122. It changes shared UI/context files but intentionally does not acquire new blocks or modify Cesium block geometry. Phase 3.5B therefore remains data-pipeline-first and avoids those shared UI files. A changed-file comparison confirmed that Phase 3.5B and PR #122 own disjoint file sets.

## Scientific definition of success
A Phase 3.5B pilot block is a separate geographic extract from a genuine GLORYS12V1 source field. It is not an `AS-xx` subdivision of the current 67–70°E × 12–14°N baseline and must not reuse translated/copied baseline values.

Every materialized pilot must preserve:
- source longitude and latitude coordinates;
- genuine source depth coordinates;
- genuine source date/time semantics;
- source temperature (`thetao`), salinity (`so`), eastward current (`uo`) and northward current (`vo`) values where finite;
- land/fill values as missing values, never zeros pretending to be ocean;
- explicit provider/archive provenance and source URL;
- a checksum of each browser-ready payload;
- clear daily-mean semantics for GLORYS historical fields.

No vertical-current component may be invented. No missing values may be interpolated merely to fill land or gaps. No arbitrary timestamps may be generated.

## Source policy
Primary scientific identity: Copernicus Marine / Mercator Ocean GLORYS12V1 (`GLOBAL_MULTIYEAR_PHY_001_030`, 1/12° global reanalysis, 50 standard depth levels).

For this reproducible pilot pipeline, the public NCAR GDEX THREDDS archive of MERCATOR GLORYS12V1 is used as the transport/archive mirror. NCAR is the archive/transport provider, not the originating numerical model centre. Browser-ready provenance therefore retains both the originating GLORYS12V1 identity and the exact public archive service URL.

The verified acquisition path is **THREDDS OPeNDAP DAP2**, opened through `xarray`/`netCDF4`. Earlier NCSS whole-domain/chunked attempts were rejected or timed out on the public archive and were not used to produce the accepted assets. OPeNDAP transfers only the requested source array slices while preserving the underlying file metadata, coordinates and values.

The acquisition source exposes `thetao`, `so`, `uo`, `vo`, longitude, latitude, depth and the genuine daily timestamp.

## Pilot strategy
Do not download 140 full volumes in Phase 3.5B.

1. Read the 60–100°E, 5–25°N surface temperature slice at a moderate horizontal stride through OPeNDAP.
2. Retain only genuine depth levels at or above the current MVP depth ceiling (nominally ≤500 m) for full pilot payloads.
3. Derive an ocean-relevance fraction per logical `IO-001…IO-140` cell from finite source surface temperature values.
4. Classify each logical cell as:
   - `ocean`: strong finite-ocean coverage;
   - `coastal`: mixed ocean/land coverage;
   - `land`: predominantly/no finite ocean coverage.
5. Never materialize land-dominant cells as ocean blocks.
6. Select approximately 24 pilots distributed across Arabian Sea, west coast, Lakshadweep/southern Arabian Sea, south of India, east coast, Bay of Bengal, Andaman/Nicobar and eastern Indian Ocean.
7. Materialize the primary genuine daily field for every pilot.
8. Materialize a second genuine historical date for a smaller geographically distributed subset so the Phase 3.5C time engine has real future data to consume.

## Land-mask requirement
The current 140-cell Cesium layer is a rectangular planning lattice, so some planned rectangles cross the Indian subcontinent. Phase 3.5B produces authoritative per-cell `ocean_fraction` and `ocean_relevance` metadata from actual finite GLORYS water cells. Later Phase 4A rendering must consume these fields to suppress land-dominant cells and clip/represent coastal blocks honestly.

Do not solve the land problem by manually deleting arbitrary IDs or drawing a hand-estimated India polygon.

## Browser-ready payload contract
Write a compact per-block/per-date JSON payload under:

`frontend/public/main-blocks/data/<BLOCK_ID>/<YYYY-MM-DD>.json`

Each payload must include:
- schema/version;
- block ID and exact target bounds;
- source product/origin/archive/file/service URL;
- genuine timestamp and `daily_mean` semantics;
- coordinate arrays for longitude, latitude and depth;
- flattened shape metadata;
- `thetao`, `so`, `uo`, `vo` arrays with missing values represented as JSON `null`;
- finite-count/range integrity summaries per variable;
- explicit `vertical_component_available: false`;
- no-synthetic-data declarations.

Write one aggregate manifest at:

`frontend/public/main-blocks/manifest.json`

The manifest must describe all 140 logical cells, ocean relevance, materialization status, available dates, payload paths, source identity and checksums.

## Runtime adapter contract
Add a TypeScript loader/adapter that can convert a Phase 3.5B payload into the existing Ocean Canvas scientific interfaces:
- `VolumeResponse` for `thetao` / `so`;
- `FieldResponse` for a selected real depth;
- `CurrentsVolumeResponse` from `uo` / `vo` with speed derived as `sqrt(u²+v²)`;
- `CurrentsResponse` for one selected real depth.

Speed is a transparent derived quantity; `uo` and `vo` remain the source components. The adapter must never create `wo`.

Phase 3.5B does not yet replace the primary App loader. Phase 4B is the controlled point where selected materialized blocks become the active Water Column volume. Keeping that boundary avoids conflicts with the independent Phase 5.0 workstream.

## Automation
The isolated GitHub Actions materialization workflow on branch `data/phase-35b-pilot-acquisition` must:
1. install the minimal scientific dependencies;
2. open the two declared GLORYS12V1 source days from the public NCAR GDEX THREDDS OPeNDAP service;
3. validate source identity, timestamps and coordinates;
4. generate the coast-aware manifest and pilot payloads;
5. run a strict verification pass;
6. commit generated `frontend/public/main-blocks/**` assets back to the phase branch only when they changed.

The workflow must not deploy Pages and must not write to `main`.

## Acceptance gates
Phase 3.5B is complete only when all of the following are true:
- at least 20 and no more than 25 pilot IDs are materialized;
- every pilot is a genuinely different geographic target cell;
- each pilot has finite source-backed temperature, salinity and horizontal current values;
- all payload depth coordinates are genuine and ≤500 m;
- no land-dominant cell is materialized;
- manifest covers all 140 logical cells and gives each an ocean relevance classification;
- at least 4–6 pilots have a second genuine historical date;
- payload checksums reproduce exactly in verification;
- generated dates match source metadata;
- no synthetic timestamps, coordinates, depths or measurements are present;
- TypeScript loader compiles against current `types.ts`;
- existing scientific, React/Cesium and static-host acceptance remain green after generated assets are present.

## Verified execution outcome
The acquisition workflow completed successfully on GitHub Actions and committed the generated evidence back to the phase branch.

Verified result:
- **140** logical planning cells classified by source-derived ocean relevance;
- **24** genuine materialized pilot blocks;
- **6** pilots with a second genuine historical date;
- **30** checksum-addressed browser-ready payloads in total;
- **0** land-dominant cells materialized;
- primary source day: `2004-03-15`;
- secondary source day: `2004-07-28`;
- source files report the genuine daily timestamp at `12:00:00Z` for the accepted slices;
- **31** genuine source depth levels retained from approximately 0.494 m to 453.938 m;
- no synthetic measurements, timestamps, coordinates, depths or vertical-current component.

The manifest and every payload are now also guarded by an offline regression test that rechecks counts, source identity, per-payload checksums, depth limits, scientific-integrity flags and variable evidence.

## Parallel-workstream rule
Do not merge Phase 3.5B while an overlapping branch is unresolved without first comparing changes. PR #122 owns shared scientific context/UI integration. Phase 3.5B owns acquisition scripts, generated block assets, manifest schema, loader adapters and coast/ocean relevance metadata. At the time of Phase 3.5B completion, the file sets are disjoint, so the two branches can be validated independently and reconciled without silently mixing scientific acquisition with shared UI state work.

## Rollback
Start SHA: `aa05b7faa4e92e800d137e30bf5b940a54020d98`.

Development branch: `data/phase-35b-pilot-acquisition`.

No force push/reset of public `main`. Generated science assets are additive and can be removed by reverting the Phase 3.5B merge commit if later merged.

## Stop boundary
Do not begin Phase 4A/4B/4C inside this phase. Do not connect pilot payloads to the production App loader or claim the yellow 3D field is active for pilot cells until the dedicated renderer synchronization phase passes its own acceptance gates.
