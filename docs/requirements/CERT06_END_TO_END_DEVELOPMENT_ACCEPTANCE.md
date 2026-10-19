# CERT-06 — single-source integrated application acceptance

## Ownership and scope
Owned Stage A PR #204 only (Draft). No merging, GitHub Pages publication, PR #205/#207–#211 integration-branch changes, or weakening of production release policy.

## Required certification checks
1. Exact PR HEAD SHA checkout, compare with CI supplied SHA and report original commit. Do not certify GitHub synthetic pull-request merge refs.
2. Python root + backend/OGC scientific source integrity regressions, 41 original pilot source SHA-256 checks, immutable 140 logical/35 source-backed baseline and true original Jan 2024/Argo diagnostics. No IO-087 2024 source data fabricated.
3. Run genuine Uvicorn API over HTTP, validate health/catalog, native scalar field, u/v vector volume, provenance, profile counts and WMS genuine PNG, no invented vertical w.
4. Start genuine frozen Streamlit fallback, verify its HTTP health.
5. Export and verify real source-backed static science, then npm ci, React/Cesium TypeScript and production static science build; serve actual distribution over HTTP.
6. Run actual Chromium original-source integration: verified Jan 2024 baseline; switch to original IO-001 March and July 2004; exactly two timestamps, 31 native depths, same matched 3D geo/water states, thetao -> so -> horizontal-only currents, inspector and QC provenance controls; mobile/tablet real UI theme switching without altering scientific colour ramp; planned IO-003 blocks must withhold nonexistent volume.
7. Re-run CERT-05 security/performance/recovery browser regressions in the **same actual site build** to catch integration breakages; report GPU timing as unmeasured.
8. Emit per-job real evidence in downloadable GitHub Actions artifacts. Require both independent jobs and final combined exact-source ledger job green.
9. Separately require Stage A M095 Chromium 108 verified images run on the same HEAD before issuing final development CERT-06 completion certificate, but do not fabricate images or replace old successful artifacts with targets.
10. Real public GitHub Pages/CI on production `main` belongs to independent Integration Testing & Merge and is not represented as passed by CERT-06 development results. Upstream INCOIS/CCHDO availability remains a truthful external source gate.

## Exact-head CI failure triage (not waived)
At exact commit aa58873adcd6b55b18486e8d459edc34eacb9586, GitHub Actions CERT-06 run 39150208349 passed full original-source FastAPI, OGC and Streamlit job; combined Chromium completed **15 of 16** tests (retry of one failure). The sole failure was not a science or API mismatch: its final `Close scientific inspectors` background-button click was intercepted by the opened `.provenance-drawer` overlay, as documented in actual Playwright locator call logs.

The actual provenance overlay includes a visible, accessible button `Close provenance drawer` in `frontend/src/components/ProvenanceDrawer.tsx`. Correct the test to dismiss through that real user-facing button, assert that the drawer is removed, and confirm inspector `aria-expanded=false`. This does not force-click, bypass pointer interception, mock DOM state or relax scientific assertions. The obscured generic background button remains a UI ergonomics issue to address in the independently owned integration UI branch if needed; do not modify production CSS in this Stage A certification chat.

## Certification state
Created as implementation and gate definitions only. **Not certified until actual exact-head GitHub Actions succeed.**
