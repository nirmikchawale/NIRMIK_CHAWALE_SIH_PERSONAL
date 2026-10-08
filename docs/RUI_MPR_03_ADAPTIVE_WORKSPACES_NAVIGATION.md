# RUI-MPR-03 — Adaptive Workspaces Navigation

**Scope:** Presentation + accessibility only. No scientific renderer, datasets, source selection algorithms, QC/provenance rules, model timing/depth, or page route IDs altered.

## Verified baseline before branch
- Main SHA: `93f1573c18d024d796d319e1f58913fab67d7b7d`.
- MPR-00 (#167), MPR-01 (#168), MPR-02 (#170): merged; MPR-02 `tests`, `final-mvp`, GitHub Pages build/deploy/live judge-flow all passed. Its public acceptance logged 136 direct passes plus one flaky old globe test that passed on retry.
- In-flight RUI-VIS-01 readiness #140 and comparison empty-state #159 are separate; MPR-03 must not merge unrelated changes.

## Target and implementation
- 72px icon-rich rail on >900px desktop, with **four categories only**: Explore, Analyze, Data, Science. Current route highlighted with an icon AND visible text.
- Four categories lead to existing six canonical routes via a ~316px fixed **overlay directory**, not a permanently expanded 272px sidebar. Opening and closing the overlay does not resize Cesium, shift the globe's canvas, change current route, or reset scientific context.
- The overlay includes selectable four-category bar, canonical breadcrumbs, one expanded group, readable route descriptions and existing page identifiers. The old `NAVIGATION_TREE`, `pageItem`, `routeFromHash`, all six route IDs and their deep links remain unchanged.
- Mobile <=900px: existing Workspaces launcher, independent off-canvas drawer and overlay category bar with reachability at 320/390 widths.
- Opening: keyboard focus moves to selected category. `Tab`/Shift+`Tab` wrap inside the directory; Escape dismisses it and returns focus to the appropriate launch button. Backdrop and route selection also close directory. Focus/Presentation mode hides global navigation.
- 16 existing glass styles source colors/blur from `--mpr-*` tokens; no Arctic/Mint hardcode. Reuse semantic MPR icon vocabulary with visible labels; rounded surfaces and >=44px mobile touch controls.

## Files
- `frontend/src/components/AppNavigation.tsx`: adaptive presentation state only, unchanged route model.
- `frontend/src/mpr-workspaces-navigation.css`, final import in `frontend/src/main.tsx`: layout/token styling scoped to application.
- Update older nav/shell/rui-vis/context browser acceptance assertions that assumed permanently expanded sidebar; replace them with assertions for new rail, overlay, six routes, mobile reachability, scientific context independence and responsive clarity.
- `frontend/e2e/mpr-03-workspace-navigation.spec.ts`: exhaustive 16-theme rail test, keyboard focus, 320px route.
- This execution ledger.

## Acceptance: pending until proven
1. TypeScript/typecheck + Vite production build.
2. Playwright: four categories, six native hash routes, no loss of breadcrumb/tree semantics, accessible focus, Escape, mobile.
3. Desktop main stage width unchanged on opening overlay.
4. All 16 glass themes and scientific context preserved.
5. Existing `final-mvp` CI and public Pages live test pass after merge. Separate scope of MPR-04 not included.
6. No unintentional scientific-code/dataset diff; review changed paths before merge.
7. Monitor previously flaky globe test if recurring; do not misattribute to MPR-03.

**Status:** Work staged on `rui/mpr-03-adaptive-workspaces-navigation`; PR/CI/live checks require independent evidence.
**Next after MPR-03 live verification:** MPR-04 standalone Workspace Mode island.
