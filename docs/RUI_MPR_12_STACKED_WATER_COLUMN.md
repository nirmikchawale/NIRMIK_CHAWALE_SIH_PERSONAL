# RUI-MPR-12 — True second Water Column 3D section

**Parent:** MPR-11 PR #184; branch rui/mpr-12-stacked-water-column-section. Separate renderer section physically below Geographic 3D. Source-of-truth remains the existing React/FastAPI/INCOIS science payload.

## Delivered
- Two real continuously mounted visualizations: existing Cesium OceanGlobe within Geographic stage `#mpr-3d-stage`; existing WaterColumn3D within independent `#mpr-water-column-section`. No offscreen copy, screenshot, illustration, duplicated volume, fake layer, or new simulated ocean science.
- Responsive full-width Water Column 3D section, ~76% actual source-backed scientific canvas and ~24% independently scrollable tools dock on desktop; vertical canvas/dock on tablet/mobile, 16-theme tokens, actual native source/time/depth/variable in context.
- Both views use genuinely sourced payloads: the loader concurrently calls the pre-existing `api.field` and `api.volume`, or `api.currents` and `api.currentsVolume`. INCOIS native snapshot builds its existing physical field and genuine volume. Both are cancelled/cleared together on source, depth or native-time changes; never uses the geographic slice as synthetic water volume.
- Source availability preserved: surface chlorophyll and unsupported operational currents show an honest unavailable state without instantiating a scientific water volume. Planned blocks continue to use the renderer's own no-synthetic fallback.
- SmartDualViewNavigator now targets TWO actual IDs and switches camera/scroll selection; active label tracks manual scroll without restarting scientific data requests. Geographic in-scene switch and Water Section return provide direct navigation.
- Existing MPR-09/10 browser assertions are updated to the new intentional two-section behavior; new viewport and source-truth regression added.

## Strict boundaries
No edits to WaterColumn3D or OceanGlobe numerical/rendering code, main-block manifest, backend APIs, source science files, QC/provenance, units/positive-depth or native timestamps. Scientific time/depth agreement and stale-state observations remain explicit MPR-14 acceptance; MPR-13 owns populated water-side progressive controls.

Tests/release: exact-head TS/Vite, pytest, API/fallback, full hosted Playwright including authentic native observations, responsive 1440/1024/390/320; all 16-theme acceptance due at MPR-16. Stacked branch only, NOT public until MPR-17 validated Pages deployment.
