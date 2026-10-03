# Phase 3.5A-G — Integrated Indian Ocean Earth + Water-Column Engine

## Master execution prompt

You are the implementation lead for Ocean Canvas (SIH26067). Execute this phase as a controlled extension of the already deployed Phase 3.5A main-block manifest. The user's goal is not another catalog, dialog, card, or detached demo. The primary judge-facing Earth model itself must become the main-block interface.

### Starting release and rollback

- Start SHA: `05b4f8314a813f7f6b073e074897ddf44ac0f774`.
- Working branch: `ui/phase-35a-globe-water-column-integration`.
- Never force-push or rewrite `main`.
- Preserve the start SHA as the immediate known-good rollback anchor.
- Merge through a PR only after the React/Cesium build, browser acceptance, scientific/fallback suites and static-hosted contract are green.
- After merge, require GitHub Pages build, deploy, public HTTPS check and live Chromium judge-flow verification before calling the phase live.

## Product objective

Make the existing 140 `IO-001`…`IO-140` Indian Ocean target blocks first-class objects in the main geographic CesiumJS view and in the connected Water Column 3D workflow.

The main visual story is:

**Earth → India → integrated Indian Ocean 140-block field → selected geographic block → connected Water Column 3D**

The separate Phase 3.5A block dialog may remain as a secondary catalog and audit surface, but it must no longer be the primary way a judge discovers the 140-block architecture.

## Scientific truth contract — non-negotiable

1. The 140 targets are genuine geographic/index geometry defined by the Phase 3.5A manifest across 60–100°E and 5–25°N.
2. They are **not** 140 downloaded GLORYS volumes yet.
3. The current `BASE-GLORYS-001` footprint at 67–70°E, 12–14°N remains the only materialized GLORYS water-column volume in this phase.
4. Never duplicate, translate, stretch, interpolate or recolor the baseline's scientific values into another target block.
5. A planned target may show its exact lon/lat shell, planned source, variables and time/depth schema, but it must show **zero scientific values** until genuine source-backed materialization occurs.
6. A planned Water Column view must say plainly: `PLANNED TARGET · NO MATERIALIZED VOLUME`.
7. The verified baseline must continue to show the existing genuine scientific Water Column 3D unchanged.
8. Scientific palettes and meanings for temperature, salinity, horizontal currents, chlorophyll, QC and provenance remain unchanged.
9. Do not claim Cesium ion hosting or ion assets unless an actual ion dependency/token/asset is introduced. The present renderer is CesiumJS with the existing imagery/fallback chain.

## Geographic Earth-model requirements

- Render all 140 target footprints directly as lightweight Cesium entities in the main globe.
- Keep the full outer 60–100°E × 5–25°N domain visually bounded.
- Use a restrained cyan planning grid for logical targets.
- Use a clearly different amber/gold treatment for the current verified baseline.
- Highlight exactly one active block with a brighter outline/fill and one label; do not render 140 persistent labels.
- Make the opening journey finish at the integrated Indian Ocean block field instead of only the old 67–70°E verified window.
- Keep Earth and India orientation steps intact.
- Preserve the current source-backed field, volume, current vectors, Argo and imported in-situ layers.
- A geographic click inside the verified study frame selects the baseline and retains the existing direct Water Column entry behavior.
- A geographic click elsewhere inside the 140-block domain selects the corresponding `IO-xxx` target without mutating scientific data.
- Provide an integrated, compact glass HUD on the globe with:
  - active block selector;
  - exact bounds and region;
  - materialization status;
  - `140 logical / 0 new materialized / 1 verified baseline` status;
  - Fit selected block;
  - Fit 140-block field;
  - Open in Water Column 3D;
  - Return/select verified baseline.

## Water Column 3D requirements

### Verified baseline selected

Use the existing source-backed Water Column 3D renderer and all its present interactions:

