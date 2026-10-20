# UIX-04B — Genuine Evidence-Download Integrity (BUILD AHEAD)

**State:** TESTS AUTHORED, awaiting actual zero-retry Chromium evidence. Not certified, not merged and not deployed.

## Why this is independent
Ocean Canvas UIX-03 PR #230 is already under an exact-commit release gate. UIX-04A navigation/focus branch is frozen at 72fd2dfae01048b104e66ca7773eff7655512aa2 after 6/6 authentic Chromium PASS, zero retries. UIX-04B adds **no application source changes** and is independent of both code paths. It covers downloaded bytes and truthful scientific provenance, not UIX-03 controls, hover, layout or UIX-04A keyboard/focus.

- Branch: build/uix04b-evidence-export-integrity-20261021
- Development base: main 6abb29a1557b8e7a062df53f3a1bb6d4148fc106
- Owner scope: this document; frontend/e2e/uix04b-evidence-export-integrity.spec.ts; .github/workflows/uix04b-focused-exports.yml
- Forbidden edits: frontend/src/App.tsx, frontend/src/components/AppNavigation.tsx, all pages, GLORYS/Argo/INCOIS/CCHDO data, API/QC/science, CSS, themes, Stage A PR #204, ITM PR #211, and release PR #230.

## Four genuine Chromium contracts
1. **Telemetry** (1440px): click genuine Salinity selection; capture downloaded CSV, verify filename/current variable, 12 fields, 31 unique model depth indices and one actual scientific time.
2. **Model vs Observation** (1440px): capture original JSON bytes, require profile matched levels, legitimate provider DOIs/provenance and explicit diagnostic-not-independent-validation boundary.
3. **Anomaly Screening** (390px): capture JSON and independently parse authentic method, variable, provenance, statistical-flag limitation and locked single-time temporal capability.
4. **Data Lab** (390px): ensure export disabled before validation; locally upload a clearly labeled **user fixture**, validate then download JSON, compare the actual 2 original rows and source metadata byte-level semantics. The fixture is NOT scientific/provider verification.

Use the official source-backed local production export pipeline from existing final-mvp/MPR CI. Playwright capture is page.waitForEvent("download") and readFile(download.path()); no mocked downloads, no stub APIs and no manufactured screenshots. Test only this new spec with workers=1, retries=0; a failure means an actual focused diagnosis, not an automatic four-shard or 96-PNG rerun.

## Status and dependencies
- Focused verification: PENDING until genuine run complete on this exact SHA.
- Integration / release: NOT APPROVED; do not create release-enrolled PR, merge, deploy, modify main or imply public certification.
- Build ahead is permitted; later integration must rebase/reconcile against **then-current verified main** and pass authentic release-scoped tests, science, 4/4 Chromium and PNG evidence as applicable.
- Project permanent two-lane/anti-loop/mandatory every-chat handoff rule: GitHub issue #220.
- Frozen UIX-04A record: issue #231.

## Mandatory next handoff
Include development head SHA, four-case exact result, any first factual defect and targeted correction or passive pending job; UIX-03 release artifact/hash/merge state; UIX-04A frozen 6/6, any owner action, and objectively best next independent phase. Do not confuse authored with PASS.
