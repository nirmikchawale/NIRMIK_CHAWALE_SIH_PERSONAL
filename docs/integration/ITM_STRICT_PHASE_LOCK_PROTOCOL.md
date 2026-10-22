# Ocean Canvas — Chat B Strict ITM Phase-Lock and Evidence Protocol

**Authority:** User instruction of 18 October 2026. This is the operational handoff for every future Integration, Testing & Merge (ITM) session. **It does not grant automatic merge/deploy authorization.**
**Repository:** `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`
**Roadmap:** ITM-00 through ITM-15. The live GitHub repository and exact commit checks are authoritative, not cached statuses or older summaries.

## 1. Non-negotiable phase lock

- **One active certification phase at a time.** Do not begin ITM-(N+1) while an ITM-N mandatory requirement remains unresolved. The special current dependency is that ITM-02 and ITM-03 must **both** be fully certified before ITM-04.
- User instructions `Proceed with ITM-N`, `complete in its entirety` and `resume from checkpoint` authorize ordinary investigation, independent fixes, commits to Chat B-owned integration branches, tests, CI inspection and retry **without demanding another user instruction for each substep**.
- They do **not** authorize a production merge, Pages publication, branch protection bypass, an unreviewed scope exception or Stage B promotion of M008–M095. Such operations require separate explicit authorization and the applicable exact-SHA gates.
- Implementation, unit tests, workflow run creation, browser certification, merge and public deployment are **different milestones**. Only declare a phase fully certified when *its own* defined requirements have all passed. Do not call queued, skipped, stale-head, cancelled, flaky, failed or non-applicable checks successful.
- Never relabel a red job as green because the failure predates the proposed change. Identify inherited failures honestly, repair through a scoped tested candidate, or document a genuine external blocker.

## 2. Required in-session execution loop

1. **Bootstrap:** Read current `main` SHA, PRs #209/#210/#208/#204 and changed paths, exact-head CI/check runs, latest browser evidence, Pages run, review/permissions, issue comments and this ledger. Account for concurrent movement before every write.
2. **Inventory:** Enumerate every remaining requirement in the active phase, root cause and ownership. Reuse previously verified code; never repeat completed work.
3. **Implement safely:** Read current file and its blob SHA, create smallest reversible fix on a Chat B `integration/*` branch, preserve source authenticity, provenance, 16 production glass themes, original Arctic Mist default, 3D geography and water-column renderers, accessible mobile/desktop behavior.
4. **Run comprehensive gates:** Python/pytest, strict scientific source/quality contracts, React/Cesium typecheck/build, scope, targeted regression, all applicable GitHub Actions workflows, actual local-built Chromium test matrix, screenshots and the appropriate public verification when authorized and applicable.
5. **Failure loop:** Read real job logs, traces, and exact source; fix failures rather than merely describing them. Rerun at the newest HEAD, invalidating earlier SHA claims; continue while work and tool/runtime access permit. Do not weaken the expected behavior to manufacture a green result.
6. **Gate classification:** Every job has a documented state: PASSED; FAILED; QUEUED/IN_PROGRESS; SKIPPED; NOT_APPLICABLE **with exact reason**; BLOCKED_BY_APPROVAL; BLOCKED_BY_EXTERNAL_DEPENDENCY. A normal required job cannot be excused as NOT_APPLICABLE.
7. **Certificate:** Include exact SHA, PR/branch/base, scope diff, required checks with job/run IDs, screenshots/browser results, scientific provenance, merge/deployment/public HTTPS evidence, Stage A collision matrix, remaining blockers and rollback baseline.
8. **Advance only on certificate:** If a necessary external runner or approval remains unavailable in this execution, leave the phase **INCOMPLETE/BLOCKED**, record the exact blocker on the PR and in the ledger. Do not claim asynchronous future work or move into the next phase.

## 3. Critical ownership and release boundaries

- **Stage A is exclusively Chat A:** draft PR #204, `build/m008-m095-science-ui-train`, 108-screen Stage A evidence, science and Light/Dark draft themes. Chat B **MUST NOT** modify the branch, PR head, PR body, draft state, auto-merge, or its provenance.
- Stage B is disallowed until `STAGE_A_CERTIFIED` with immutable exact SHA **plus explicit separate human approval**. Never infer this from a generic `proceed` instruction.
- Do not merge #202 on its own: it is an ancestor of #204. #208 and stacked #210 contain overlapping genuine-source recovery; exact ancestry and semantic compatibility are release gates. Branch #210 inherits from #208, not main.
- Before any separately approved merge, refresh `main`, PR SHA, base, draft state, required exact-head CI, collision map, permissions and rollback SHA; after merge, independently verify exact published Pages artifact and full public Chromium.
- Public science may not be fabricated: distinguish GLORYS12V1 verified 2024-01-02, Argo 5907092 observation cycles, genuine historical 2004 pilots and genuinely sourced INCOIS/CTD snapshots. No synthetic timestamps/measurements, invented depth, frame hashes, or implied playback.

