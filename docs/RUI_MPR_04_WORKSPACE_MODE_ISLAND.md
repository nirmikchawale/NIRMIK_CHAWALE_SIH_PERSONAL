# RUI-MPR-04 — Independent Workspace Mode Island

**Parent:** `rui/mpr-03-adaptive-workspaces-navigation` / PR #172 (do not merge out of order).
**Working branch:** `rui/mpr-04-workspace-mode-island`.
**Scope:** React presentation hierarchy only; no scientific payload/API/renderer/model timestamp/depth changes.

## Design and feature inventory
- A single **Workspace Mode** island is the FIRST normal-flow child of the existing Explorer landing stack.
- Its siblings remain the canonical **3D Explorer Feature Directory** (11 targets) and **Ocean Intelligence source island** (GLORYS, INCOIS multi-time, chlorophyll, plus three scientific workflow actions). Those feature identities and wiring must not be modified here.
- Mode actions are **Explorer**, **Analysis Split**, **Presentation**, **Focus 3D**. All call the exact former `App.tsx` mode handlers; this phase changes placement/visual hierarchy only, not mode semantics or sensor/variable/time/depth state.
- Remove ONLY the duplicate `Focus 3D` button from the top header. Preserve header **Controls**, **Sources & QC**, all source/degraded statuses, refresh, theme palette, Present Demo, logo and scientific banner.
- Focus mode: existing **Show panels** header exit; the island hides to maximize scene. Presentation mode: the existing **Exit presentation** action remains, and the island hides while presenting.
- MPR-01 shared semantic `--mpr-*` tokens + currentColor icons apply across all 16 preset glass themes (not Arctic-only). Soft island corners 20–26px, controls 12–14px, 44px+ touch zones, forced-colors/reduced-motion support. 320px/390px/1024px layouts adapt without horizontal overflow.
- MPR-04 is independent from planned MPR-05 feature directory navigation: do not remove/rename any feature buttons or alter their scroll targets here.

## Source files
- `frontend/src/components/ExplorerWorkspaceModeIsland.tsx` — relocated mode actions with icon-enhanced labels.
- `frontend/src/components/ExplorerDirectoryNav.tsx` — read-only feature directory, remove former nested mode actions.
- `frontend/src/App.tsx` — place mode island above feature directory; remove header's second Focus 3D button.
- `frontend/src/mpr-workspace-mode.css`, `frontend/src/main.tsx` — after-cascade theme-resolved responsive styling.
- `frontend/e2e/explorer-first-screen-layout.spec.ts` — reassert independent three-island ordering, preserve source integrity and scroll.
- `frontend/e2e/mpr-04-workspace-mode.spec.ts` — mode transitions, exits, no duplicate Focus action, 320/390/1024 responsive, science context and theme smoke.

## Release and recovery
1. Verify MPR-03 PR #172 exact head `77affcbad50cfeaa6a1d1db150df60076157f88e` (as of branching) passed complete browser gate, was merged, deployed and public-verified. Fix blockers first; only then retarget this PR #TBD to `main`.
2. Verify latest main and concurrent 3DB science branches. Do not overwrite scientific owner changes.
3. Frontend build/typecheck and API/fallback tests; complete static-host browser acceptance, existing RUI-NAV-02/visual-island tests, all-16 theme regression inherited from MPR-03.
4. Validate UI at 1440/1024/390/320 including source/depth/time persistence, Focus and Presentation exit.
5. Merge after all required checks pass; exact-main GitHub Pages build/deploy/live Chromium to close MPR-04. Never call it LIVE before passing these checks.
6. Record main/head/PR/run IDs and any failure in PR comment to resume without repeating work.

**Phase state:** Code and tests committed; release gates require independent CI/public evidence.
**Next:** MPR-05 Explorer Feature Directory continuous-scroll strip, after MPR-04 is fully live and verified.
