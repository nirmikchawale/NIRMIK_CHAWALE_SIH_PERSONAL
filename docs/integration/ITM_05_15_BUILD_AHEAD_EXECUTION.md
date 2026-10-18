# Ocean Canvas · ITM-05 through ITM-15 BUILD-AHEAD execution and certification queue

**Updated user authorization (18 Oct 2026):** Prepare and implement coding ahead through ITM-15, but retain strict sequential **certification, approval, merging and production deployment**. This is a later, narrower exception to the strict phase-lock protocol: **the lock now controls release progression, not isolated development.**

**Scope:** A draft, non-deploying branch `integration/itm05-15-build-queue-20261018`, stacked on ITM-03 PR #210. The build branch may compile, test, audit and prepare future certification scripts; it must not merge or deploy any phase, change Stage A PR #204, or auto-enroll PR #202.

**GitHub history observed:** production main `75880aa1714b68d92fbd2a652a10ed1d8a85c0d8`; ITM-03 #210 `9541eb3a91595ee9cfc62cb7770922925761971e`; ancestor scientific recovery #208 `6e9c1c588e6016fdc362c91a87c8de9fc0cd29de`. **Re-fetch current SHA before any certification**, these are historical observed facts.

## Architecture — development pipeline versus release pipeline

```text
DRAFT / BUILD AHEAD (no production permission)
#210 ITM-03 source+browser fixes
   |
   +--> #211 ITM-05 Argo 5907092 genuine QC-backed default
           |-- ITM-06 inherit authentic CCHDO/INCOIS recovery (#208)
           |-- ITM-07 read-only GitHub collision audit
           |-- ITM-08 single composite integration candidate
           |-- ITM-09 exact-head readiness checks
           |-- ITM-10 controlled merge preconditions only
           |-- ITM-11 exact-main Pages + 4 real public Chromium shard audit
           |-- ITM-12 independent repeat / rollback-baseline audit
           |-- ITM-13 immutable Stage A handoff contract
           |-- ITM-14 separately approved Stage B integration contract
           +-- ITM-15 final exact-main scientific + browser evidence contract

RELEASE / CERTIFY IN ORDER (locked, separate from development)
ITM-02 -> ITM-03 -> ITM-04 -> ITM-05 -> ITM-06 -> ITM-07
       -> ITM-08 -> ITM-09 -> [HUMAN RELEASE APPROVAL] -> ITM-10
       -> ITM-11 -> ITM-12 -> [STAGE_A_CERTIFIED] -> ITM-13
       -> [SEPARATE STAGE B APPROVAL] -> ITM-14 -> ITM-15
```

## Exact deliverable matrix

| Phase | Implemented in draft development code | Mandatory future work / release queue |
|---|---|---|
| ITM-05 | `frontend/src/App.tsx`: source-verified baseline Argo 5907092 C13 default when eligible, explicit valid profile/C12 override, no pilot pseudo-match, old degraded health cleared only after real recovery. `OceanGlobe.tsx`: baseline HUD distinguishes model 31 depths from QC-observed 50 levels. `frontend/e2e/mpr-default-verified-argo-5907092.spec.ts`: four real-browser scenarios and corrected `OCEANTWIN_LIVE_URL` discovery. | Actual local built static science + Chromium, screenshot evidence, all responsive layouts, exact-head React and source/QC; release only after ITM-04 certificate. |
| ITM-06 | Authentic source recovery already staged in **ancestor PR #208** (`scripts/fetch_verified_observation_breadth.py`, immutable QC regression and audit). No independent modifications to science values; real 2016 CCHDO source fallback remains source-backed. | Independently verify exact-composite latest SHA native-source QC, API/static, real INCOIS endpoints, provenance and non-synthetic claims. |
| ITM-07 | `scripts/itm_phase_queue.py snapshot`: read-only GitHub SHA/CI/files collision inventory for #200/#204/#205/#208/#209/#210; reports Stage A overlaps. | Reconcile ALL historical PR semantics; no bulk merge of old App/OceanGlobe or the Stage A ancestor #202. |
| ITM-08 | Stacked draft #211 is a concrete source-composite worktree: #208 genuine science → #210 browser fixes → #211 Argo and release instrumentation. | Confirm exact composite typecheck/Browser/scope; #209 security code is a separate independent draft and **not yet in composite**. |
| ITM-09 | `scripts/itm_phase_queue.py`: required CI + SHA preflight, strict fail-closed evidence contract; dedicated workflow tests it. | Collect real latest SHA all source/build/browser gates; independently reconcile Stage A collision and project deployment provenance. |
| ITM-10 | Exact check inventory, prerequisites, `RELEASE_APPROVED` required; *no merge implementation exists intentionally*. | Separately authorized human-reviewed production merge, main compare-and-swap check and rollback SHA. |
| ITM-11 | `scripts/itm_production_evidence.py`: exact-main Pages build/deploy and four distinct public Chromium `verify-public (1..4)` results; same-main full final-mvp including four static browser shards. | Run after approved publication; HTTP 200 and release-conductor no-op are insufficient. |
| ITM-12 | Same production audit requires 2 independently successful exact-main runs + a verified 40-char rollback SHA; nine unit regressions. | Perform actual second live acceptance and documented rollback rehearsal; never change prod automatically. |
| ITM-13 | Manifest requires `STAGE_A_CERTIFIED`, immutable Stage A PR #204, no source/write collision, exact SHA handoff. | Actual Stage A 108 genuine Chromium evidence and other science gates under Chat A; **do not access its branch for writes**. |
| ITM-14 | Manifest requires separate `STAGE_B_APPROVED`, composite scientific/rendering CI, explicit release record. | Cannot implement actual Stage B source integration until approved Stage A exact SHA and owner handoff; no automatic promotion. |
| ITM-15 | Manifest requires final main SHA CI, Pages artifact, public Chromium and scientific evidence, separate final approval; evidence verifier never fabricates certificate. | Execute after ITM-14 authorized release; issue final independent audit with public artifact SHA. |

