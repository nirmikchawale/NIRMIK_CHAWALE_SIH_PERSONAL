# RUI-MPR-11 — Geographic progressive tool dock

**Parent:** MPR-10 PR #183. **Phase branch:** `rui/mpr-11-geographic-progressive-controls`.

## Delivered
The original `ControlPanel` remains the ONE canonical interactive scientific control set and now occupies the independently scrollable right-hand geographic dock from MPR-10. Controls are organized as native keyboard-operable expandable sections:

- **Variables & field layers:** the original genuine source-backed switcher, min/max units, volume/slice selection, rendering display and safeguards.
- **Depth & section:** true source depth levels and existing nonlinear bathymetric controller (surface-only locked where required).
- **Native time:** original INCOIS scrubber where genuine multi-time exists; GLORYS original single verified timestamp otherwise.
- **Observations & Argo:** existing verified profile options, QC caveats, and imported observation references.
- **Source status & scientific quality:** original product ID, region, and limitations (no added certification).

A dock header and real-element navigation links to the pre-existing Block & Region catalog, ScientificColorbarHud (palette/range), Ocean Globe camera controls and basemap selector. These links **FOCUS THE EXISTING CONTROLS; THEY DO NOT CLONE COMMANDS**. The camera/basemap actions stay owned by `OceanGlobe`, preventing handler duplicates, stale state and concurrent 3DB-15 conflict. They remain in the scene tool shelf until integration can safely migrate that renderer-owned presentation element. Explicit hand-off boundary, not a hidden claim of completed physical migration.

For all five groups, state-changing callbacks, accessibility names, native data, science availability, effective timestamp and depth are exactly those already used by the app. Initial groups are expanded for backward-compatible accessibility, but the user may collapse and reopen; the four existing jump buttons auto-expand the target group.

## Validations and dependencies
- Frontend TypeScript check and Vite build; inherited pytest, FastAPI, scientific static API contracts.
- Dedicated Chromium at 1440, 1024, 390, 320; keyboard disclosure state, original controls and payload invariance; 16-theme loop; no horizontal overflow.
- No backend, scientific source manifests, model/observation arrays, provenance, Argo QC, Cesium camera computations or WaterColumn 3D engine modifications.
- MPR-12 is responsible for independently mounted, genuine Water Column 3D section below Geographic; MPR-14 will gate synchronous native source/block/time/depth and stale-data visibility.
- PR is stacked on MPR-10. No live-public-URL claim until MPR-17 merge/CI/Pages/Chromium. The concurrent scientific 3DB-15 PR #181 must be reconciled at release without overwriting its renderer changes.
