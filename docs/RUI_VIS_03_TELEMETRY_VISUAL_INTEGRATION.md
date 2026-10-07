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
