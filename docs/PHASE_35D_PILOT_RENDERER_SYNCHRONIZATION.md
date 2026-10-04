# Phase 3.5D — Source-Backed Pilot Renderer Synchronization

## Mission

Connect the genuine Phase 3.5B GLORYS12V1 pilot payloads to Ocean Canvas's existing scientific workspaces so a materialized Indian Ocean main block is not merely an inventory item: selecting it must hydrate the Geographic 3D view, Water Column 3D, timeline, telemetry, anomaly screening and provenance from the same exact source-backed block.

## Execution master prompt

> Starting from the production main branch after Phase 3.5B acquisition and Phase 5.0 shared scientific context, integrate only genuinely materialized main blocks into the live scientific renderers. Never activate a planning-only cell as scientific evidence. Use the Phase 3.5B checksum-addressed JSON payloads directly; preserve their exact longitude, latitude, depth and genuine daily timestamps; derive horizontal current speed only from retained uo/vo; never synthesize temperature, salinity, currents, timestamps, coordinates, depth levels, missing land/ocean cells or a vertical-current component. Make one selected source-backed block the canonical context for Geographic 3D, Water Column 3D, timeline, telemetry, anomaly screening and provenance. When the selected block changes, rehydrate all dependent workspaces deterministically so no stale baseline state survives. Preserve the original verified demo baseline as a one-click rollback context. Keep the remaining logical blocks visible as planning geometry but prevent them from replacing the active scientific source. Clearly label materialized pilot versus planned target versus verified demo baseline. Validate TypeScript, production build, static-hosted mode and live Chromium acceptance before merge; merge only through a normal PR and retain a normal revert path.

## Scientific contract

Phase 3.5D does not create new ocean evidence. It activates data already acquired and validated in Phase 3.5B.

- Logical grid: 140 target cells over 60–100°E and 5–25°N.
- Source-backed pilots: 24.
- Multi-date pilots: 6.
- Accepted pilot dates: 2004-03-15 for all 24, plus 2004-07-28 for the six multi-date pilots.
- Scientific origin: Copernicus Marine / Mercator Ocean GLORYS12V1, product `GLOBAL_MULTIYEAR_PHY_001_030`, dataset `cmems_mod_glo_phy_my_0.083deg_P1D-m`.
- Archive transport used by acquisition: NCAR GDEX public THREDDS OPeNDAP DAP2.
- Variables: potential temperature (`thetao`), salinity (`so`), zonal current (`uo`) and meridional current (`vo`).
- Current speed is derived only as `sqrt(uo² + vo²)`; no vertical velocity is inferred.
- Retained depth axis: 31 genuine source levels to approximately 453.94 m.
- No synthetic measurements, timestamps, coordinates or depths.
- No pilot is given Argo validation metrics unless an independent matched comparison bundle is later created for that exact pilot.

## Runtime architecture

`main-block-runtime.ts` is the activation gate. It permits the original `BASE-GLORYS-001` context and the 24 genuine pilot IDs to become scientific sources. Planning-only IDs remain geographic inspection targets but are rejected as renderer sources.

`api.ts` is the scientific adapter. When the active block is a pilot it builds the app catalog from the pilot manifest and exact payloads, routes field/volume/current calls through the Phase 3.5B loader, derives telemetry from finite exact source cells, performs explainable MAD anomaly screening on the selected exact source layer, and publishes pilot-specific provenance. When the active block is the verified demo baseline, the existing backend/static-science contract is unchanged.

The existing App, Cesium Geographic view and Water Column 3D remain the rendering surfaces. A deterministic reload after source-backed block changes is intentional: the current App constructs its catalog once at boot, so a reload is the lowest-risk way to guarantee that catalog, timeline, variable bounds, profile availability and all derived workspaces hydrate from the same block rather than mixing state from two scientific contexts.

## UI behavior

The Indian Ocean Block Engine reads the Phase 3.5B manifest and visually separates source-backed pilots from planned cells. Pilot inspection exposes source, native dates, retained depth evidence, ocean relevance and checksum-backed payload status, with a dedicated action to load the selected pilot into Geographic + Water Column 3D. Planning cells show an explicit renderer lock.

A compact pilot renderer bridge appears while a pilot is active. It identifies the active block, source, native time, coverage and integrity status, states that Geographic 3D and Water Column 3D are synchronized, and provides a one-click return to the original verified demo baseline. Legacy planning-only labels are suppressed only while a real pilot is active.

## Telemetry and anomaly semantics

Pilot telemetry is computed client-side from exact retained payload values. At each genuine depth it reports count, mean, minimum, maximum, population standard deviation and P10/P50/P90 over finite source grid cells. Multi-date pilots also expose genuine time summaries at the selected exact depth. No temporal or vertical samples are invented.

Pilot anomaly screening uses the same explainable spatial method as the baseline API: `0.67448975 × (x − median) / MAD`, two-sided absolute threshold 3.5, and a fail-closed policy when MAD is zero. Residual/Argo screening is empty for pilots because no independent pilot-specific matched observation bundle is claimed. Temporal anomaly screening remains locked because Phase 3.5B pilots have only one or two genuine timestamps and the robust temporal screen requires at least three.

## Acceptance criteria

1. Exactly 24 logical cells are labeled source-backed materialized pilots; 116 remain planning-only.
2. A planning cell cannot replace the active scientific source.
3. Activating `IO-001` persists the block and rehydrates the page.
4. Shared scientific context reports `IO-001` and materialization `pilot`.
5. The Geographic workspace uses the pilot catalog/field/current payload rather than the baseline API payload.
6. Entering Water Column 3D renders the source-backed pilot volume rather than the planning-only empty shell.
7. `IO-001` exposes both genuine dates; a one-date pilot exposes only its single genuine date.
8. Pilot telemetry/anomaly/provenance remain source-specific and never inherit baseline Argo validation claims.
9. Returning to `BASE-GLORYS-001` restores the original verified demo context.
10. Typecheck, production build, static-hosted browser acceptance and post-deploy HTTPS/judge-flow verification pass.

## Rollback

Phase start SHA: `5b8202d7d3d5e2e0ce7f2c69696f29c62c2b2e6f`.

Implementation branch: `ui/phase-35d-pilot-renderer-sync`.

Rollback is a normal revert of the Phase 3.5D merge commit. Do not force-reset public `main`. Phase 3.5B payloads remain additive evidence even if renderer synchronization is reverted.
