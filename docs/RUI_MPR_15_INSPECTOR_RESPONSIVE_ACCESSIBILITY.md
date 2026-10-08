# RUI-MPR-15 — Inspectors, accessibility and responsive compatibility

**Parent:** MPR-14 PR #187, branch `rui/mpr-15-inspector-responsive-accessibility`.

## Actual changes
- Added `ExplorerInspectorAccess` in Explorer main scroll flow after the two real 3D sections. Its actions open/close the ORIGINAL `EvidenceRail`, `ProvenanceDrawer`, `ProfilePanel` or `ImportedObservationPanel`; no duplicated data, drawer logic, fake source badges or orphaned links.
- The observation entry is disabled unless a real Argo/verified imported observation profile is selected. The source/QC entry remains accessible during degraded/scientific error states and opens the real provenance information.
- Added explicit `aria-expanded` for working inspector actions, keyboard Enter/Tab native buttons, Escape closes open inspectors/mobile sheets and restores focus to its originating button when possible. Escape also exits focus/presentation when no inspectors are open, without overriding unrelated navigation.
- Six responsive widths in Chromium: 320, 390, 768, 1024, 1366, 1440; >=44px practical touch targets, mobile two-column/one-column accessible inspector buttons, no horizontal overflow, bounded inspector scrolling, safe line-wrapping in footer, controls stay visible. Theme-aware focus rings, forced colours, reduced motion.
- Original observation profile callouts and renderer camera/touch/wheel gestures remain in renderer ownership; presentation/focus modes intentionally hide the additional toolbar without stealing scene gestures.

## Scope/invariants
No changes to scientific datasets, time/depth or coordinate transforms, Argo QC, provenance claims, model/observation comparisons, backend/source adapters, 3DB render engines, scene physics, or theme preferences.

## Remaining
MPR-16: visual screenshot acceptance of 16 actual saved themes across both mounted sections, light/dark text/contrast/focus/chart semantics. MPR-17: exact-head full CI, merge reconciliation of 3DB PRs, Pages deployment and independent live Chromium acceptance. This phase is stacked and **NOT** claimed live prior to MPR-17 acceptance.

Check exact-head React/Cesium, science API/fallback, pytest and all hosted Chromium; verify original evidence/provenance/observation actions, 320px/390px geometry and Escape access. Release must not bypass incomplete checks.
