# Ocean Canvas — Phase 3.5A Main Block Engine Master Prompt

## Mission
Build the reusable, time-ready Indian Ocean **main-block engine** that will let Ocean Canvas scale from the current single verified GLORYS12V1 main volume to many genuinely different geographic volumes without duplicating renderer code, inventing data, or loading hundreds of blocks at once.

This phase is architecture + visible planning UI. It does **not** claim that the 140 target blocks have already been downloaded. Real additional geographic blocks belong to Phase 3.5B.

## Starting production baseline
Phase 3.5A starts after Phase 3.5-HF, whose purpose is to center and viewport-bound the Appearance Lab on desktop and mobile.

Rollback anchor before Phase 3.5A: `9db3ac0bc622f03a5f44fd1b7b805a50f9519cb2`.

Development branch: `data/phase-35a-main-block-engine`.

## Non-negotiable scientific rules
1. A **new main block** means a new geographic source extraction comparable in status to the existing 67–70°E × 12–14°N GLORYS volume. It is not a Phase 3 sub-sector.
2. Do not manufacture ocean values, timestamps, depths, coordinates, observations, or current components.
3. The 140 Phase 3.5A target cells are a logical deployment manifest only until Phase 3.5B materializes them.
4. Keep the current verified block explicit and separate from the 140 future targets.
5. Preserve the current scientific renderer, API contracts, GLORYS values, INCOIS evidence, Argo comparison and provenance.
6. Preserve scientific colour maps independently from UI glass themes.
7. Do not call a logical target “available”, “verified”, “downloaded”, or “live” unless a source-backed artifact exists for that exact geographic block.

## Geographic target architecture
Planning domain:
- Longitude: 60–100°E
- Latitude: 5–25°N
- 10 rows at approximately 2° latitude each
- 14 longitude columns, mostly 3° wide, with a narrower final 99–100°E column
- 140 logical target main blocks

Stable IDs:
- `IO-001` through `IO-140`

Current verified baseline remains:
- `BASE-GLORYS-001`
- 67–70°E
- 12–14°N
- 02 Jan 2024 daily mean
- 31 verified depth levels
- temperature, salinity and horizontal currents

The target grid may intersect the footprint of the current baseline, but this does not make those target blocks materialized. They remain separate future extracts.

## Time-ready schema
Every future materialized main block must fit this hierarchy:

`BLOCK → DATE → NATIVE TIME → VARIABLE → DEPTH`

The manifest must be able to express:
- historical daily frames;
- operational native sub-daily timestamps when a supporting product is integrated;
- available dates per block;
- native UTC times per date/source;
- variables available at that timestamp;
- depth coverage;
- provenance and source product;
- optional interpolation only when explicitly labelled `INTERPOLATED` and bounded by genuine native frames.

Phase 3.5A implements the schema shape, not the additional time-series data.

## Reusable engine principle
Do not create 140 React components or 140 copies of Water Column 3D.

Use one manifest and one future loader:

`selected block → selected date → selected time → selected variable → selected depth → shared Cesium/Water Column renderer`

The future data loader should support lazy acquisition and a small LRU cache rather than preloading every block.

## Visible Phase 3.5A UI
Add a glass launcher on Explore named:

`Indian Ocean Block Engine`

The panel must show:
- 140 logical target blocks;
- current verified baseline count = 1;
- newly materialized Phase 3.5A blocks = 0;
- target geographic domain;
- regional filtering;
- block search;
- selected block bounds and region;
- future source plan;
- time-ready hierarchy;
- explicit statement that planned blocks contain no new bundled ocean values yet;
- current verified baseline metadata.

The panel must be clearly distinct from the Phase 3 Arabian Sea 12-sector atlas. Phase 3 sectors are sub-volumes of the current block; Phase 3.5A target cells are future independent source extracts.

## UX and glassmorphism requirements
- Use the active Phase 2/3 glass tokens.
- Support all 16 appearance themes.
- Fixed viewport-safe modal panel with its own scroll ownership.
- Desktop: high-density 14-column planning grid where practical.
- Tablet/mobile: progressively reduce columns while preserving all 140 accessible entries.
- No horizontal document overflow.
- Launcher must not collide with the Phase 3 Atlas launcher.
- `Escape` closes the panel.
- Outside/backdrop click closes the panel.
- Keyboard focus remains visible.
- `prefers-reduced-motion` removes nonessential transitions.

## Phase 3.5-HF dependency
The Appearance Lab hotfix must remain intact:
- render through `document.body` portal;
- center horizontally in the viewport;
- safe-area aware;
- internally scrollable;
- no clipping by header/workspace overflow;
- desktop/mobile centering acceptance tests retained.

## Acceptance tests
Phase 3.5A is accepted only if:
1. `INDIAN_OCEAN_MAIN_BLOCKS.length === 140` by construction.
2. IDs are stable `IO-001`…`IO-140`.
3. Every target has non-overlapping deterministic planning bounds in the configured grid.
4. Every target is labelled `planned` in Phase 3.5A.
5. The UI explicitly reports 0 newly materialized target blocks.
6. The current verified baseline remains separately visible.
7. Selecting/filtering a target does not change the current scientific source or scientific values.
8. Desktop TypeScript typecheck passes.
9. Production frontend build passes.
10. Existing browser suite still discovers/runs.
11. Dedicated main-block browser tests confirm 140 targets and planned status.
12. Mobile 390×844 and 430×932 panels remain fully inside the viewport.
13. No horizontal document overflow is introduced.
14. Existing Phase 3 Atlas remains available.
15. Existing theme gallery alignment fix remains available.

## CI / release gate
Run:
- standard Python regression suite;
- TypeScript typecheck;
- production React build;
- static-hosted scientific contract;
- science/API/fallback tests;
- browser acceptance including the new main-block suite.

Only merge Phase 3.5A into `main` when the branch is mergeable and the relevant build/science/browser gates show no regression. After merge, verify GitHub Pages deploy and the public HTTPS site.

## Rollback
If Phase 3.5A causes a regression, revert the Phase 3.5A merge commit. Do not reset or rewrite `main` history.

Known safe pre-3.5A production anchor:
`9db3ac0bc622f03a5f44fd1b7b805a50f9519cb2`

## Next phase
Phase 3.5B will acquire a geographically distributed pilot set of genuinely different GLORYS main blocks and attach real source-backed artifacts to selected `IO-xxx` IDs. Phase 3.5A itself must stop short of pretending that acquisition is already complete.
