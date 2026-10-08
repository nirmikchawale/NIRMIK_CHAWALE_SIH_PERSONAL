# RUI-MPR-13 — Native Water Column 3D controls

**Parent:** PR #185 MPR-12. Branch: rui/mpr-13-water-column-scientific-controls. The same two actual source-backed renderer instances remain mounted.

## Delivered
WaterColumnControlDock replaces the MPR12 read-only water evidence panel with six accessible native `details` groups, bound to exactly the same React state/handlers driving the original ControlPanel, ScientificColorbarHud and WaterColumn3D renderer:

1. Variable selection and exact source-native depth level index (positive down), with native-depth absence honestly disabled.
2. Original source-native timestamp selection and real verified Argo comparison profiles (no invented dates, cycles, or matches).
3. Water-column point opacity and cosmetic vertical exaggeration (native depth and physics stay intact).
4. Shared thermal/viridis/icefire palettes, linear/log eligibility and bounded display minimum/maximum.
5. Native scalar isosurface toggle/value or genuine horizontal u/v currents disclosure (no vertical current inferred).
6. Actual renderer-owned zoom/camera controls, canonical Sources & QC provenance drawer, and geographic return. No copied fake camera code or second scientific store.

The renderer, source selection and scientific data remain owned by existing OceanGlobe, WaterColumn3D, FastAPI/source snapshots and canonical App state. Native coordinates and metadata visible in the dock are from the active catalog; two 3D sections are not illustrative clones. UI is 16-theme token-driven with forced colours, native keyboard and reduced-motion support; responsive at 1440, 1024, 390, 320.

**Boundary:** MPR14 final linked-view science/UI validation remains necessary (particularly avoiding stale block/time/variable/geometry during async source changes). MPR15 inspectors/responsive and MPR16 full theme image matrix, MPR17 production deployment still pending. No backend, manifest, comparison math, QC, units, timestamps, model coordinates or renderer numeric algorithms are changed here.

## Tests / release
Exact PR head TypeScript+Vite build, science/API, pytest, static-hosted-failsafe complete Chromium, phase 12/13 browser tests, 16 themes, no horizontal overflow and real 3D interactions. Stacked child of #185; do not merge to production until prerequisite checks/reconciliation and final MPR17 safe sequential release. Never claim public URL changed for unmerged PR.
