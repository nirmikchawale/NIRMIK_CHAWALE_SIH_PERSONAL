# Ocean Canvas — Optimus Phase 3 Master Plan

## Mission

Evolve the deployed Phase 0–2 Ocean Canvas baseline into a visibly stronger, scientifically honest multi-block Arabian Sea 3D workspace without weakening the existing Cesium globe, Water Column 3D, evidence/provenance, glass theme system, or deployment guarantees.

The newest explicit count request is treated as a target of **at least 11 additional 3D views**. Phase 3 implements a **12-sector Arabian Sea 3D atlas** while retaining the existing full-region Water Column 3D as the canonical overview. The sector atlas is a spatial decomposition of the same verified dataset, not a claim that 12 independent ocean-model simulations exist.

## Optimized execution prompt

> Act as the principal frontend/scientific-visualization engineer for Ocean Canvas (SIH26067). Start from the current production `main` baseline after Phases 0, 1 and 2. Preserve scientific integrity before visual novelty. Implement Phase 3 as a reversible, testable layer that adds a data-driven Arabian Sea multi-block 3D atlas. Derive every sector only from already verified GLORYS12V1 volume/current payloads; never synthesize values, timestamps, coordinates, depth levels, vertical current components, or independent model runs. Partition the available longitude/latitude footprint deterministically into twelve non-overlapping spatial sectors, render each as an actual data-driven 3D point-cloud block, keep one common scientific colour range per selected variable, expose temperature, salinity and current-speed modes, show coverage/sample/depth metadata, and state clearly that sectors are sub-volumes of one canonical model field. Keep the existing full-region Water Column 3D unchanged as the overview. Integrate the atlas through a compact judge-facing launcher that does not block the normal Explorer flow. Use the Phase 2 semantic glass tokens, support dark/light presets, responsive mobile layouts, reduced motion, keyboard focus, accessible labels and bounded internal scrolling. Lazy-load atlas data so the core MVP boot path is not slowed. Add automated acceptance coverage for launcher visibility, twelve sector cards, variable switching, sector selection and mobile bounds. Run typecheck/build/browser checks before merge, merge only after the feature branch is clean and deploy through the existing GitHub Pages pipeline. Verify the published HTTPS site and retain an easy rollback point.

## Requirements extracted

1. Begin Phase 3 from the already deployed Phase 0–2 baseline.
2. Produce visible MVP changes, not documentation-only work.
3. Add multiple additional 3D Arabian Sea views using the current verified dataset.
4. Preserve the original full-region 3D block.
5. Do not mislabel spatial subsets as independent numerical model runs.
6. Use real model values and genuine coordinates/depths only.
7. Keep temperature, salinity and current-speed views available.
8. Keep common colour scaling within a variable so sector-to-sector comparison remains meaningful.
9. Keep the feature performant enough for GitHub Pages and judge laptops.
10. Keep the feature isolated and reversible.
11. Validate desktop/mobile accessibility and deployment.

## Scientific design

### Canonical source

Phase 3 reuses the exact static/API contracts already consumed by Ocean Canvas:

- `VolumeResponse` for temperature (`thetao`)
- `VolumeResponse` for salinity (`so`)
- `CurrentsVolumeResponse` for horizontal current speed

No new numerical interpolation or forecast is introduced by the atlas.

### Spatial partition

The loaded model footprint is divided into a deterministic **4 × 3 grid = 12 sectors**. Every source point is assigned to exactly one sector using normalized longitude/latitude indexing. Maximum-edge points are clamped into the final row/column so no verified sample is lost or duplicated.

Sector identifiers are `AS-01` through `AS-12`, ordered north-to-south and west-to-east for judge readability.

### What a sector means

A sector is a **spatial sub-volume** of one model field at one genuine model time. It is not:

- a new forecast,
- a separately trained model,
- a synthetic ocean state,
- a new timestep,
- an inferred vertical-current solution.

The existing Water Column 3D remains the full-region overview.

## UX design

### Launcher

A compact fixed glass launcher appears on Explore:

**Arabian Sea 3D Atlas — 12 verified sectors · Phase 3**

It opens the atlas on demand so the normal judge flow remains unobstructed.

### Atlas panel

The panel contains:

- Phase 3 scientific-integrity explanation,
- Temperature / Salinity / Current speed switcher,
- source time and global range,
- full coverage and verified sample count,
- twelve data-driven mini 3D sector blocks,
- longitude/latitude bounds per sector,
- genuine depth count,
- sector mean for the selected variable,
- selected-sector evidence summary.

### Rendering

Each sector canvas uses the actual sector samples. A perspective wireframe cuboid provides geographic/depth context and source points are coloured using the same global minimum/maximum for all twelve sectors in a variable. This preserves visual comparability.

## Performance constraints

- Atlas payloads load only after the user opens the feature.
- At most 650 points are drawn per mini-canvas frame; drawing uses deterministic striding only for display density, not scientific mutation.
- Twelve canvases are independent, resize-aware and capped at device pixel ratio 2.
- No animation loop runs continuously.
- Existing Cesium and Water Column renderers remain untouched.

## Accessibility and responsive acceptance criteria

- Launcher has an accessible name and expanded state.
- Panel is a labelled dialog.
- All 12 sector cards are keyboard-focusable buttons.
- Selected sector uses `aria-pressed`.
- Variable controls use a labelled button group.
- Mobile uses 2 columns, then 1 column at very narrow widths.
- The panel is viewport-bounded and internally scrollable.
- Reduced-motion disables decorative transitions.

## Release gates

Phase 3 is releasable only when all of the following are true:

1. TypeScript typecheck passes.
2. Production Vite build passes.
3. Existing scientific/static artifact checks still pass.
4. Existing judge-flow browser tests still pass.
5. Phase 3 test confirms 12 sector cards.
6. Variable switch changes to salinity/current data without page errors.
7. Selecting a sector updates its evidence summary.
8. Public GitHub Pages deployment succeeds.
9. Public HTTPS verification succeeds.
10. No synthetic-data claim or independent-model claim is introduced.

## Rollback

Phase 3 is isolated on `ui/phase-03-arabian-sea-atlas`. The pre-Phase-3 production point is commit `3875dfb053b2808e5465795e4943aaf5cfad20be`. Reverting the Phase 3 merge restores the Phase 0–2 production experience without touching the scientific backend/static evidence.