## 4. Current immutable facts and blocking dependencies (18 October 2026)

These are **observed checkpoints**, not current status guarantees. Always re-fetch from GitHub.

| Surface | Last observed evidence | Open requirement |
|---|---|---|
| `main` | `75880aa1714b68d92fbd2a652a10ed1d8a85c0d8`; `protected=false` | Main `final-mvp` red; Pages uploaded and deployed but 3/4 live Chromium shards red; do not claim public certified |
| ITM-02 / PR #209 | Draft `integration/release-conductor-default-deny-20261018`; head `b9787985cc58595fa83c4f06906694c4a680a657` | 20/20 release-controller unit tests, pytest and React green; inherited CCHDO HTTP 404 fails science/API and static jobs; MPR UI-only scope failure is NON_APPLICABLE for conductor-only PR, but not a reason to weaken MPR UI scope; still no release approval |
| ITM-03 / PR #210 | Draft `integration/itm03-chromium-recovery-20261018`, stacked on #208 `6e9c1c588e6016fdc362c91a87c8de9fc0cd29de`; most recently observed head `9541eb3a91595ee9cfc62cb7770922925761971e` | Full exact-HEAD science/static/React, MPR 96-image/Chromium and four-shard live tests required; browser defects must be fixed and retested rather than waived |
| ITM-03 / PR #208 | Authentic historic CCHDO window recovery and broad UI integration, scientific/source and build checks green; browser red | #210 is the scoped browser-fix continuation; no separate blind merge of #208 |
| Stage A / PR #204 | Draft, HEAD actively moving under Chat A | Strict read-only quarantine; two changed-path overlaps with #210 at last comparison; mandatory Stage B reconciliation |

**Critical inherited science failure:** `scripts/fetch_verified_observation_breadth.py` in `main` queries CCHDO ERDDAP for 2018–2026, returning real HTTP 404. Exact-main `final-mvp` jobs science-api-and-fallback and static-hosted both fail here. #208 carries authentic older-window correction with QC; never replace missing CTD with invented observations.

**Critical browser failure pattern:** mobile `Close explorer controls` hidden by older CSS, two distinct `.volume-note` overlays causing a strict-locator failure, and wheel forwarding incorrectly tested at Explorer's scroll boundary. #210 carries focused corrective changes; test on actual pixels and input events before certification.

## 5. Phase-specific closure gates

**ITM-02**: exact HEAD 20/20 release-controller safety suite AND all *applicable* required CI GREEN, no historical auto-enrollment or main-red bypass, standalone affirmative opt-in, race protection, no Stage A ownership breach, draft/unmerged until authorized. If inherited main scientific CI is red, **security component can be marked verified but entire phase/release remains BLOCKED**.

**ITM-03**: genuine CCHDO recovery passes native-source QC, source/API/static/React/pytest; MPR scope/96 real glass screenshot and full Chromium matrix pass for precise composite HEAD; mobile control sheet, wheel, globe journey, accessible actions and consistent science pass; no Stage A collisions unresolved. Public-URL production publication verification is required **only after separately authorized merge/deploy**; until then do not claim full production completion.

**ITM-04**: **LOCKED** until ITM-02 and ITM-03 completion certificates meet their explicitly required gates. Do not switch to unrelated tasks merely to avoid red tests.

## 6. Minimal user's instruction

> Resume the latest verified Ocean Canvas ITM checkpoint. Apply the strict single-phase lock protocol in `docs/integration/ITM_STRICT_PHASE_LOCK_PROTOCOL.md`. Finish all independently eligible corrections and exact-HEAD certification for the current phase. Do not advance to ITM-04 with an unresolved ITM-02/03 gate; no unapproved merge/deploy or Stage A writes. Report proof and genuine blockers.

Record every future phase checkpoint in the integration ledger and relevant GitHub PR comments. Do not promise work will continue after a ChatGPT response absent a separately configured automation.
