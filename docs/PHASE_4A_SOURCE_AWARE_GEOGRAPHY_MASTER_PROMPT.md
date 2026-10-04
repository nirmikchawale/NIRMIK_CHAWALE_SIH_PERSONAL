# Ocean Canvas — Phase 4A Source-Aware Geographic Block Explorer

## Optimized execution prompt

Act as the scientific product engineer responsible for reconciling Ocean Canvas's already-integrated 140-cell Indian Ocean geographic system with the newly merged Phase 3.5B source-backed pilot evidence. Treat the repository, generated manifest and current `main` as authoritative. Do not redo earlier geometry, do not fabricate ocean values, and do not activate Phase 4B Water Column science inside this phase.

### Start state

- Start / rollback SHA: `5b8202d7d3d5e2e0ce7f2c69696f29c62c2b2e6f`.
- Development branch: `ui/phase-4a-source-aware-geography`.
- Phase 3.5B is merged: 140 logical cells are classified from GLORYS12V1 source evidence; 24 cells have genuine materialized pilot payloads; 6 of those have a second genuine historical day; no land-dominant cell is materialized.
- Phase 5.0 Shared Scientific Context Bridge is also merged independently and must remain intact.
- PR #121/#123 already put the complete 140-cell planning lattice into the main Cesium globe and Water Column navigation path. Therefore Phase 4A is a **reconciliation and geographic-evidence phase**, not another geometry rewrite.

## Mission

Turn the existing 140-cell geographic planning system into a source-aware geographic explorer driven by `frontend/public/main-blocks/manifest.json`.

The user must be able to distinguish, at a glance and through accessible controls:

1. the existing `BASE-GLORYS-001` verified demo baseline;
2. Phase 3.5B source-backed pilot cells with genuine payload evidence;
3. ocean/coastal logical targets that are still planned;
4. land-dominant logical cells that are retained for manifest completeness but are not selectable as ocean science on the globe.

Phase 4A must remove stale statements such as “0 materialized” and “the baseline is the only materialized volume” because they became false after Phase 3.5B. It must replace them with precise wording: pilot payloads are materialized and source-backed, but the primary Water Column renderer still uses the established baseline until Phase 4B deliberately activates pilot payloads.

## Scientific source of truth

Use the generated Phase 3.5B manifest as the only authority for pilot/materialization and ocean relevance:

`frontend/public/main-blocks/manifest.json`

Expected verified contract:

- `logical_block_count = 140`
- `pilot_block_count = 24`
- `multi_date_pilot_count = 6`
- `land_blocks_materialized = 0`
- pilot payloads preserve real GLORYS12V1 coordinates/depths/timestamps/values
- no synthetic measurement, timestamp, coordinate, depth or vertical-current component

Never infer pilot status from block ID, region, colour, bounding box, or the legacy static `main-block-engine.ts` materialization field.

## Phase boundary

Phase 4A **does not** load pilot `thetao`, `so`, `uo` or `vo` values into the active Water Column renderer. `pilot-main-block-loader.ts` already provides adapters for Phase 4B, but invoking those adapters as the app's active science path is out of scope here.

A source-backed pilot selected on the globe may be inspected geographically and may show its available dates/provenance, but the UI must say `WATER COLUMN ACTIVATION PENDING PHASE 4B` (or equivalent) rather than silently displaying baseline values as though they belong to the pilot.

## Geographic rendering contract

### Cesium

- Keep the full 60–100°E × 5–25°N domain boundary.
- Retain all 140 logical IDs in the audit/catalog surface.
- On the globe, do **not** render land-dominant logical cells as selectable ocean footprints.
- Render source-backed pilots distinctly from planned ocean/coastal targets.
- Preserve a separate, unmistakable style for `BASE-GLORYS-001`.
- Selected pilot labels must say `MATERIALIZED` or `SOURCE-BACKED`, not `VERIFIED BASELINE` and not `PLANNED`.
- Coastal planning cells remain visually honest; do not imply an exact coastline clip if the Cesium rectangle remains a target envelope.
- The existing scientific scalar/current renderer must remain unchanged.

