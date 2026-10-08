# RUI-MPR-14 — Unified linked-view evidence integrity gate

**Parent:** PR #186 MPR-13, branch `rui/mpr-14-linked-view-integrity-gate`, original baseline production `43265375ef1c28ab6e94a48e6162f928b1aeb367`.

## Core defect fixed

MPR-12 mounted genuine geographic and water-column engines simultaneously, but switching the active 3DB main block did not re-trigger the App field/volume load, and a source/time/depth switch could briefly show a prior response under the new label. MPR-14 fixes that without editing 3DB algorithms or scientific files.

## Implementation

- `linked-view-integrity.ts` owns pure, testable read-only checks: selected source dataset ID, main block ID/revision, variable, native time/index, geographic depth index/metres, positive-down water geometry, and actual nonempty payload. No interpolation or fabricated source values.
- Two independent accepted-selection keys gate each rendering surface; incompatible late responses are withheld. The existing cancellation cleanup remains in place.
- Main-block changes re-run the existing source-backed loader using `mainBlockRevision` and invalidate the previous accepted keys, even if mode/time are otherwise unchanged. Model data still come from the original GLORYS/INCOIS API.
- The Geographic Cesium renderer retains the real coastline/controls but receives no stale field/volume/current props while unverified, planned or mismatched. The WaterColumn3D component is not mounted for unmatched/planned/unavailable evidence.
- Semantic status messages and scoped source/block/time/variable data attributes make the current loading/mismatch/planned limitation inspectable and accessible.
- Dedicated predicate regressions verify provenance/time/depth and block-invalidation failures. Responsive Chromium checks verify both sections agree.

## Boundary and release gates
**No** source schema, backend/API, model data, Argo QC, native timestamp, scientific renderer algorithm, main-block registry, provenance or dataset file changes. MPR-15 owns inspectors and responsive accessibility, MPR-16 owns all-theme screenshots, MPR-17 owns full regression and live Pages deployment. This branch is NOT live until merged after passing exact-head CI and all downstream release gates.

Any inability to establish a real source match is a deliberate failed-closed UI condition, not a claim that a new measurement was made. Revalidate GLORYS baseline, INCOIS multi-time, chlorophyll surface-only and pilot materialization in actual Chromium before MPR-17.
