# Ocean Canvas — Permanent Chromium / Pages / 96-image Isolation Runbook

**Status:** PERMANENT operating rule for every phase of Ocean Canvas.  
**Authoritative standing instruction:** [project-wide issue #220](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/issues/220).  
**Release gate:** Fail-closed MPR science/scope checks and separate human release approval remain binding.

## Non-negotiable protocol

1. Before doing anything, inspect the latest GitHub *main*, candidate branch/PR SHA, CI job state, previous attempts, Pages deploy SHA and evidence artifacts. Do not redo completed PASS tests or recopy a verified build.
2. Prioritize diagnosing Chromium **shards 1–3**. Shard 4 has frequently passed and is not the right place to spend repeated cycles. No shard is exempt from a final **new exact-commit release gate** when explicitly required.
3. Extract the first failing test *fingerprint*: workflow/job/attempt/SHA, spec path, exact title, viewport, action, locator and stack/error context. Search previous failure fingerprints and fixes before changing a selector.
4. Classify failure: application functional/UX, stale Playwright test contract, CSS visibility/scroll container, startup/orientation timing, scientific data/source, GitHub Actions artifact or runner, screenshot collector, Pages publication, or release authorization.
5. Hypothesize and correct **one proven underlying defect at a time**. Never fix test failures by hiding skipped/failed tests, reverting the correct Arctic Mist default, restoring a purposely removed mobile tray, fabricating ocean values, or bypassing scientific or release safeguards.
6. Test **only the broken test case(s)** in Chromium at the corresponding viewport on the exact corrected runtime; one worker, zero retries. Use existing verified science data. Confirm proper selection with Playwright --list before running. If no matches, fix *test selection*; do not start the entire matrix. Example:

       cd frontend
       OCEANTWIN_LIVE_URL=http://127.0.0.1:4174 npx playwright test \
         -c playwright.live.config.ts e2e/mpr-10-geographic-section.spec.ts \
         --grep 'MPR-10 real Cesium geographic scene reflows with one original control panel at 390' \
         --workers=1 --retries=0

7. **Circuit breaker:** after the same fingerprint occurs twice, STOP and change the hypothesis or escalate as BLOCKED. Repeatedly reading logs of an unfinished job or running full CI without new source correction violates this rule.
8. For next level, run ONLY impacted neighbouring tests. Record exact case title, viewport, candidate SHA, Playwright result, source blob identity, log/artifact URL. Reuse verified passing evidence when sources have not changed.
9. Complete the larger four-shard real Chromium suite, 96 actual image certification and public Pages checks **only as required at the final integration/release point**, after focused PASS. Do not merge, deploy, or issue any exact-commit certificate until all mandatory results are real PASS and separately authorized.

## Problem registry — priority

| Priority | Verified failure fingerprint | Source of truth | Correct diagnostic approach |
|---|---|---|---|
| P0 shard 1 | 58 PASS / 5 FAIL / 2 FLAKY on UIX-01 d2c444fd: old Water Column shell, old dark default, Cesium refresh IDLE, hidden HUD, old viewer entry, initial control click | final-mvp 39320367264, job 118292982790 | Change only stale assertion or wrong user route; test real 3DB/journey individually, do not change science; source scope approval needed for protected tests |
| P0 shard 2 | Job in progress; no grounded failure title yet | job 118292982759 | Wait for genuine result, then inspect only new fingerprints |
| P0 shard 3 | 54 PASS / 8 FAIL: retired mobile tray, scroll-owner assertions, mobile close-control visibility | final-mvp 39320367264, job 118292982904 | Use Block Details > Block & Region, scroll the actual shell, preserve the source-owned ControlPanel close button; see PASS evidence below |
| P1 shard 4 | 64/64 actual PASS at d2c444fd | job 118292982796 | Keep as regression evidence, do not rerun to debug shards 1–3 |
| P0 MPR 96 PNG | 16 themes x 3 viewports x 2 actual views; empty/missing PNGs are blocked | MPR16 spec / MPR certification 39320367252 | Count actual unique attached PNG bytes, inspect images and provenance; re-render only defective theme/viewport/view during diagnosis |
| P1 publication | GitHub Pages build/deploy can succeed while live Playwright fails | deploy-oceantwin-pages 39128416408 | Distinguish deployed SHA, URL/assets, backend/static science, and four public Chromium results |
| P1 browser logs | BlobNotFound on active job or ERR_BLOCKED_BY_ADMINISTRATOR in local preview | active job log endpoint or separate local security environment | Do not equate these with real app failures or keep retrying blocked log downloads |
| P1 "No tests found" | Wrong spec filenames in scoped diagnostic workflow | MPR10/11 isolated 39327667177 | Verify Playwright --list and file args before rerunning; zero browser cases ran |

**Important:** Ocean Canvas's web runtime is **React + Cesium + Vite**, NOT Next.js. "Pages" means GitHub Pages; 96 images means real Playwright visual artifacts. Do not investigate a hypothetical Next.js build without independent evidence.

## Verified reusable narrowly scoped results (not substitutes for whole-release certification)

- UIX-01 scroll ownership / Presentation: **3/3 genuine Chromium PASS** — run [39319973740](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39319973740).
- MPR-17 real mobile ControlPanel close: **2/2 PASS** (320, 390 px) — [39326328609](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39326328609).
- MPR-10/11 real mobile control entry: **4/4 PASS** (320, 390 px) — [39327956732](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39327956732).
- Corrected legacy journey + unique live 3D overlay locator: **2/2 PASS** — [39326535564](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39326535564).
- Earth→India→ocean genuine cold-refresh after Cesium readiness: **1/1 PASS** — [39327868303](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39327868303).
- 3DB planned ocean field and Arctic Mist default focused checks also passed in the previous diagnostic run. Do not replace the source-backed stacked view with a synthetic legacy renderer.

## 96 screenshot evidence checklist

- Matrix: theme IDs from GLASS_THEMES (16) × wide desktop 1440×900, tablet 768×900, mobile 390×844 × Geographic+WaterColumn views.
- Each row must have an attached PNG with unique viewport+theme+view name and nonzero image bytes, captured by true browser page.screenshot after navigating to its corresponding real 3D section.
- Validate actual artifacts and image count from the completed run. Do **not** infer 96 images from workflow title, 3/3 visual tests, or a successful build alone.
- If a single theme/viewport fails, isolate that renderer view. Preserve all other valid screenshots for diagnosis; do not run the full matrix repeatedly.
- The MPR browser job and the full final-mvp shards are separate release gates. None may be waived because another passed.

## Release governance / continuation

- Scope auditor: scripts/verify_mpr_release_scope.py. It permits specifically named files plus MPR test/CSS and RUI_MPR docs; forbids backend/API/data changes and *nonallowlisted* 3DB/journey files. Protected changes require an explicit separate scope decision; never silently expand allowlist.
- Release process: diagnose → targeted Chromium PASS → compose smallest candidate → review allowed scope and science → final exact-SHA four shards and real 96-image evidence → issue premerge certificate → request **separate human approval** → merge → publish GitHub Pages → verify live four browser shards/public data.
- Keep statuses separate: coded, targeted tested, integrated, exact-commit certified, human approved, merged, deployed and public-verified.
- If no proof, say **BLOCKED with the exact reason**, not "done."
- Future agents: read issue #220 and this runbook before planning *any* browser rerun. Maintain a durable PR/issue failure ledger, and pick the *first incomplete step*, never a fresh full-suite loop.

## 20 October update — proven screenshot evidence-packaging defect and exact correction

The completed old MPR run 39320367252 failed (52 real browser cases PASS / six FAIL); its uploaded artifact 12222679929 was downloaded and ZIP-inspected. **The archive contained zero PNG files**: 13 error-context .md files and one preview .log. Thus previous matrix test passes did not certify actual screenshot deliverables.

We isolated ONLY ONE genuine Chromium screenshot using diagnostic run 39329940482. The real 1440px Geographic screenshot yielded a **437,746-byte PNG** with the correct PNG signature. The downloaded diagnostic ZIP (artifact 12223537564) contains the same real image in three locations: explicit test output, test attachment and HTML report. The Playwright test **passed 1/1**; the GitHub Actions job was marked FAILURE only because a *post-test shell glob* assumed the wrong Playwright output-directory name. The ZIP independently proves screenshot preservation, so **do not rerun this diagnostic**.

**Permanent image-gate remediation staged:** the MPR-16 spec now writes every genuine image explicitly via page.screenshot(path=info.outputPath(...)) and attaches that path. The MPR release workflow uses an HTML reporter and validates **96 unique actual nonempty PNG files**, checks each 8-byte PNG signature, viewport/view/theme combination and SHA-256 manifest. Retry duplicates are logged but cannot substitute for missing unique images. If insufficient files, CI fails closed and uploads its manifest. This change is staged on the protected-scope-approved integration branch, **not on main**, and has not generated the 96 screenshots again. Execute the final whole image matrix only after the other isolated blockers pass and an exact release candidate is ready.

The final-mvp 39320367264 results have all concluded: shard 1 **58 PASS, 5 FAIL, 2 FLAKY**; shard 2 **56 PASS, 9 FAIL**; shard 3 **54 PASS, 8 FAIL**; shard 4 **64/64 PASS**. Shard-2 errors are predominantly legacy mobile block HUD and obsolete Water Column shell expectations, plus MPR10/11 mobile tray tests already isolated. Do not launch this matrix anew to diagnose those errors.
