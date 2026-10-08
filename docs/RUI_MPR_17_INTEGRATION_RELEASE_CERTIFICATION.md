# RUI-MPR-17 — Integration, release certification and production handoff

**Branch:** `rui/mpr-17-integration-certification-gates` stacked directly on MPR-16 PR #189.  
**Original deployed baseline:** `43265375ef1c28ab6e94a48e6162f928b1aeb367` (`main` when this phase began).  
**Release scope:** all eight phases MPR-10, 11, 12, 13, 14, 15, 16 and 17; production MPR-03–09 must not regress.  
**Current authorization:** implement the release integration and certification instruments. Final approval/certification, independent live-browser test, and actual Pages publication are **separate gates**.

## Implemented in MPR-17

1. **Scope and ancestry certification** — `scripts/verify_mpr_release_scope.py` compares the candidate to the latest fetched `main`, emits SHA-pinned JSON, rejects backend/3DB numerical renderer/source/api/dataset/manifest edits and requires all eight phase documentation ledgers. It fails closed on any unexpected file.
2. **Scientific regression** — `.github/workflows/mpr-release-certification.yml` runs the original frozen scientific, FastAPI, Python compile and source integrity checks, without changing scientific algorithms.
3. **Exact candidate production frontend** — the workflow regenerates original static GLORYS, INCOIS physical multi-time, INCOIS chlorophyll, verified Glider/CTD/BGC, OPeNDAP and NetCDF sample evidence, then builds with `VITE_STATIC_SCIENCE=true` and real Cesium Natural Earth assets.
4. **Browser release acceptance** — original MPR-10–15 Playwright suites plus MPR-16 screenshot/theme matrix and MPR-17 integrated six-width tests. Includes 320, 390, 768, 1024, 1366 and 1440 px; keyboard Escape, focus/presentation and QC, both geographic/water renderers, genuine source/block/native timestamp/variable identity, and surface-only chlorophyll protection.
5. **Artifacts** — the workflow archives its source-diff JSON, browser traces/reports, acceptance JSON and 96 genuine theme/renderer screenshots as GitHub Actions artifacts. Review these images for layout, contrast, camera tools, source selection, overflow, tool labels, missing scenes and chart anomalies before any final certification.
6. **No false deployment** — the workflow never calls the merge API or deploy-pages action. Its green status means a **candidate** passed these checks, not that a GitHub Pages public URL changed.

## Required outstanding release sequence

- [ ] Get full **exact-head** CI green for upstream stacked PRs #183–#189 and MPR-17 (React/Cesium, pytest, science fallback, full hosted Chromium), repair actual failures without bypassing them.
- [ ] Check concurrent 3DB owner PR #181 and any other newer scientific PR against latest `main`; reconcile shared files without replacing 3DB algorithms, valid evidence, source coordinate/time definitions or renderer correctness. A main SHA change invalidates stale readiness claims.
- [ ] Run `mpr-10-17-release-certification` to **success** on the exact fully reconciled release candidate. Verify screenshot artifact count and inspect the real screenshots across all sixteen themes (not Arctic-only); write an acceptance ledger with passed/failed notes.
- [ ] Run remaining science, security/accessibility, native time/depth, QC, cross-source and 3DB certification checks, ensuring no unresolved blocked or unavailable data are described as verified.
- [ ] Complete human/browser acceptance on full desktop/tablet/mobile, keyboard/pointer/touch, reduced-motion and forced colours and all routing/workspace pages. Verify the complete 3D scene state remains responsive and no prior MPR-03–09 feature regresses.
- [ ] Merge stacked PRs in safe order into `main` **only after gates green**, or use one fully gated consolidated integration PR to avoid re-running seven redundant deployments; retain all branch and PR ledgers.
- [ ] Confirm merged `main` exact SHA, build, `final-mvp`, required 3DB scientific workflows and `deploy-oceantwin-pages` final deploy succeeded on that SHA.
- [ ] Independently launch Chromium **against the public HTTPS URL**, not just localhost, and verify all eight phases, 16 persisted themes, 3D renderers, source availability, native variables/time/depth and scientific QC. Attach screenshots and link final GitHub run.
- [ ] Only then claim **MERGED → DEPLOYED → LIVE & VERIFIED**. If a gate cannot be performed, report `BLOCKED` or `PARTIAL` with exact SHA, failed step and recovery instructions.

## Non-negotiable science and presentation invariants

No synthetic scientific timestamps, subsurface chlorophyll, extra Argo comparison profiles, uncertified model cells, invented native depth levels, fabricated vertical current component, fake validated blocks, overwritten source/QC/provenance claims, hardcoded single theme or hidden broken browser tests. User-selected glass appearance is independent of scientific palette. The UI may hide a mismatched real payload and show honest status but must never relabel old data as the new block/source/time.

## Recovery checkpoint

Pull requests: MPR-10 #183; MPR-11 #184; MPR-12 #185; MPR-13 #186; MPR-14 #187; MPR-15 #188; MPR-16 #189; MPR-17 to be recorded once created.  
Branches form a stacked chain, ending with `rui/mpr-17-integration-certification-gates`.  
Resume by reading `main`, all PRs, current heads, checks, first incomplete certification gate; avoid repeating green prior phases.  
**Do not certify or deploy merely because source changes have been committed.**
