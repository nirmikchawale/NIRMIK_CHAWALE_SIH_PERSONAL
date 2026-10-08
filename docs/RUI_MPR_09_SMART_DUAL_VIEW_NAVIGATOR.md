# RUI-MPR-09 — Smart Dual-View Navigator (safe single-stage integration)

**Parent:** MPR-08 PR #178. **Branch:** rui/mpr-09-smart-dual-view-navigator

## Scope and state truth
The current Ocean Canvas stage uses one *active* source-backed renderer at a time and its other renderer is inert/hidden. MPR-09 supplies a single reusable Smart Dual-View Navigator with clear Geographic 3D / Water Column 3D hierarchy, source-eligibility disables, active/inactive states, accessible labels, keyboard focus and a visible reverse/forward scene switch. Navigation changes the existing `visualizationMode` through the existing handler and scrolls the actual #mpr-3d-stage into view (respecting reduced-motion); it never fabricates a second data view or a synthetic depth/time.

The prior VisualizationDock continues to show real native time, region, model/product and observation text. The original mode element's `visualization-dock-modes` class, button labels and `aria-pressed` behavior remain compatible with existing browser tests. An in-scene source-eligibility-aware shortcut supports return to Geographic 3D without scrolling back to the navigator. Styling inherits all 16 glass themes, forced colours, reduced motion and responsive 1440/1024/390/320 support.

## Explicit deferred integration seam
MPR-10 and MPR-11 own the full-width *separate simultaneously mounted* Geographic and Water-Column sections; MPR-12 owns dock composition. The sticky-only-in-two-sections behavior, two separate scroll anchors and scroll-driven active section tracking **cannot honestly be demonstrated until both actual sections exist**. They are not claimed as delivered by this phase. This implementation exposes the reusable navigation component and a stable real-stage anchor, without entering the 3DB renderer owner's territory. After stacked sections are introduced, follow-on MPR acceptance must wire observer-driven active section state and scoped sticky navigation.

## Invariants and release gates
No model/time/depth values, 3DB engine, Cesium/WaterColumn physics, observer matching, API, QC, provenance or provider claims changed. Pass exact-head frontend typecheck/build, targeted MPR-08/09 Chromium, full Playwright final-mvp and Python/science/fallback. All 16 theme states, focus and 320px layout must remain valid. This PR is stacked; do not merge before MPR-03 through MPR-08 have passed all CI and public Pages gates. Retarget/reconcile with concurrent main before each merge; only mark LIVE when exact-merged-main Pages build/deploy and public Chromium succeed.
