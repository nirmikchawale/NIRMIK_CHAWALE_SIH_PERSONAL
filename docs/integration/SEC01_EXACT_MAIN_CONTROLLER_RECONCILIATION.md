# SEC-01 — Exact-main fail-closed release-controller security reconciliation

**Status: DRAFT / SECURITY REVIEW CANDIDATE — NOT MERGED OR DEPLOYED**

## Exact-source checkpoint
- Repository: `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`
- Certified X69 production parent: `051f0fbd84fef4aaea2c95c85b16b758d660fabe`, PR #246. X69 postmerge Pages and 4/4 public Chromium passed at this parent; do not repeat X69's 110-source hashes as a diagnostic loop.
- Candidate branch: `security/sec01-exact-main-controller-20261105`, one commit to be made with exactly four paths, never a rewrite of old draft PR #234.
- Historical source patch: draft PR #234 head `594f296a9c8c3b9de85278d2e33436db0b7dc79d`. Three code/workflow/test blobs are copied unchanged from its audited four-file candidate; only this documentation is regenerated against current production.

## Confirmed main-controller risks
1. `seededPRs: [202]` and `recoveryPRs: [202]` implicitly enroll an old recovery PR and excuse a red public main.
2. `isEnrolled()` accepts an approval marker anywhere in PR body prose, including incidental descriptions.
3. Controller does not recheck both the exact current main and PR head/base/draft just before calling GitHub merge.
4. Any branch's PR CI workflow completion wakes a controller poll; keep trusted default-main-only workflow_run triggering and the existing 15-minute scheduled fallback.

## Exactly four allowed paths
1. `.github/scripts/release-conductor.cjs`: default-deny historic PRs, exact standalone explicit marker, no red-main exception, required MPR for actual affected UI/E2E/scope paths, hard block for triggered 3DB/science failure, final main/PR SHA race guard.
2. `.github/workflows/release-conductor.yml`: scope `workflow_run.branches` to `main`.
3. `scripts/test_release_conductor.cjs`: 20 focused Node security and mock-GitHub integration tests with syntax checks.
4. `docs/integration/SEC01_EXACT_MAIN_CONTROLLER_RECONCILIATION.md`: this auditable release-gate ledger.

No scientific source measurements, frozen GLORYS/Argo baselines, model/observation metadata, 110 frame bytes, browser UI, CSS, 16 glass themes, or other workflow source changes.

## Verification and safety gates
- This is a `security/` branch, not auto-enrollable by the controller's `phase/` or `release/` gate; PR stays DRAFT with no standalone `OC-AUTO-RELEASE: approved` opt-in directive.
- Trigger `ocean-canvas-release-conductor-tests` through this PR once and require real Node syntax + all tests genuine PASS on the exact candidate SHA. Also confirm normal Python/science/React/full browser CI as required by a reviewer-approved security-controller-only release category; do not count old-head runs as the new certificate.
- The generic MPR scope workflow intentionally fails for controller-only paths. Report that genuine status as failure with dependent jobs skipped, not a PASS; validate category applicability independently. Never waive any GitHub-enforced required status, alter an MPR scope allowlist, or bypass an actual scientific/UI failure.
- Resolve and independently document release scope and any code-review/branch-policy requirements before a guarded exact-head merge. Issue #248 standing owner authorization applies only after every applicable gate passes; issue #220 prohibits repetitive CI/Chromium/96-PNG loops.
- After any future authorized merge, independently verify the new `main` and postmerge tests/Pages/public browser; do not claim LIVE before success. Preserve original draft PRs #234, #209 and #217 for reference without merging them.

## Handoff
**First incomplete gate:** new draft PR exact-main CI + security-only gate classification. No merge/deploy in this staging step.
