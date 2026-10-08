# RUI-MPR-07 — Active Main Block Disclosure

**Parent:** MPR-06 PR #175. **Branch:** rui/mpr-07-active-main-block-disclosure.

A full-width expandable Active Main Block strip now appears after the existing three scientific source cards and before Field overview, Compare observations, and Open Data Lab. It subscribes to the exact shared scientific-context runtime already consumed by ScientificContextHeader and never establishes a competing source of truth.

When expanded it shows genuine block ID, materialization state, region, source, variable, native timestamp or honest unavailable state, depth/surface semantics, selected profile, time kind and context origin. The existing materialized block selector and stepper API is reused without changing block data or navigation semantics. It can copy the real context deep link; planned blocks remain explicitly geography-only. The globally available ScientificContextHeader, Sources & QC, EvidenceRail, provenance and all six routes are retained. The MPR-08 evidence-hub move is NOT done here.

Presentation uses semantic MPR-01 tokens across all sixteen dark/light glass themes. Native details disclosure is keyboard accessible; responsive 1440/1024/390/320 tests cover expanded geometry and shared-context synchronization, with forced-colours and reduced-motion support.

**No scientific changes:** no model arrays, native depth/time values, source availability logic, blocks/manifest entries, observation matching, QC, provenance, API, Cesium/3D rendering or backend modifications.

**Release gates:** exact-head frontend typecheck/build; MPR-06 and MPR-07 targeted browser tests; full final-mvp, Python and fallback checks; all 16-theme regression; no horizontal overflow. PR must remain stacked until MPR-03 #172, MPR-04 #173, MPR-05 #174 and MPR-06 #175 have individually passed CI and live deployment. After each parent merge, retarget/reconcile and validate. Do not claim live until exact-main GitHub Pages build, deploy and public Chromium verification pass.

**Next:** MPR-08 dedicated Ocean Intelligence evidence/QC hub; no premature duplicate.