### Selection rules

- A globe click in a land-dominant cell must not create an active ocean block selection.
- A stale persisted land-dominant selection must be cleared once the manifest is available, with the safe baseline selected instead.
- Pilot, coastal and ocean-planned cells remain selectable according to their scientific status.
- The full logical catalog may still let a user inspect a land cell's metadata so judges can see why it was excluded from ocean materialization.

## Main Block Engine contract

Update the existing Phase 3.5 surface rather than creating another competing catalog.

When the manifest is ready:

- show `140 logical cells`;
- show `24 source-backed pilots`;
- show `6 multi-date pilots`;
- show `0 land-dominant pilots`;
- identify pilot cells and genuine available dates;
- identify ocean fraction / relevance (`ocean`, `coastal`, `land`);
- identify source as Copernicus Marine / Mercator Ocean GLORYS12V1, transported through the recorded NCAR GDEX OPeNDAP archive;
- disclose that Phase 4B renderer activation is still pending.

Inspector states:

- pilot → `SOURCE-BACKED PILOT · RENDERER ACTIVATION PENDING 4B`;
- ocean/coastal planned → `OCEAN/COASTAL TARGET · NOT MATERIALIZED`;
- land → `LAND-DOMINANT · NOT MATERIALIZED`.

## Manifest failure behavior

If `main-blocks/manifest.json` cannot be loaded or fails validation:

- do not guess or cache false pilot statuses;
- keep the application usable;
- show a clear evidence-manifest unavailable state;
- fall back to the logical planning geometry only;
- never display `24` or any individual pilot as source-backed unless the manifest was actually validated in this session.

## UI / glassmorphism rules

- Reuse the existing 16-theme semantic glass token system.
- Add no permanent blur over Cesium.
- Make status legible by text and shape/state, not colour alone.
- Preserve keyboard navigation, focus-visible states and mobile containment.
- Avoid adding another fixed launcher that competes with the already-integrated HUD.
- Keep all scientific palette colours independent from UI appearance themes.

## Phase 5 compatibility

Phase 5.0 is already on `main`. Do not remove or bypass its shared scientific context bridge. Phase 4A may enrich geographic status, but shared block/source/native-time/variable/depth context must remain functional. Do not create a second independent global context system.

## Acceptance gates

Phase 4A is complete only when all are true:

1. Manifest loads and validates against `140 / 24 / 6 / 0-land-pilots`.
2. Cesium no longer presents land-dominant cells as selectable ocean footprints.
3. At least one known pilot (for example `IO-001`) is rendered and labelled as source-backed/materialized.
4. At least one known land-dominant cell (for example `IO-004`) is excluded from globe ocean selection and is disabled in the primary block selector.
5. Main Block Engine retains all 140 logical cells for auditability and exposes pilot, planned/coastal, and land status accurately.
6. The stale “0 materialized” / “baseline is the only materialized volume” claims are removed from all Phase 4A touched surfaces.
7. Pilot date availability is shown from the manifest; multi-date pilots expose both genuine dates.
8. `BASE-GLORYS-001` remains the active legacy scientific baseline and its data are unchanged.
9. No Phase 3.5B payload is silently substituted into Water Column 3D yet; pilot activation is explicitly deferred to Phase 4B.
10. TypeScript typecheck and production build pass.
11. Scientific/API regression passes.
12. Browser acceptance covers pilot selection, land suppression, catalog metadata and mobile no-overflow.
13. Public Pages deployment and live HTTPS/judge flow pass before declaring the merged phase complete.

## Rollback

- Start SHA: `5b8202d7d3d5e2e0ce7f2c69696f29c62c2b2e6f`.
- Branch: `ui/phase-4a-source-aware-geography`.
- No force-reset of `main`.
- If merged, revert the Phase 4A merge commit to return to the exact pre-Phase-4A state while retaining Phase 3.5B and Phase 5.0.

## Stop boundary

Stop after geographic evidence and status synchronization are complete and validated. Do not implement Phase 4B Water Column pilot loading, Phase 4C scale-out, new interpolation, or bulk acquisition in this phase.
