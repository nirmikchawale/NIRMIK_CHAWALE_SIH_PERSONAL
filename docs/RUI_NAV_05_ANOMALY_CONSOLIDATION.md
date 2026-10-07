# RUI-NAV-05 — Anomaly Screening Consolidation

Status: implementation candidate on `rui-nav-05-anomaly-consolidation`

## Purpose

RUI-NAV-05 converts the existing flat anomaly page into the frozen seven-home information architecture while preserving the existing anomaly method and interpretation boundary.

The governing rule remains:

> one capability → one canonical parent → one discoverable path

## Production baseline consumed

NAV-05 starts from production `e36baf916cd8dbfb83d98faac6cb476162a35947`, containing NAV-01 through NAV-04, RUI-VIS-01, RUI-02, and 3DB-03 through 3DB-06.

At phase start, RUI-VIS-02 and 3DB-07 are open but unmerged. NAV-05 does not import unmerged visual or scientific work and must reconcile if either reaches `main` before merge.

## Frozen hierarchy

1. Overview
2. Spatial Anomalies
3. Temporal Anomalies
4. Depth Anomalies
5. Thresholds
6. Detected Flags
7. Explainability

Terminology is frozen: use **Detected Flags**, never confirmed events.

## Runtime consolidation

### Overview

Owns the screening hero, interpretation boundary, and spatial/residual/profile/temporal summary. A statistical flag remains explicitly not proof of an ocean event, sensor failure, forecast anomaly, hazard or operational risk.

### Spatial Anomalies

Owns the active scalar-field selector, flagged-cell map, spatial median/MAD context, and model-space extremes table. Coordinates remain actual model-cell longitude/latitude.

### Temporal Anomalies

Owns the genuine timestamp selector and temporal capability state. With insufficient genuine time evidence the control remains disabled and the screen remains LOCKED. NAV-05 creates no synthetic timestamps or temporal anomaly claims.

### Depth Anomalies

Owns the exact model-depth selector, verified Argo residual ranks, profile residual statistics and residual-outlier table. Depth remains positive downward and sourced from existing model depth indexes.

### Thresholds

Owns the fixed robust-z method chip and method/formula card. The threshold remains `|robust z| ≥ 3.5`, median/MAD, two-sided and deterministic; zero-MAD policy remains the existing backend response.

### Detected Flags

Owns consolidated flag counts and the screening-evidence export. The export payload structure and provenance remain unchanged.

### Explainability

Owns the Model Cell / Argo Residual focus switch, robust-z magnitude/threshold margin, “Why flagged?” source values, and interpretation guardrail. Magnitude bands remain descriptions of statistical departure only.

## Scientific invariants

NAV-05 preserves:

- existing anomaly API calls and payloads;
- robust-z calculation and fixed threshold;
- median/MAD semantics;
- zero-MAD behavior;
- verified model-cell coordinates and values;
- exact positive-down model depth indexes;
- genuine source timestamps and fail-closed temporal capability;
- verified Argo residual values and profile grouping;
- bias = Model − Observation residual semantics;
- shared scientific-context publication;
- provenance and evidence export structure;
- interpretation boundaries and non-event language.

No synthetic measurements, timestamps, depths, events, hazards, sensor-health claims or operational-risk claims are introduced.

## Explicitly deferred

NAV-05 does not implement NAV-06 Data Lab consolidation, NAV-07 Science System consolidation, NAV-08 guided discoverability, NAV-09 global contextual-control normalization, NAV-10 scroll/pointer hardening, NAV-11 full responsive/accessibility pass, NAV-12 fragmentation purge, NAV-13 judge journey validation or NAV-14 final production hardening.

## Acceptance gates

NAV-05 is complete only when:

1. all seven canonical homes are uniquely addressable;
2. the UI uses Detected Flags terminology;
3. scalar variable switching remains functional;
4. exact-depth interaction remains functional;
5. native time remains locked when evidence is insufficient;
6. spatial map/table remain available;
7. residual ranks/table remain available;
8. the fixed threshold/method remain unchanged;
9. screening export remains enabled;
10. Model Cell / Argo Residual explainability remains interactive;
11. interpretation guardrails remain visible;
12. existing live anomaly judge-flow remains green;
13. mobile retains directory and contextual controls;
14. exact-head tests + final-mvp pass;
15. a fresh-main race check passes or concurrent RUI/3DB work is reconciled;
16. exact-main tests + final-mvp + Pages + public HTTPS + live Chromium judge-flow pass after merge.

## Completion rule

Only after all acceptance gates succeed may RUI-NAV-05 be marked **COMPLETE / MERGED / DEPLOYED / LIVE / VERIFIED**.