**Implementation ≠ certification.** On this development branch: ITM-05 code and ITM-07 audit and ITM-08–15 *harnesses* are prepared, NOT all phases certified or fully integrated on production. ITM-10, 13, 14 and 15 have external gates that cannot be coded away.

## How to execute the prepared local, isolated checks

```bash
python scripts/itm_phase_queue.py validate
python -m pytest -q tests/test_itm_phase_queue.py tests/test_itm_production_evidence.py
python scripts/itm_phase_queue.py plan --output itm-build-ahead-plan.json

# GitHub API snapshot only; no mutations, requires read-only GitHub token.
GITHUB_TOKEN=... python scripts/itm_phase_queue.py snapshot --output itm-collision-snapshot.json

# Real main HTTP/CI evidence report; explicitly NOT a release certificate.
GITHUB_TOKEN=... python scripts/itm_production_evidence.py --report-only --output itm-public-evidence-report.json

cd frontend
npm ci && npm run typecheck && npm run build
unset OCEANTWIN_LIVE_URL
npm run e2e:live -- --list
```

**Dedicated CI workflow:** `.github/workflows/itm-build-queue-development.yml` runs queue/security tests, Argo typecheck/build and Playwright discovery, readonly GitHub collision snapshot and production readout, then an explicit **no-release** completion job. Existing full source/API/MPR/Playwright runners remain authoritative for actual release certification.

## Important non-applicable MPR-only UI scope gate

This **development** draft includes `scripts/itm_phase_queue.py`, `scripts/itm_production_evidence.py`, `tests/test_itm_*.py`, a build workflow and `docs/integration` manifests. The older MPR release scope auditor only allows MPR UI and a narrowly reviewed scientific-recovery exception, so its frontend-only gate may fail **correctly** on this mixed tooling candidate. **Do not weaken the MPR scope auditor or whitelist arbitrary tools simply to turn that job green.** For an eventual approved release, split or selectively forward-port the safe feature and integration scripts into properly reviewed source-specific candidates and rerun all required exact-SHA gates.

## Commit and state semantics

- An exact-head passing development workflow proves only that **those tools and frontend can build**. It is neither the 96-image browser acceptance nor production Pages/public Chromium.
- All new source/API/Argo comparisons must use original scientific data and provenance. Do not invent GLORYS timesteps, INCOIS frames, CCHDO CTD, Argo QC or water-column depths.
- The release conductor in PR #209 remains independently drafted, with 20/20 proven safety unit tests, and has **not** been merged into this branch.
- Keep automatic production merge/deploy disabled; authorization tokens must come from explicit reviewed user decisions, never a self-authored script.
- Continue release queue in strict phase order after implementation prep, and retain each exact-head check run and approval in GitHub PR comments + integration ledger.
