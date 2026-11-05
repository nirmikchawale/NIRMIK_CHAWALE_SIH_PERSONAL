# SEC-01 — Fail-closed release-conductor security reconciliation

**Status:** DRAFT — CURRENT-MAIN CERTIFICATION CANDIDATE; NOT MERGED OR DEPLOYED.

## Verified production parent
- Repository: `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`
- Certified X69 science base: `051f0fbd84fef4aaea2c95c85b16b758d660fabe`
- Subsequently certified UIX release: PR #252, merged commit `460192f7a48a7311134b929e16cbef18f8abac37`; postmerge 4/4 Chromium, public 4/4 Chromium and 110/110 live original scientific SHA-256 verified.
- Security review PR: #250, existing branch `security/sec01-exact-main-controller-20261105` now reconciled with new public production in one two-parent security-branch merge commit. Never replace or rewrite the certified `main`.
- Prior isolated controller candidate: `266f81de45e617b2a0ea1c1edb127c66a57e6e16` (two security commits from old X69 base); staged independently tested HTML-comment patch: `d80d8eb7f812b5b7af02c0f0a7a5cfc536783283`. Exact approved controller+test Git blobs are reused; the separate diagnostic-only workflow is NOT ported.

## Approved security scope — four paths only
1. `.github/scripts/release-conductor.cjs`: default-deny historic #202 pre-enrollment and red-main bypass; enforce standalone opt-in outside fenced Markdown or HTML comments, owner/same-repo, non-draft eligible branches, exact-current-main and exact-head premerge compare-and-swap; distinguish MPR-sensitive paths without waiving genuinely applicable tests or science failures.
2. `.github/workflows/release-conductor.yml`: limit `workflow_run` completion trigger to `main`, retain periodic polling, trusted checkout, no automatic repeat dispatch on missing prior checks.
3. `scripts/test_release_conductor.cjs`: 22 focused Node security and mock-GitHub checks, including negative fenced/HTML-comment opt-in cases, race guards, MPR routing and unrelated scientific failure blocking.
4. `docs/integration/SEC01_EXACT_MAIN_CONTROLLER_RECONCILIATION.md`: this current-main release evidence and category ledger.

No frontend/src, frontend/e2e, CSS, glass themes, evidence/data payloads, source-native timestamps/depths, 110 ocean originals, MPR verifier implementation or other workflow modifications.

## Verification and applicability — do not mislabel failures
- Controller security-only changes are **not UI/MPR scope**. The universal MPR job may genuinely FAIL its frontend-only scope assertion, with dependent jobs SKIPPED. It is NOT claimed to PASS, is not applicable to a controller-only change, and cannot be silently made mandatory/optional without an explicit category decision. Actual enforced GitHub-required checks and any triggered scientific/3DB checks still block if failing.
- Require on the **new exact security head**, not stale prior head: original `ocean-canvas-release-conductor-tests` Node syntax and full **22/22** tests; `tests` Python PASS; `final-mvp` original science + hosted build + React/Cesium and 4/4 genuine browser shard PASS (as release-category requirement); immutable original science compared to current-main baseline. Do not restart an entire suite for an isolated provider/network fault; preserve #220 circuit-breaker and real provider TLS verification.
- Independent assistant-led security diff review under owner project-wide solo policy #248; no third-party reviewer request, no fictitious approval. Retain branch/repository policy controls, and never use force-bypass or downgrade tests.
- This branch is `security/`, not controller-eligible `phase/` or `release/`; PR remains DRAFT and no standalone marker appears in the PR description.
- Do **NOT** merge or deploy on staging. The next release decision follows genuine exact-head applicable CI and a final main/head/file-scope check with `expected_head_sha` guard.
- After separately certified merge, postmerge `tests`, `final-mvp`, `deploy-oceantwin-pages`, original 110/110 live native science SHA-256 and 4/4 public Chromium MUST independently PASS to mark LIVE.

## Anti-loop and phase isolation
Preserve previously certified SEC-01-G PR #252 and X69 exact production science, all 16 glassmorphism themes, older held drafts (#234, #209, #217, #242, #243, #247) and other unrelated work. Correct only a demonstrated failure fingerprint; no blind test reruns or speculative certification loop.

## Gate ledger
- Focused historical HTML-comment fix: run #41958242231, genuine PASS on staged diagnostic SHA; 22 Node tests.
- Security-branch current-main reconciliation: PENDING exact-head CI.
- Release integration: HOLD until all applicable exact-head gates PASS.
- Postmerge/public certification: NOT STARTED for this security candidate.
