# RUI-VIS-04 — Model vs Observation Visual Integration

Status: LIVE & VERIFIED via PR #153.
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


## Candidate and merge evidence

Validated runtime head `323f327b6f13507d894f4d4d1bea0b9c819aa656` passed tests 37692361426 and final-mvp 37692361335, including all 108 browser tests. Fresh main was unchanged; expected-head merge produced `b252547cac5732405b4bfbca47da64e9029ea3db`. No race reconciliation was needed.

Production gates: final-mvp 37694522375; deploy-oceantwin-pages 37694522481; tests 37694522437. All SUCCESS; final evidence below.

## Final production verification — 2026-10-08

STATUS: LIVE & VERIFIED
Validated runtime head: 323f327b6f13507d894f4d4d1bea0b9c819aa656.
PR #153 merged as b252547cac5732405b4bfbca47da64e9029ea3db.
Exact merge tests 37694522437, final-mvp 37694522375 and Pages 37694522481: SUCCESS.
Pages build/deploy/public HTTPS/live Chromium: SUCCESS.
Public job 113043280780 passed 108 tests, including VIS-04 at 1440/768/390/360px.

Later fully verified containing main: 2c4050511f0e56ad59ff148773b327b6931ff9fb.
Tests 37749778542, final-mvp 37749778520, Pages 37749778489: SUCCESS.
Public job 113220424809 passed 118 tests including all four VIS-04 viewport tests.

Manual live inspection confirmed the compact heading, all eight directory buttons,
readable profile/source surfaces and profile-directory jump. Keyboard End selected
447.02 m with Argo 11.9125 °C, model 11.6843 °C and bias -0.2281 °C.
No scientific algorithms, source/generated data, or scientific semantics changed.

Latest observed main: 5965c48bd29da21bb2601fc910d372cc8dc3fcc2,
Merge RUI-NAV-07 Science System Consolidation, preserving 3DB-11.
Its tests 37754663785 and Pages 37754663763 build/deploy passed;
public acceptance and final-mvp 37754663722 were still running at closure.
This newer parallel release is separate from the completed VIS-04 exact-merge gates.
No new open NAV/3DB PR appeared in the latest PR list; old #140 remains unrelated.

This evidence-only checkpoint is pushed on rui-vis-04-model-observation-visual-integration.
The branch tip containing this document is the closure commit; runtime head is unchanged.
Main may contain an older ledger: follow its instruction to inspect the phase branch.
Next Chat-1 phase: VIS-05 Anomaly Screening, after refreshing main/CI/Pages and reading NAV-05.
Do not begin a third phase in this session.
