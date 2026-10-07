# RUI-VIS-04 — Model vs Observation Visual Integration

Status: IN PROGRESS — candidate, not deployed.
Starting main: `743df7b97a59681ab58468910f61345fa748e876`.
Branch: `rui-vis-04-model-observation-visual-integration`.
Consumes merged NAV-04 and verified VIS-03/3DB-08 production.

## Objective and implementation

Make the existing eight-home comparison workflow readable without changing parentage.
Comparison-scoped CSS reduces overview bulk, wraps the directory, emphasizes the existing
profile selector and matched-depth inspector, enlarges evidence labels and metric values,
and harmonizes cards with the station light/dark tokens. Signed bias keeps explicit cooler/
warmer labels, with theme-specific colours. Phone controls are at least 44px; tables retain
local scrolling; source metadata wraps; focus is visible and reduced motion suppresses
bias-marker transitions. QC and diagnostic-not-independent-validation boundaries remain visible.

## Scope and invariants

No TSX, App, main, route, API, store, renderer, data or mathematics edits.
Exact observation depths, provider QC, nearest valid water cell, linear interpolation,
no extrapolation, signed Model minus Observation bias, absolute error, MAE/RMSE, source
identity and CSV/JSON payload semantics remain unchanged. All eight NAV-04 homes remain.
Only runtime file: frontend/src/rui-nav-comparison.css.

## Concurrency and verification

At bootstrap PR #151 had merged 3DB-08 to starting main; no open new NAV or 3DB PR.
Old readiness #140 remains unrelated. Fresh main must be checked again before merge.
Local typecheck/build and diff checks are required; exact-head tests/final-mvp/full browser
acceptance then protected merge and exact-main tests/final-mvp/Pages/HTTPS/live Chromium
are required. Phase tests cover 1440/768/390/360px, profile/depth interaction, containment,
focus, touch targets, theme, motion, QC and evidence. Inherited tests are unchanged.
See RUI_CHAT1_EXECUTION_LEDGER.md for current gates and recovery.
