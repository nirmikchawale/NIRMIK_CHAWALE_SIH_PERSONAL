# RUI-VIS-03 — Telemetry Visual Integration

Status: IN PROGRESS. Not merged, deployed or live.

Starting main: `239806074779b19f12b2c203f0adcf03cc4cdbe8`.
Branch: `rui-vis-03-telemetry-visual-integration`.
Consumes merged RUI-NAV-03; all seven canonical homes and DOM controls retained.

## Implementation and boundaries

The existing Telemetry stylesheet receives workspace-scoped visual overrides. Overview
height is reduced; the directory wraps without clipping actions; labels are readable;
selected controls have a visible inset rail; time-lock explanation stays in normal flow;
source, inventory, statistics and evidence surfaces use existing light/dark station tokens.
Touch controls are at least 44px on phones, with visible keyboard focus, wrapped sensor
identities, responsive metrics/depth ladders and reduced-motion/forced-colour support.
No API, state, TSX, navigation hierarchy, formula, QC, source/generated data, timestamp,
depth, interpolation or current-vector semantics change. Horizontal currents remain u/v.

## Concurrency

Observed PR #151 (3DB-08), head `9094b84a29453470fcb1404871aa4a93f44f6de9`.
Its changed-file list has no overlap with this phase. No open RUI-NAV PR at bootstrap.
Old readiness PR #140 remains open and is not a new runtime prerequisite.
Recheck main and PRs before merge; reconcile and rerun CI if main advances.

## Verification

Local TypeScript typecheck and production build passed. Existing large-bundle warning remains.
Local Chromium installation failed because the downloaded browser archive was invalid;
browser acceptance must run in repository CI. Existing production was inspected in cloud Chromium.
Phase tests cover 1440/768/390/360px, directory containment, target sizing, exact depth
selection, variable switching, genuine-time lock, keyboard focus and theme surfaces.
Inherited NAV, VIS and scientific browser suites remain unchanged and required.

Pending: exact-head tests/final-mvp/full browser acceptance, fresh-main race check,
protected merge, exact-main tests/final-mvp, Pages build/deploy/public HTTPS/live Chromium.
See `RUI_CHAT1_EXECUTION_LEDGER.md` for the restart checkpoint.

## Verified closure — 2026-10-07 / resumed 2026-10-08 IST

Status: **LIVE & VERIFIED**. This closure supersedes the candidate status above.
PR #152 merged validated head `0f2ee698468e8e00e9062ad0e3f97e25e80f4737` as
`89e6754603b615a75a9890c75eb2a88c498e0d31`. Candidate final-mvp 37645237025
passed all 100 browser tests. Exact merge tests 37646905022 and final-mvp 37646905240 passed.
Pages 37646905230 built and deployed, then its public check was superseded by concurrent 3DB-08.

The containing production main `743df7b97a59681ab58468910f61345fa748e876` (PR #151)
passed tests 37648971119, final-mvp 37648970974 and Pages 37648970893.
That Pages run passed build, deploy, HTTPS and **104 live Chromium tests**, including
all four VIS-03 viewport cases. This is the final live acceptance evidence; the cancelled
older Pages run is not represented as green. Manual live inspection confirmed directory
containment and the exact-depth ladder. No Telemetry science changes were made.
