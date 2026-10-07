# RUI-NAV-04 — Model vs Observation Consolidation

Status: implementation candidate on `rui-nav-04-model-observation-consolidation`

## Purpose

RUI-NAV-04 reorganizes the existing verified model–observation comparison into the frozen eight-home information architecture without changing comparison science.

The governing rule remains:

> one capability → one canonical parent → one discoverable path

## Production baseline consumed

NAV-04 starts from production `d4520f23cf64a6aa72e89ca439d6d526e2743a98`, containing RUI-NAV-01 through RUI-NAV-03, RUI-VIS-01, RUI-02, and 3DB-03 through 3DB-06.

An open 3DB-07 Time-Aware Ocean Block Integration PR exists concurrently but is not merged into production at NAV-04 start. NAV-04 therefore does not import or reinterpret unmerged 3DB-07 science; it must reconcile if that dependency lands before NAV-04 merge.

## Frozen Model vs Observation hierarchy

1. Overview
2. Observation Sources
3. Matchups
4. Profile Comparison
5. Bias by Depth
6. Metrics
7. QC
8. Evidence

## Runtime consolidation

### Overview

The existing Argo–GLORYS12V1 hero remains together with the scientific interpretation boundary: diagnostic consistency is not independent validation and profile metrics are not global model-accuracy claims.

### Observation Sources

Observation Sources owns the existing Verified Argo profile selector and model/observation source identity. It does not fetch, alter, or synthesize new profiles.

### Matchups

Matchups owns the collocation mini-map, observation/model-cell coordinates, observation time, QC status, and the matched-level evidence table.

### Profile Comparison

Profile Comparison owns the existing exact matched-depth slider, Argo observed temperature, interpolated model temperature, signed bias, absolute error, selected-depth bias meter, and the observed-vs-interpolated profile chart.

### Bias by Depth

Bias by Depth owns the existing Model − Observation signed-bias chart. Negative remains model cooler; positive remains model warmer.

### Metrics

Metrics owns matched-level count, MAE, RMSE, cell distance, time offset, matched-depth range, and the existing residual summary including mean signed bias, median/P90 absolute error, largest error and warm/cool split.

### QC

QC owns the existing comparison method semantics and pipeline:
- provider QC;
- positive-down depth;
- nearest valid water cell;
- linear depth interpolation;
- no extrapolation;
- bias = Model − Observation.

### Evidence

Evidence owns model/observation provenance, comparison CSV download, evidence JSON download and the interpretation boundary.

## Scientific invariants

NAV-04 preserves:

- provider-QC accepted Argo profiles;
- existing collocation selection;
- exact observation depths;
- existing model interpolation semantics;
- no depth extrapolation;
- signed bias = Model − Observation;
- MAE and RMSE definitions;
- spatial-distance and time-offset meaning;
- existing profile/residual diagnostics;
- provenance and observation/model DOI/source identity;
- RUI-02 scientific-context behavior;
- existing downloads and evidence payload structure;
- diagnostic-not-independent-validation interpretation boundary.

No synthetic measurements, timestamps, depths, matchups or validation claims are introduced.

## Explicitly deferred

NAV-04 does not implement NAV-05 Anomaly Screening consolidation, NAV-06 Data Lab consolidation, NAV-07 Science System consolidation, NAV-08 guided discoverability, NAV-09 global contextual-control normalization, NAV-10 scroll/pointer ownership, NAV-11 full responsive/accessibility pass, NAV-12 fragmentation purge, NAV-13 judge-flow consolidation, or NAV-14 final production hardening.

## Acceptance gates

NAV-04 is complete only when:

1. all eight Model vs Observation homes are uniquely addressable;
2. the Verified Argo selector remains functional;
3. collocation map and matched-level table remain available;
4. matched-depth interaction remains synchronized with the selected profile;
5. observed/model/bias/error readouts remain unchanged;
6. profile comparison and bias-by-depth charts remain available;
7. metrics/residual summary remain available;
8. provider QC/interpolation/no-extrapolation method remains visible;
9. CSV and JSON downloads remain enabled for verified evidence;
10. diagnostic-not-independent-validation guardrail remains visible;
11. existing Phase 6C profile persistence and live judge-flow tests pass;
12. mobile retains directory, selector, depth inspector and evidence access;
13. exact-head tests + final-mvp pass;
14. a fresh-main race check passes or concurrent science is reconciled;
15. exact-main tests + final-mvp + Pages + public HTTPS + live Chromium judge-flow pass after merge.

## Completion rule

Only after all acceptance gates succeed may RUI-NAV-04 be marked **COMPLETE / MERGED / DEPLOYED / LIVE / VERIFIED**.
