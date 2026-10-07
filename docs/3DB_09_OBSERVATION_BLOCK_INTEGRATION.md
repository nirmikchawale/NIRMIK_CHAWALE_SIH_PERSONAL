# 3DB-09 — Observation & Block Integration

## Status at implementation start

- Phase: 3DB-09
- Starting authoritative production `main`: `743df7b97a59681ab58468910f61345fa748e876`
- Branch: `3db-09-observation-block-integration`
- Previous phase: 3DB-08 Multi-Variable Block Integration — merged, deployed and live-verified.
- Scope: attach genuine observation context to canonical geographic blocks without confusing geographic co-location with model validation.
- RUI redesign: out of scope.

## Objective

3DB-09 makes observation evidence block-aware.

Before this phase, Ocean Canvas already had:

- the immutable GLORYS12V1 baseline with two verified Argo comparison profiles;
- build-time verified Glider/CTD/BGC observation packs;
- user/session observation overlays from Data Lab;
- the 140-cell canonical target grid, including 112 ocean-intersecting selectable cells;
- 25 source-backed GLORYS pilot blocks.

The missing scientific interface was a conservative answer to:

> Which source-backed observation profiles actually fall inside the currently active block, and what scientific claim is permitted for that relationship?

3DB-09 adds that answer without inventing a matchup.

## Scientific truth boundary

Observation-to-block relationships are classified into exactly three evidence states:

1. **Independent model-observation evidence**
   - permitted only for the immutable `BASE-GLORYS-001` baseline;
   - uses the existing verified Argo-to-GLORYS comparison profiles;
   - preserves the existing comparison/QC/method limitations.

2. **Spatial context only**
   - a source-backed observation coordinate falls inside the canonical block footprint;
   - may come from the verified Argo comparison inventory or the verified Glider/CTD/BGC pack;
   - does **not** imply time alignment, interpolation, matchup, model skill, or validation of that block.

3. **None**
   - no source-backed observation profile currently falls inside the active footprint;
   - the application explicitly withholds an observation-validation claim.

## Important real evidence case: IO-087

The two immutable baseline Argo comparison profiles are genuine observations at approximately:

- 67.622105°E, 12.836313°N;
- 67.618648°E, 12.837103°N.

Under the canonical 3DB-03 geographic ownership rule, both coordinates fall inside:

- `IO-087`
- 66–69°E
- 11–13°N

However, `IO-087` is still a **planned** block and has no materialized GLORYS block payload.

Therefore 3DB-09 deliberately reports:

- `IO-087`: 2 source-backed observation profiles in its footprint;
- relationship: **spatial context only**;
- model-observation validation: **false**;
- scientific block rendering: remains locked.

The same two Argo profiles remain independent model-observation evidence only for the immutable baseline they were actually compared against.

This is the phase's central non-fabrication regression guard.

## Runtime contract

New module:

- `frontend/src/main-block-observations.ts`

It provides:

- `MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION = "3db-09-v1"`;
- canonical coordinate-to-block ownership reuse from 3DB-03;
- baseline-aware Argo comparison attachment;
- verified Glider/CTD/BGC footprint association;
- observation counts and sensor classes;
- explicit evidence role per linked profile;
- independent-comparison count versus spatial-context count;
- model-observation validation gate;
- limitations that prevent geographic proximity from being read as validation.

No timestamps, measurements, depths, matchups, interpolated values, QC flags or observation locations are synthesized.

## Canonical capability integration

`frontend/src/main-block-capabilities.ts` now accepts optional dynamic observation evidence.

This allows a block such as `IO-087` to truthfully expose:

- `observationsAvailable = true`

while still preserving:

- `dataAvailable = false`;
- `materialized = false`;
- `renderReady = false`;
- `validation.modelObservationValidated = false`.

A new guard throws if runtime observation context attempts to promote any non-baseline block to model-observation validated.

Thus “observation exists in the footprint” and “the block model has been validated against it” remain separate facts.

## Judge-facing integration

The existing 3D Explorer block HUD now exposes live observation/block truth without a RUI redesign.

It reports:

- active-block observation count;
- evidence class;
- whether active model-observation validation is actually attached;
- a visible explanation:
  - verified baseline → independently compared Argo profile count;
  - any other block with observations → spatial context only, no block validation;
  - no observations → no source-backed observation profile currently in footprint.

The existing global observation markers remain available. 3DB-09 does not hide or fabricate observations merely to make every block look populated.

## Existing provider breadth preserved

The build/deployment pipeline already fetches and validates genuine:

- Argo comparison evidence;
- Glider profiles;
- CTD profiles;
- BGC profiles.

3DB-09 consumes those existing contracts. It does not create a second observation ingestion system.

The build-time verified observation pack may contain profiles outside the 60–100°E, 5–25°N block domain. Such profiles remain valid global observation overlays but are not counted as block context unless their genuine coordinates actually enter the active footprint.

## Tests and acceptance gates

### Frontend contract acceptance

`frontend/e2e/3db09-observation-block-integration.spec.ts` verifies:

- baseline Argo comparison → independent model-observation evidence;
- the same Argo coordinate in `IO-087` → spatial context only;
- a canonical block-edge coordinate resolves to one and only one block;
- verified Glider/CTD/BGC context cannot promote pilot validation;
- a planned block may report observations while remaining render-locked;
- live production baseline exposes independent comparison evidence;
- live `IO-087` exposes the two Argo profiles as spatial context only and remains planned.

### Python regression acceptance

`tests/test_3db09_observation_block_integration.py` verifies:

- the two repository Argo profiles genuinely lie inside `IO-087`;
- the existing comparison status remains diagnostic-only with documented limitations;
- canonical geographic ownership is reused;
- pilot API behavior still withholds attached Argo comparison profiles;
- judge-facing DOM semantics expose observation evidence without false validation.

## Intentional non-changes

3DB-09 does not:

- materialize `IO-087`;
- copy baseline model values into `IO-087`;
- claim that any pilot has an independent Argo matchup;
- synthesize observation times to match 2004 pilot dates;
- move Glider/CTD/BGC coordinates into the target region;
- convert dissolved oxygen into chlorophyll;
- create a vertical current component;
- change existing block payloads or checksums;
- change RUI navigation, shell hierarchy, or global visual design.

## 3DB-10 readiness

Once 3DB-09 is merged and production-verified, 3DB-10 can build **Provenance & Scientific Evidence** on top of an explicit observation/block evidence role rather than inferring provenance from marker visibility or geographic proximity.
