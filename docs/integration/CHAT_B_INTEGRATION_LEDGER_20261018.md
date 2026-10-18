# Ocean Canvas · Chat B integration and collision ledger

**Checked at (UTC):** 2026-10-18T15:10:24.981Z
**Repository:** https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL
**Authoritative main observed:** `75880aa1714b68d92fbd2a652a10ed1d8a85c0d8`
**Mode:** integration audit, source-code release safety; **NOT merged / NOT deployed / NOT a Stage B authorization**.
**Two-chat handoff:** Ocean_Canvas_Parallel_Stage_A_and_Integration_Merge_Handoff(1).md (18 Oct 2026).

## 1. Independent ownership and immutable boundaries

- Chat A exclusively owns `build/m008-m095-science-ui-train` and Draft PR #204, including Stage A tests and 108-screen development certification. **Chat B READ ONLY**, no Stage B until independently certified exact SHA AND separate user approval.
- Chat B owns `integration/*` branches and isolated legacy integration. No direct `main` commit, no merge of an uncertified candidate and no unreviewed production deployment.
- PR #202 contains a recovery ancestor of PR #204. PR #208 also contains the #202 recovery files; do **not** merge this into main just because CI turns green. Reconcile source ancestry and user release approval first.
- Original source: 140 geographic IDs, 35 authentic pilots, 41 source frames; GLORYS12V1 2024-01-02 / Argo Float 5907092 Cycles 13 and 12 are distinct from historical 2004 pilot sources. No fake depth, observation, interpolation, temporal support or quantitative score.
- Keep 16 production glass theme IDs (Arctic Mist default), do not publish Stage A's extra Light and Dark until accepted and approved. Preserve both 3D renderers and mobile/desktop pointer and scroll behavior.

## 2. Open PR inventory with evidence-backed disposition

All heads, draft state and file sets were read from live GitHub. A divergent history or old date is **not** sufficient to label a PR obsolete or merged.

| PR | Scope | Live candidate SHA (prefix) | Against main | Disposition / blocker |
|---|---|---|---|---|
| #208 | Joint M001–M007 provider + MPR/mobile browser candidate | `6e9c1c5` | ahead 26; 14 files | **BLOCKED**: exact-head Chromium/96-theme visual not complete, and recovery ancestry needs release approval; draft |
| #207 | Isolated MPR UI/browser correction | `9e96f86` | ahead 7; 10 files | **BLOCKED**: underlying original CCHDO 404 fails science/static CI; overlapping #205/#208; draft |
| #205 | Mobile control sheet + toolbar scroll | `0aea323` | ahead 3; 7 files | **BLOCKED**: browser/static/science pipeline failure; owned independent UI lane, overlaps #200/208; draft |
| #204 | M008–M095 cumulative Stage A build train | `8d6ca46` | ahead 40; 65 files | **CHAT A ONLY — NOT RELEASE READY**. Do not edit head/body/state or merge |
| #202 | Authentic CTD discovery, source hashes, Argo tests | `9345be4` | ahead 17; 7 files | **DEPENDENCY / HOLD**: cumulative inside #204; public release ancestry and approvals unresolved; draft |
| #200 | Default verified Argo Cycle 13 selection | `3d4ad4c` | ahead 13 / behind 7; 3 files | **COLLISION**: `App.tsx` and `OceanGlobe.tsx` shared with #205/#208. Reconcile sequentially, do not merge together |
| #159 | Comparison pilot empty state, CSS and E2E | `9e8ad3a` | ahead 2 / behind 308; 5 files | **REQUIRES REBASE AND SEMANTIC AUDIT**: ComparisonPage modern dependencies |
| #140 | File-manager shell visual-readiness document | `0cfd6a8` | ahead 1 / behind 459; 1 file | **STALE HISTORIC READINESS — DO NOT IMPORT UNCHANGED**: original text asserts NAV-01 did not exist, while main already documents NAV-01 implementation; reconcile its outdated dependency claim |
| #108 | Live T–Z locator test | `ac8d34a` | ahead 1 / behind 788; 1 file | **HISTORIC TEST, NEEDS DIFF RECONCILIATION** |
| #107 | UX quick fixes with backend + React/UI | `9c55834` | ahead 2 / behind 788; 21 files | **BLOCKED**: highly overlapping old runtime/API; no bulk rebase |
| #105 | T–Z analysis UI and tests | `b135d08` | ahead 8 / behind 789; 6 files | **REQUIRES REBASE/FEATURE AUDIT** |
| #103 | Anchored Argo 3D billboard | `d77c703` | ahead 4 / behind 790; 4 files | **REQUIRES REBASE/ARGO COLLISION REVIEW**: shared globe/App |
| #98 | Mobile journey acceptance | `d78596b` | ahead 3 / behind 823; 2 files | **HISTORIC TEST/CSS, NEEDS RECONCILIATION** |
| #94 | Persistent colorbar | `b8d5069` | ahead 7 / behind 847; 5 files | **REQUIRES REBASE/UI OWNERSHIP REVIEW** |
| #83 | Split feature/judge E2E | `3a34d51` | ahead 1 / behind 861; 1 file | **HISTORIC TEST, NEEDS DIFF RECONCILIATION** |
| #77 | Water Column HUD CSS collision | `2395c3f` | ahead 1 / behind 864; 1 file | **HISTORIC CSS, NEEDS CURRENT SCREENSHOT EVIDENCE** |
| #69 | Completion docs + info page | `e63d368` | ahead 5 / behind 878; 5 files | **REQUIRES REBASE, avoid stale evidence/public claims**; draft |
| #58 | Glider/CTD/BGC exporter and workflow | `c4e0e91` | ahead 3 / behind 953; 2 files | **SCIENTIFIC DEPENDENCY REVIEW**, old workflow against latest source QC; draft |
| #42 | Broad full-compliance app change | `746ba22` | ahead 26 / behind 1040; 18 files | **HIGH-CONFLICT HISTORIC CHANGE**, not eligible for blind merge; draft |

