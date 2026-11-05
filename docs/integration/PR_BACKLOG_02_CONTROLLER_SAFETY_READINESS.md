# PR-BACKLOG-02 — Fail-closed Ocean Canvas release-controller recovery

**State:** isolated development candidate on certified production `main`; NOT merge-authorized, release-certified, deployed or publicly certified.

## Exact source lineage
- Repo: `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`.
- Certified production baseline: `93cfa934634335d744e6f5d91ab1da2c5f7e961a` (manually merged UIX-04A PR #233).
- Branch: `safety/pr-backlog02-default-deny-controller-20261021` (does NOT satisfy the live auto-conductor's `phase/` or `release/` prefixes and has no opt-in marker).
- Sources of narrowly selected corrections: historic DRAFT PRs #209 and #217. Their three release-safety source Git blobs are IDENTICAL to each other, and the source baseline before these patches is byte-identical to CURRENT production (controller `febcdde4312bcbf988128bf19c66efd918f26cfc`, tests `189ada6fd3beb04552384defa14076b52bc079bb`, workflow `78852999afb0a1491a9be48ab5ae06f2285f6bc8`). No old ITM source tree was merged or rebased.

## Bounded exact-path candidate
1. `.github/scripts/release-conductor.cjs`: clear historical pre-enrolled PR #202 and emergency red-main exception, require a complete standalone approval line plus owner, branch prefix and current main, preserve exact source SHA/required science checks, treat MPR as mandatory for actual MPR-affected UI/test/scope paths, allow independent controller-only PRs to be reviewed without misclassifying intentionally out-of-scope MPR checks, and recheck `main` and PR source before any actual merge.
2. `scripts/test_release_conductor.cjs`: full focused Node `node --test` safety harness, including #202 non-enrollment, quotations not constituting owner approval, draft/fork/wrong-author non-enrollment, exact-commit required jobs, red-main failure, true MPR-affected path checks, failed 3DB scientific checks, last-moment main/head change, and mock merge/dispatch assertions. Mocked GitHub actions do not merge real PRs.
3. `.github/workflows/release-conductor.yml`: add `workflow_run.branches: [main]` to stop unrelated PR completions from waking the release conductor unnecessarily. Keep the existing scheduled fallback and no automatic re-dispatch in poll loops.
4. This source-lineage and release-review document. **No frontend, numerical ocean source, provider data, backend API, evidence provenance, depth/time/QC or 16-theme implementation changes.**

## Security assurance and limitations
- A live production review found the pre-existing risk: `CONFIG.seededPRs` and `CONFIG.recoveryPRs` both contained `[202]`, and `isEnrolled` used `.includes()` on body prose. At the time of the audit, #202 remained DRAFT and conflicted; there was NO confirmed unauthorized merge.
- The safety candidate is intentionally **not enrolled for automatic merge**, has no branch prefix accepted by the current/default-deny controller and explicitly withholds the approval marker. Historic PRs #209 and #217 remain draft and unchanged.
- This branch changes the trusted release-controller behavior. Requires `release-controller-tests.yml` genuine Node focused PASS on its exact final tree, ordinary Python and any automatically triggered science/build checks, a separate reviewed release-scope/gate decision and **separate user authorization for any merge/deployment**. Do not interpret an eventual green test or mergeable Git state as permission.
- On a DRAFT PR, all actual checks must complete and any applicable MPR/science scope claims must be resolved without disabling a mandatory science gate. The same exact source SHA/tree must be certified at merge time; after an authorized release, verify the production controller's safety behavior and public CI on exact published main.
- No full 4-shard browser/96-PNG diagnostic loop for a controller-only source change unless the approved release policy expressly requires that exact final review SHA. Native GLORYS/INCOIS/Argo and ocean API integrity may never be weakened to speed review.

## Anti-loop and phase handoff
- UIX-03 public certified; UIX-04A #233 merged/deployed with public Chromium certification independently monitored on SHA `93cfa934`; UIX-04B remains 4/4 development-frozen and unmerged.
- ITM #209 and stacked #217 remain untouched; any later ITM integration must preserve this controller safety patch without wholesale file overwrites.
- Stage A M008–M095 remains the separate 85-file build queue, not merged.
- Permanent backlog queue and no-loop policy: GitHub issue #220. Record exact-commit status, owner attention, and next objectively appropriate phase at every handoff.
