# RUI-NAV-03 — Telemetry Consolidation

Status: implementation candidate on `rui-nav-03-telemetry-consolidation`

## Purpose

RUI-NAV-03 converts the existing long Telemetry page into the frozen seven-home information architecture without changing telemetry science.

The governing rule remains:

> one capability → one canonical parent → one discoverable path

## Production baseline consumed

NAV-03 starts from production `b626b580dab62ec0820ef239b6b7a90c1ed1d118`, which already contains:

- RUI-NAV-01 file-manager shell;
- RUI-VIS-01 file-manager visual integration;
- RUI-NAV-02 3D Explorer consolidation;
- RUI-02 workspace-owned scientific context;
- 3DB-03 geographic ownership;
- 3DB-04 Cesium rendering contract;
- 3DB-05 Geographic ↔ Water Column synchronization;
- 3DB-06 native multi-depth block integration.

3DB-06 remains authoritative for positive-down retained source depths. NAV-03 does not create, interpolate or alter scientific depth levels.

## Frozen Telemetry hierarchy

1. Overview
2. Time Series
3. Depth Series
4. Sensors
5. Variable Comparison
6. Statistics
7. Export / Evidence

## Runtime consolidation

### Overview

The existing Telemetry hero and verified-window source card remain, but the three-card reading guide is moved behind a compact directory-guidance disclosure so it does not remain permanent page bulk.

The existing five summary metrics remain the landing summary: genuine depth count, genuine time count, full horizontal grid, selected retained depth and active scalar variable.

### Time Series

Time Series owns the GLORYS native timestamp selector, the existing `TimeTelemetryCard`, and the existing `IncoisOperationalPanel`.

The GLORYS time control remains disabled when only one genuine source timestamp exists. No synthetic timestamp or trend is introduced.

### Depth Series

Depth Series owns the Telemetry depth selector, exact-depth ladder, mean/P10/P90 depth chart, and local vertical context/gradient.

All selections remain existing model depth indexes. The local gradient remains descriptive and is calculated only between adjacent genuine model levels.

### Sensors

Sensors becomes a first-class Telemetry home using observation inventories already loaded by the application:

- eligible Argo comparison profiles;
- shared imported/verified Glider profiles;
- CTD/XCTD profiles;
- BGC profiles;
- other valid session-imported observation profiles when present.

The section inventories profile/record counts and source metadata only. It does not reinterpret observation values, fabricate missing sensors, or present the profiles as independent validation. Detailed matchups remain owned by Model vs Observation (NAV-04).

### Variable Comparison

The existing Temperature / Salinity selector moves out of the generic toolbar and becomes the one canonical GLORYS scalar selector.

Catalog min/max and units for the two existing variables are shown side-by-side as context. They are existing catalog metadata; NAV-03 performs no cross-variable scientific arithmetic.

### Statistics

Statistics owns selected-depth distribution and current telemetry summary.

Horizontal current semantics remain u/v only. No vertical current component is inferred.

### Export / Evidence

Export / Evidence owns Download depth telemetry CSV, statistic definition, dataset/product/runtime identity, and model DOI.

The CSV remains bound to the active variable, genuine time index and retained source-depth rows.

## Removed fragmentation

The old generic `.telemetry-toolbar` mixed four unrelated concepts: variable, depth, time and export.

NAV-03 removes that feature island and places each control under its frozen parent. No duplicate replacement toolbar is added.

## Scientific invariants

NAV-03 preserves:

- telemetry API payload semantics;
- genuine timestamps only;
- exact positive-down retained model depths;
- full-grid finite-cell statistic definitions;
- P10/P50/P90 and standard-deviation semantics;
- descriptive local-gradient semantics;
- horizontal u/v current semantics only;
- INCOIS provider values and timestamps unchanged;
- RUI-02 scientific context publication;
- provenance, DOI and runtime identity;
- verified observation source values and timestamps;
- 3DB-06 multi-depth ownership;
- fail-closed behavior when evidence is unavailable.

## Explicitly deferred

NAV-03 does not implement NAV-04 Model vs Observation consolidation, NAV-05 Anomaly Screening consolidation, NAV-06 Data Lab consolidation, NAV-07 Science System consolidation, NAV-08 guided discoverability, NAV-09 global contextual-control normalization, NAV-10 scroll/pointer ownership rewrite, NAV-11 full responsive/accessibility navigation pass, NAV-12 fragmentation purge across all pages, NAV-13 judge-flow validation, or NAV-14 production finalization.

## Acceptance gates

NAV-03 is complete only when:

1. all seven Telemetry homes are visible and uniquely addressable;
2. the old generic Telemetry toolbar is absent;
3. Temperature/Salinity remains functional and publishes the same scientific context;
4. depth slider and 31-depth ladder remain synchronized on the verified baseline;
5. one-time GLORYS remains explicitly time-locked rather than synthetically animated;
6. genuine INCOIS multi-time/depth controls remain functional;
7. Sensors shows the existing shared observation inventory without synthetic values;
8. selected-depth and current statistics remain available;
9. CSV export and statistic/provenance evidence remain available;
10. existing live Telemetry regression coverage passes;
11. mobile retains directory/control access;
12. exact-head tests, React/Cesium, science/fallback and full browser acceptance pass;
13. a fresh-main race check passes or is reconciled;
14. exact-main tests + final-mvp + Pages + public HTTPS + live Chromium judge-flow all pass after merge.

## Completion rule

Only after every acceptance gate succeeds may RUI-NAV-03 be marked **COMPLETE / MERGED / DEPLOYED / LIVE / VERIFIED**.