> #206 was closed unmerged after a correct release-scope failure; retain it only as an audit record. A separate non-PR exploratory `integration/m008-m095-cumulative-20261018` branch copies older Stage A content and MUST NOT be merged, promoted or treated as current Chat A certification. Do not write it further.

## 3. Concrete collision matrix

| Pair | Shared changed paths and semantic impact | Safe policy |
|---|---|---|
| #204 vs #205 | No identical changed paths in latest 65 vs 7 file inventories, but source/renderer UI semantics may couple | Independent development, never infer production compatibility from zero path overlap |
| #204 vs #202 | All 7 #202 recovery files in #204; #204 derived from #202 | **Do not merge ancestor independently without tested release ordering** |
| #204 vs #208 | Same 7 scientific/recovery files as #202, including MPR workflow and E2E | **No Stage B merge**; exact-composite retesting and authorization needed |
| #205 vs #200 | `frontend/src/App.tsx`, `frontend/src/components/OceanGlobe.tsx` | Explicit 3-way behavior comparison, sequential merge and responsive/Argo test |
| #205 vs #208 | All seven #205 paths in #208 | Do not independently merge both as duplicates |
| #207 vs #208 | All ten #207 paths in #208 | Stage separate or supersede after evidence; never simultaneously merge |
| Old UI PRs vs current main | Most old PR heads are >300 to >1000 commits diverged | Read exact code/current behavior; use new minimal forward-port instead of stale bulk merge |

## 4. CI / public-state audit

- PR #208 at `6e9c1c588e6016fdc362c91a87c8de9fc0cd29de`: checks observed green for Python, 3DB source integrity, native source/LOD, React/Cesium, science/API, static-hosted, MPR scope and scientific regression; full 96-image Chromium and all four `final-mvp` shards still unaccepted at this checkpoint. **CI incomplete is a block**.
- PR #205 at `0aea3234aeed3691fbf12d963f4bd503f74c17c2`: Python, source integrity, frontend scope and React passed; science/static/browser failure and skipped end-to-end check remain. Original authentic CCHDO provider 404 is a pipeline dependency, not permission to substitute or fake observations.
- PR #204 latest named above: read-only Stage A. All its tests/108 screenshot evidence and source limitations are Chat A decisions. One MPR-only scope failure on the mixed science/UI draft is intentional.
- Release-conductor main SHA `75880aa...` is NOT a new successful public deployment. A successful release-conductor no-op is not a successful release. **No new Pages/public-Chromium certification established here**.
- Branch protection read on main: `protected=false`. Thus the controller must enforce explicit enrollment, exact checks, race checks and approvals rather than assuming branch rules save the release.

## 5. Production release conductor guard improvement (this draft PR)

The current main release conductor has `seededPRs:[202]` and `recoveryPRs:[202]`, so it is possible for #202 to become auto-enrolled if someone merely undrafts it, with a special main-red exception. This handoff does not authorize that. The independent candidate removes historical implicit enrollment/bypass, retains owner/repository/base/branch and explicit `OC-AUTO-RELEASE: approved` opt-in, and revalidates **main SHA and PR source/base/draft/mergeability immediately before a merge**. Tests updated. **No main change or conductor rollout until separately reviewed.**

## 6. Release next steps and handoff

1. Review independent conductor hardening PR after its unit/CI checks. Do not merge while draft, including this safety PR.
2. Await exact-head #208 live MPR and four-shard final-MVP Chromium; preserve genuine failure evidence. Even all green would NOT replace the user's separate Stage B approval if source recovery changes overlap #204's ancestry.
3. Complete PR #205 mobile/desktop regression and PR #200 Argo collision audit on isolated composite preview; do not rewrite Chat A branch or invalidate original science.
4. Rebase/selectively forward-port truly independent legacy PR functionality after current UI owner review. #140 readiness text claims NAV-01 absent, contradicting current main\u2019s NAV-01 implementation document. Do not carry it over unedited; rewrite or retire after runtime verification.
5. Before any authorized merge re-fetch main, source SHA and draft/permissions; after merge verify Pages artifact SHA and fresh public HTTPS Chromium (not merely HTTP 200), record rollback SHA.

```text
OCEAN_CANVAS_INTEGRATION_CHECKPOINT
checked_utc: 2026-10-18T15:10:24.981Z
main_before_sha: 75880aa1714b68d92fbd2a652a10ed1d8a85c0d8
main_after_sha: 75880aa1714b68d92fbd2a652a10ed1d8a85c0d8
integration_branch: integration/release-conductor-default-deny-20261018
pr_head_sha: SEE PR #209 LIVE HEAD (re-fetch before every certification)
overlap_with_stage_a_pr204: .github/scripts/release-conductor.cjs and scripts/test_release_conductor.cjs are not changed in PR #204; main coupling still exists
scientific_sha_qc_verified: NOT_RUN_ON_THIS_SECURITY_BRANCH
required_ci_exact_sha: NOT_RUN_PENDING_PR
development_chromium: NOT_RUN
production_chromium: NOT_RUN
pages_published_sha: NOT_VERIFIED
merge_performed: NO
rollback_sha: NOT_APPLICABLE
stage_a_branch_touched: NO
blockers_and_next: Review conductor safety, verify exact-commit tests, preserve Stage A quarantine and full PR #208 browser gating
```