- real points / current vectors;
- real depth levels;
- orbit, zoom and camera presets;
- scientific palette and legend;
- selected depth layer;
- isosurface behavior where applicable;
- existing time and provenance semantics.

Add only a compact main-block context identifying `BASE-GLORYS-001` as the active verified volume.

### Planned `IO-xxx` selected

Show a connected, interactive-looking 3D **geographic shell**, not fake ocean science:

- exact block longitude/latitude footprint;
- wireframe/isometric water-column geometry;
- source depth axis explicitly marked pending genuine materialization;
- no value particles, fake temperature cells, fake current arrows, fake depths or fake colorbar;
- exact region and bounds;
- planned GLORYS/operational source contract;
- reserved variables Temperature / Salinity / horizontal currents;
- future hierarchy `block → date → native time → variable → depth`;
- `0 values bundled for this target` disclosure;
- one-click return to the verified baseline volume.

This empty but spatially correct shell is an intentional scientific state, not a placeholder. It is the visual contract that Phase 3.5B may populate only after a real source acquisition succeeds.

## Shared state contract

The active main-block selection must be shared between the Cesium globe and Water Column 3D without changing the scientific API.

- Persist only the block ID in local storage.
- Broadcast same-tab changes with a custom browser event.
- Resolve invalid/missing IDs safely to `BASE-GLORYS-001`.
- Selection state must never rewrite field, volume, QC, provenance or API payloads.

## UX and visual design

- Follow the current scientific glassmorphism system.
- Do not blur the Cesium/WebGL canvas itself.
- Blur one HUD/panel surface rather than every child control.
- Preserve readable dark and light themes.
- Keep planned vs verified status visible through text and geometry, not color alone.
- Avoid blocking the main renderer with a large modal.
- The 140-grid should be understandable immediately after the Earth → India transition.

## Performance requirements

- 140 lightweight Cesium rectangle entities are acceptable.
- No 140 heavy HTML overlays or permanent labels.
- Keep `requestRenderMode` behavior.
- Do not duplicate scientific volume primitives.
- The planned Water Column shell uses one canvas and no large synthetic arrays.
- Existing Cesium field/volume/current rendering stays source-driven.

## Responsive and accessibility requirements

Validate at minimum:

- 390×844
- 430×932
- 768×1024
- 1280×720
- 1366×768
- 1440×900
- 1920×1080

Requirements:

- no application-level horizontal overflow;
- integrated HUD remains screen bounded;
- mobile HUD owns its own overflow if necessary;
- all selects/buttons keyboard reachable;
- focus-visible preserved;
- status labels readable without relying on color;
- reduced-motion behavior preserved;
- existing scroll ownership contract remains unchanged.

## Acceptance tests

Automate these assertions:

1. Primary globe reports 140 main blocks.
2. Initial active main block is the verified baseline when no valid stored target exists.
3. Globe selector contains baseline + 140 target options.
4. Selecting `IO-047` changes block selection/status only, not the scientific source.
5. Planned target says zero materialized scientific values.
6. Entering Water Column with `IO-047` selected shows the planned shell, not baseline values relocated to the target.
7. Planned shell can switch back to the verified baseline.
8. Verified baseline then renders the existing scientific Water Column 3D.
9. Mobile/tablet views have no horizontal overflow.
10. Existing Phase 3.5A catalog tests, source tests, scientific contract tests and judge-flow tests continue passing.

## Release report format

At completion report exactly:

- START SHA
- WORKING BRANCH
- PR / MERGE SHA
- FILES CHANGED
- EARTH MODEL CHANGES
- WATER COLUMN CHANGES
- SCIENTIFIC BOUNDARY
- TESTS / CI
- RESPONSIVE CHECK
- DEPLOYMENT STATUS
- PUBLIC URL
- ROLLBACK SHA
- NEXT MATERIALIZATION PHASE — NOT STARTED

Do not claim visual changes are live until the merged GitHub Pages deployment has completed successfully and the public HTTPS deployment has been checked.
