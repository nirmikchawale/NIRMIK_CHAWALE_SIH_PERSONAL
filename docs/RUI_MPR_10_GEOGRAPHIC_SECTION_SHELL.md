# RUI-MPR-10 — Geographic full-width section shell

**Base:** latest deployed MPR-03–09 main, SHA `43265375ef1c28ab6e94a48e6162f928b1aeb367`.
**Branch:** `rui/mpr-10-geographic-full-width-shell`. UI-only, safe under all sixteen glass themes.

## Delivered
- Full-width Geographic 3D heading in normal page flow, showing the active real source, scientific variable and region.
- Grid-first dominant real Cesium stage (75–77% of the scene/control width on 1280–1440 desktops); the existing `ControlPanel` provides the complementary independently scrollable right dock (23–25%). No duplicate React renderer or fake data.
- Actual `VisualizationDock` remains above the scene; original MPR-09 mode switching, camera control, basemap fallback, source toggles, animation and QC remain unchanged.
- Tablet/mobile vertically stack the real stage and controls, with stage heights responsive to viewport; no horizontal overflow.
- Existing focus, presentation, closed-panel modes and cross-route navigation remain independent.
- No edit to `OceanGlobe`, `WaterColumn3D`, API/data/scientific renderer, block manifests, native timestamps/depth, Argo QC, color mapping or 3DB science.
- Browser geometry, scroll, source state and legacy view-switch checks for 1440/1280/1024/768/390/320.

## Ownership/seams
MPR-11 follows on top of this branch: progressive dock sections and genuine jumps to existing catalog, source, basemap, camera and display-range controls. MPR-12 will be responsible for TWO simultaneously mounted real 3D sections and scrolling between them. Until then, Water Column remains an honest single-stage switch—not a second fake full-width renderer.

**Validation**: exact-head Vite/TypeScript build, pytest and scientific/fallback; targeted Playwright and complete hosted acceptance; all 16 themes; merge/release in planned order after MPR-17 integration. A PR/CI success is not public URL verification.
