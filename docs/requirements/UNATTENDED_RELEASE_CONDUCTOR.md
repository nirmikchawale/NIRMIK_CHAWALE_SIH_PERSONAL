# Ocean Canvas — Unattended Phase Release Controller (OC-ARC)

## Purpose and scope

**Objective:** Execute the *release gates* of approved Ocean Canvas phase pull requests even when the owner is offline. The controller checks queue eligibility, scientific tests, React/Cesium tests, full final-MVP Chromium, applicable MPR/theme acceptance, merges one exact-head PR into `main`, and explicitly triggers all exact-main tests and public GitHub Pages deployment/browser certification. If any gate fails, it **holds** subsequent phases.

**Not an autonomous general-purpose coding agent.** GitHub Actions alone cannot reliably invent, scientifically validate and repair arbitrary source-code failures. This initial controller can evaluate, dispatch, merge and report. An AI coding agent would require a separate permitted account/installation, network/API budget, repository-scoped credentials and extensive non-fabrication constraints. It must produce a new tested commit, not bypass this gate.

## Current queue bootstrap (2026-10-18)

- **Only PR #202** is explicitly pre-enrolled as a known scientific-recovery release.
- The existing historic PRs #42, #58, #69, #77, #83, #94, #98, #103, #105, #107, #108, #140, #159 and #200 are **not** auto-enrolled, regardless of CI state. They must be individually reconciled before any release authorization.
- Existing `main` is already not fully browser certified. Only this specifically pinned recovery PR #202 may advance from that red baseline; every subsequent phase is blocked until the *new main* passes exact-commit `tests`, `final-mvp`, and `deploy-oceantwin-pages` (including all four public Chromium jobs).
- It preserves source bytes and per-provider QC rather than manufacturing data to satisfy the tests.

## Future automatic phase enrollment

An eligible new PR must satisfy all of the following:

1. Created by the repository owner `nirmikchawale`, with a head branch **in this same repository**, not a fork.
2. Branch name starts `phase/` or `release/`.
3. PR body contains exactly `OC-AUTO-RELEASE: approved`.
4. PR is open, not draft, targeting `main`, and GitHub reports it can merge cleanly.
5. It is current against the latest main base commit.
6. **Every applicable exact-head GitHub Actions workflow reports SUCCESS**; missing, queued, skipped, failing, expired or still-running required checks prevent a merge.
7. The previous released main tree is green. One PR per controller run. No stacking.

An implementation agent using these branch/body conventions automatically enqueues eligible PRs without further chat instructions. Creating source code, fixing a broken PR or adding the marker still requires an authorized actor or separately installed coding agent: the controller never impersonates one.

## Check policy

- Every PR: `tests`, `final-mvp`.
- Any changed frontend/src, frontend/e2e, frontend/index.html, RUI-MPR docs or MPR workflow: additionally `mpr-10-17-release-certification`.
- If additional science/3DB/atlas workflows run on that exact head SHA, their failures also block merge.
- Postmerge `main`: `tests`, `final-mvp` and `deploy-oceantwin-pages` must **all** succeed; Pages includes build, deploy, and four independent live-public Chromium shards.
- CSS/16-theme checks remain mandatory for applicable UI phases; future 18-theme phases must expand to the 108-image matrix rather than weakening acceptance.
- GitHub branch protections, status checks, review rules and Pages environment policies are never bypassed.
- Failure produces actionable workflow logs; no commit is silently treated as certified.

## Why explicit workflow_dispatch is required

GitHub officially documents that workflow events generated through `GITHUB_TOKEN` do not normally create additional workflow runs on `push`, including a merge made through a GitHub Actions job. Therefore this controller uses the supported `workflow_dispatch` exception to start `tests.yml`, `final-mvp.yml` and `deploy-pages.yml` **after** the merge. All three workflow files accept dispatch.

## Execution cadence / offline behavior

- Cron: `11,26,41,56 * * * *` (nominally every fifteen minutes, including nights).
- Additional immediate trigger: completion of tests, final-MVP, MPR and Pages workflows.
- Manual fallback: `workflow_dispatch` in the Actions UI, including an audit-only dry run if configured.
- Workflow-level concurrency ensures only one controller run modifies the release queue at a time.
- Each run ends; GitHub-hosted Actions are not a continuously powered server. Scheduled events may be delayed/dropped during load and disabled after 60 days without public repository activity, per GitHub documentation.
- The controller runs from **trusted default-branch workflow code only**. It never checks out or executes untrusted PR content itself.

## One-time setup / required permission reality

1. The release-controller PR must first be merged into default `main` after review and its controller unit tests. Scheduled workflows **do not run from an unmerged feature branch**.
2. The repository's Actions policy must permit `GITHUB_TOKEN` **Contents: write, Pull requests: write, Actions: write** for this workflow. These are explicitly declared in the workflow, but a restrictive repository or organization policy can still deny them.
3. Existing branch protections, required review and environment approvals remain in force. If those policies demand human review or a privileged actor, automatic merge cannot legally bypass them. A maintainer must adjust the policy or grant a scoped GitHub App token **once**; never store personal access tokens in source.
4. The default `main` must have `workflow_dispatch` enabled in the three required workflows. This infrastructure PR adds dispatch where missing.
5. Github Pages must remain configured for the existing GitHub Actions deployment environment.

**No system can guarantee "zero permissions":** an initial authorized policy/credential setup may be unavoidable. Once correctly installed, ordinary enrolled phase merges need no repeated chat instructions or approvals *unless GitHub branch/environment policies require them*.

## Rollback / safety

- If a merged release fails public Chromium, no further phase auto-merges. Preserve the known-good evidence and investigate. Never quietly assert success just because GitHub Pages uploaded files.
- Automatic rollback may be added later with an independently verified known-good artifact; it must not quietly replace scientific source data or corrupt the audit chain.
- Never delete historical pending PRs, scientific datasets or theme variants as a side effect of queue management.
- Disable the controller by disabling the GitHub workflow (Actions > ocean-canvas-release-conductor > Disable workflow) if abnormal behavior is observed.
- For an audit-only branch version, set `OC_RELEASE_DRY_RUN: 'true'` in its workflow before activation.

## GitHub paths

- Conductor: `.github/workflows/release-conductor.yml`
- Safety logic: `.github/scripts/release-conductor.cjs`
- Unit tests: `scripts/test_release_conductor.cjs`
- Test workflow: `.github/workflows/release-conductor-tests.yml`
- Release entry point: `https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/workflows/release-conductor.yml`
- Current recovery PR: `https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/pull/202`

## Objective implementation gate

- [ ] Controller safety tests pass on the infrastructure PR
- [ ] Infrastructure PR merged into main (not merely pushed to a branch)
- [ ] `release-conductor` appears enabled under Actions on main
- [ ] Confirm repository token can read checks and dispatch `tests` / `final-mvp` / Pages
- [ ] First automation event processes PR #202 only when all its exact-head checks pass
- [ ] First automated merge and production CI/Pages all succeed
- [ ] Four live-public Chromium shards pass on the merged SHA
- [ ] Release queue advances to new work only after exact-main certification

**State cannot be marked operational until these checkboxes are evidenced.**
