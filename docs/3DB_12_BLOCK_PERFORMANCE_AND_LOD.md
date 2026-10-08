# 3DB-12 — Block Performance & Level of Detail

## Workstream and scope
Chat 2 scientific-only performance phase; starting main `5965c48bd29da21bb2601fc910d372cc8dc3fcc2`. Dedicated branch `3db-12-block-performance-lod`. No changes to RUI-owned navigation, mobile sidebar, shared shell or visual system. In-flight PR #159 (comparison pilot empty state) and #160 (mobile sidebar) are independent.

## Root causes observed
- `api.ts` retained every historical pilot JSON Promise indefinitely across 35 blocks / 41 source frames; failed Promise rejections remained cached and blocked subsequent retries.
- Water Column's scalar canvas projected and sorted every native point for every camera redraw, despite visual pixel limits. Analysis, depth metadata, iso extraction and scientific exports require untouched complete source arrays.
- Cesium volume capped 5,000 cells using a flat global stride, giving an arbitrary and potentially depth-biased subset.

## Implemented contract
1. **Bounded source-frame cache**: four recent `block:date` Promise entries with recency updates. Duplicated in-flight fetches share a request; failure removes its own entry to permit retry. Manifest requests also recover after rejection. This is an in-memory loading optimization only, not a new scientific source or an integrity claim.
2. **Source-exact native-depth-balanced LOD**: `main-block-lod.ts` returns *indices into already accepted source tuples*, never new measurements, interpolated coordinates, synthetic depths or changed metadata. Every existing depth layer retains at least one source sample. Stable per-layer selection, deterministic repeatability and a selected-depth priority where supported.
3. **Cesium globe**: for materialized pilots only, discrete distance budgets of 1,200 (far), 2,600 (medium) and 5,000 (near) render instances replace the global flat stride. The existing scientific renderer acceptance gate executes on the complete original volume **before** display sampling. The immutable verified baseline keeps its existing rendering cap.
4. **Water Column**: for materialized scalar pilots only, visible canvas points are limited to 1,800 / 3,200 / 5,200 by camera zoom, retaining all samples at the selected genuine depth when capacity permits. The complete volume remains the source for the native depth axis, scientific hover tuple identities, metadata and isosurface derivation. The DOM exposes source-versus-rendered count for browser verification. Planned blocks remain geographic shells and cannot call the scientific LOD renderer.

## Scientific invariants
- No dataset, payload byte, manifest, SHA-256 digest, native coordinate, time, depth, thetao, so, uo, vo, source metadata or validated baseline was edited.
- This is **visual density** LOD, not scientific downsampling. Pixel coverage is not new observations, temporal density or spatial interpolation.
- Model-observation validation is not introduced for pilots. Planned 105 remain locked. Baseline and six actual multi-date pilots retain their declared coverage.
- Sampled globe cells preserve the existing native-centred rectangle appearance; reduced visual sampling may visibly thin the field at distance. No data is promoted as scientifically complete merely because it is rendered.

## Targeted verification
- TypeScript/Playwright: exact native source tuples at every depth, deterministic budgets, selected native focus layer retained, invalid-budget rejection, live native depth count and exposed renderer/sample totals.
- Python: independently hash every one of the 41 committed scientific payload files and verify 140 / 35 / 105 / 41 classification and locked planned states.
- Required before completion: frontend typecheck/build; full pytest; browser acceptance; exact-PR-head checks, merge, exact-main post-merge tests / final-mvp / Pages, public HTTPS and Chromium.

## Current status and handoff
This document records implementation scope and required evidence. A passing commit or open PR is **not** a deployment. Record exact PR, head, workflow runs, merge SHA and live status only after independent verification. Next phase after 3DB-12 production acceptance: **3DB-13 — Scientific Rendering Hardening**.
