# RUI-MPR-05 — 3D Explorer Horizontal Feature Directory

**Workstream:** RUI-MPR · visual UI restructure only
**Parent:** PR #173 `rui/mpr-04-workspace-mode-island`, after PR #172 (MPR-03). MPR-00..02 are live at baseline main `93f1573c18d024d796d319e1f58913fab67d7b7d`.
**Branch:** `rui/mpr-05-explorer-feature-directory-strip`
**Approval:** the four user-approved main-page reference layouts define hierarchy, not a single theme. All 16 glass presets remain authoritative.

## Resulting top-of-Explorer order

1. Existing Ocean Canvas header (scroll-away) and adaptive Workspaces rail (MPR-03).
2. Independent Workspace Mode island (MPR-04): Explorer, Analysis Split, Presentation, Focus 3D.
3. **THIS PHASE** — one full-width rounded 3D Explorer Feature Directory island: explanatory title on the left for large viewports, a single horizontally scrollable feature rail on the right; stacked title and rail on mobile. No clickless scroll arrow or "scroll to explore" instruction; native horizontal scrolling, touch swipe and keyboard are self-evident.
4. Existing Ocean Intelligence source island (unchanged by MPR-05).

## Eleven canonical buttons and existing DOM targets

| Feature | Existing scroll target |
|---|---|
| Overview | `.evidence-status-pill, .evidence-rail` |
| Workspace | `.visualization-dock` |
| Block System | `[data-testid='rui-nav-02-block-system']` |
| Scene Controls | `.renderer-tools` |
| Variables | `#explore-variables` |
| Display Range | `.scientific-colorbar-hud` |
| Depth & Section | `#explore-depth` |
| Time | `#explore-time` |
| Observations | `#explore-observations` |
| Render Quality | `.imagery-control` |
| Context & Info | `.source-workbench` |

These are the existing MPR-04 parent selectors, unchanged. **Do not invent a new destination for a target not presently mounted in the active mode.** Click resolution chooses the first visible DOM target and announces "not available in this view" to assistive technology when none exists. Planned UI relocation into Geographic/Water Column right docks will rewire their canonical selectors in MPR-10..13; no scientifically false destination is created here.

## Changed files

- `frontend/src/components/ExplorerDirectoryNav.tsx`: same 11 IDs/labels/target selectors, new MprIcon from 30-glyph theme-neutral system, keyboard ArrowLeft/ArrowRight/Home/End, reduced-motion-compliant real target scrolling and polite unavailable announcement. No new scientific state.
- `frontend/src/mpr-feature-directory.css`: two-column island on desktop, single column on mobile; 44+ px button touch targets, x-scroll and native touch, keyboard rings, rounded themes, forced colours and reduced motion; no auto-fake status, arrows or scroll instruction.
- `frontend/src/main.tsx`: late CSS import after MPR-04 and 16-theme styles.
- `frontend/e2e/mpr-05-feature-directory.spec.ts`: count/labels, 1440/1024/390/320 geometry, native scroll, keyboard, real Block/Context destinations, unchanged source selection, all-16 theme picker compatibility.
- This ledger.

## Scientific invariants
**Absolutely no change** to model arrays, source/time/depth coordinates, scientific manifest, pilot data, checked provenance/QC, in-situ observations, backend APIs, 3DB visualization engine, Cesium/Water Column camera state, and export computation. The directory is navigation chrome only. Same source, selected block and workspace actions stay wired to existing UI. No new scientific claims.

## Release gates and recovery

1. MPR-03 PR #172 has outstanding browser acceptance; MPR-04 PR #173 must pass its own full browser gate. **Do not merge this stacked PR before BOTH predecessors are merged and their main/Pages verification gates have passed.**
2. Re-verify branch parent and current main after any concurrent 3DB-13 scientific release; reconcile shared files, never overwrite science.
3. Pass exact-head React/Cesium typecheck/build, repository tests, science API/fallback, complete Playwright browser acceptance.
4. Test key navigation, scroll confinement (no horizontal page overflow), all 11 existing destinations, mobile 320/390, desktop 1024/1440, actual target navigation and reduced motion.
5. Cycle all 16 canonical glass themes; rounded glass surfaces and icon palette must be theme-derived and must not alter scientific colourmaps or selected source.
6. Retarget this PR to `main` after MPR-04 merges, ensure diff contains ONLY MPR-05 files (and document ledger), then merge on green gates.
7. Verify exact-merged-main Pages `build` + `deploy` + `verify-public`; test public URL `#/explore`. Only declare **LIVE & VERIFIED** when positive public evidence is available.
8. At timebox/interruption, save exact SHA, PR number, failing tests, next unmet gate and resume there; **do not repeat MPR-00..04**.

**Checkpoint at initial authoring:** implementation committed on MPR-05 branch, PR/CI/public deployment pending.
**After MPR-05:** MPR-06 Ocean Intelligence source selector hierarchy, not scientific source changes.
