# CERT-02 — full local React/FastAPI/Streamlit/static build gate

Owner: Stage A PR #204, branch `build/m008-m095-science-ui-train`. This document is an executable test plan, not a preemptive success certificate.

New `.github/workflows/cert02-local-api-build.yml` tests on an exact GitHub SHA and is restricted to the draft build branch with read-only contents permission. Requires full original Python tests, all backend/OGC tests, code compilation, hosted entrypoint import from real locally bundled NetCDF, Uvicorn real HTTP science routes (health/catalog/temperature/salinity/u-v/profiles/telemetry/anomalies/OGC WMS), immutable source 41-frame integrity, SHA verification of every original API JSON static export, actual Streamlit startup, npm ci/typecheck/build, Cesium NaturalEarth offline tiles and NetCDF WASM in dist, plus HTTP static fallback responses. No synthetic source or independent model-validation assertion. Real screen appearance is CERT-04, not this backend/build gate.

Legacy `final-mvp` separately fetches live INCOIS external products, so its upstream connectivity gate must not be silently represented as passed. Keep the existing frontend-only MPR release-scope CI restriction intact on this cumulative mixed-content draft.

Status at kickoff: original Python, dedicated development React build and preview, 41 original SHA source regression and 3DB13 Chromium were already passing at SHA 8d6ca466; original `final-mvp` API/static-hosted jobs queued; 108-theme Chromium failed because page selectors missing (CERT-04 separately).

**Do not call CERT-02 complete unless this dedicated job is green on the current candidate commit AND external required checks have their honest status recorded.**