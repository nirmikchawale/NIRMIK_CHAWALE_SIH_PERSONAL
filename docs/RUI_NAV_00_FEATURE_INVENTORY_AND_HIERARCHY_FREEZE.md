# Ocean Canvas RUI-NAV-00 — Feature Inventory & Hierarchy Freeze

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** RUI-NAV — Navigation, Information Architecture & Feature Consolidation  
**Phase:** RUI-NAV-00  
**Authoritative planning baseline:** `276bc71cc8fd8a7f664c43f8d4262e854b5d4995`  
**Status:** HIERARCHY FROZEN FOR RUI-NAV-01+  

---

## 1. Phase purpose

RUI-NAV-00 does not redesign renderers or alter scientific calculations. It creates one authoritative feature inventory and freezes where every existing production capability belongs before any navigation migration begins.

The governing rule for all later RUI-NAV phases is:

> **One capability → one canonical parent → one discoverable path → contextual shortcuts may point to it, but must not create duplicate feature islands.**

No scientific value, source identity, QC meaning, materialization state, timestamp, depth, comparison method, anomaly threshold, provenance field, or renderer contract is changed by this phase.

---

## 2. Bootstrap evidence at phase start

The repository was re-read before writing this contract.

- Production branch: `main`.
- Production baseline at phase start: `276bc71cc8fd8a7f664c43f8d4262e854b5d4995`.
- Baseline commit: **Merge public scroll ownership acceptance hardening**.
- Exact-main CI observed green for:
  - `tests`;
  - `final-mvp`;
  - `deploy-oceantwin-pages`.
- 3DB-00, 3DB-01 and 3DB-02 are represented on current `main`; 3DB-02 is already merged.
- RUI-02 PR #133 remains open and is not production truth yet.
- No pre-existing RUI-NAV implementation or hierarchy-freeze document existed on `main` before this phase.

### Open RUI-02 dependency

PR #133 moves shared scientific context out of `AppNavigation` and into workspace-owned context chrome through `ScientificContextHeader` / `WorkspaceContextHost` and related acceptance coverage.

That direction is compatible with the RUI-NAV hierarchy because:

- navigation should own feature hierarchy and discoverability;
- scientific context should remain workspace/context owned;
- the existing shared scientific-context runtime remains the single scientific context source of truth.

RUI-NAV-01+ must therefore **reconcile with and preserve valid RUI-02 work if/when it lands**, rather than reintroducing scientific context into the navigation tree.

---

## 3. Ownership reconciliation

The historical RUI master contract assigned primary information architecture to RUI. This RUI-NAV workstream supersedes that narrow ownership assignment while retaining valid RUI implementation already on `main`.

### 3DB owns scientific truth

3DB remains authoritative for:

- verified and source-backed values;
- immutable GLORYS baseline truth;
- source identity and source-backed materialization;
- pilot/materialized/planned distinctions;
- fail-closed block activation eligibility;
- scientific renderer/data payload contracts;
- QC semantics;
- comparison and anomaly scientific meaning;
- canonical provenance and evidence limitations.

### RUI-NAV owns navigation structure

RUI-NAV owns:

- root navigation groups;
- feature directory hierarchy;
- sidebar tree organization;
- breadcrumbs;
- workspace landing/directory states;
- contextual placement of controls;
- cross-feature discoverability;
- duplicate/orphan removal;
- navigation-driven scroll ownership;
- navigation-driven pointer/focus behavior;
- first-time judge discoverability.

### RUI owns visual shell presentation

RUI remains authoritative for:

- visual shell treatment;
- glassmorphism/theme presentation;
- spacing and visual hierarchy;
- responsive presentation mechanics;
- animation and polish;
- final interaction appearance.

### Shared-seam rule

When a RUI-NAV change touches `App.tsx`, `AppNavigation.tsx`, route definitions, shared context, renderers, or science-facing pages:

1. preserve current scientific calls and payload semantics;
2. preserve valid RUI shell behavior;
3. prefer re-parenting and composition over rewrites;
4. add regression coverage for moved interactions;
5. never downgrade source-backed truth to a UI-only approximation.

---

## 4. Frozen root information architecture

```text
OCEAN CANVAS
├── EXPLORE
│   └── 3D Explorer
├── ANALYSE
│   ├── Telemetry
│   ├── Model vs Observation
│   └── Anomaly Screening
├── DATA
│   └── Data Lab
└── SCIENCE
    └── Science System
```

### Route compatibility

Current route ids may remain initially for compatibility:

- `explore`
- `telemetry`
- `compare`
- `anomaly`
- `data-lab`
- `about`

RUI-NAV may present `about` as **SCIENCE → Science System** without breaking old hashes/deep links. Route-id migration is not required for RUI-NAV-00.

---

## 5. Global shell inventory

| Existing capability | Current implementation | Canonical future location | Disposition | Primary problem | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| Ocean Canvas identity + Argo Compass logo | `App.tsx` | Global Shell / Identity | KEEP | Correct global identity | None | NAV-01 |
| Present demo | `App.tsx` + `PresentationGuide` | Guided Journey | MOVE | Header-global feature not represented in hierarchy | High: demo steps must remain truthful | NAV-08 |
| Explorer / Analysis Split / Presentation switcher | `App.tsx` | 3D Explorer / Workspace / Layout | CONTEXTUALIZE | Explorer-only control occupies global header | Medium | NAV-02, NAV-09 |
| ACTIVE FIELD / PAGE status | `App.tsx` | Breadcrumb/context chrome | MERGE | Duplicates context shown elsewhere | High | NAV-01, NAV-09 |
| MODEL status | `App.tsx` | Active scientific context | MERGE | Duplicates source/context panels | Critical | NAV-09 |
| Hide controls / Controls | `App.tsx` | Active feature contextual controls | KEEP | Correct action, wrong prominence | Low | NAV-09 |
| Focus 3D / Show panels | `App.tsx` | 3D Explorer / Workspace / Focus | KEEP | Core visualization action | Low | NAV-02, NAV-10 |
| Sources & QC | `App.tsx` + `ProvenanceDrawer` | Science System with contextual shortcut | MOVE | Provenance duplicated across features | Critical | NAV-07, NAV-09 |
| VERIFIED SNAPSHOT / DEGRADED MODE | `App.tsx` | Science System / System Health + compact global status | CONTEXTUALIZE | Detailed truth and compact status are mixed | Critical | NAV-07, NAV-09 |
| Light/Dark theme | `App.tsx` | Global Utilities / Appearance | KEEP | Correct global utility | None | NAV-01, NAV-11 |
| Workspace sidebar groups | `AppNavigation.tsx` | Frozen root tree | REBUILD | Only route-level selection; no child hierarchy or breadcrumbs | None | NAV-01 |
| ScientificContextBar in navigation | `AppNavigation.tsx` | Workspace scientific-context chrome | MOVE | Navigation mixes hierarchy with scientific state | Critical | NAV-01, NAV-09; coordinate with RUI-02 |
| ProvenanceDrawer | `ProvenanceDrawer.tsx` | Science System / Provenance + QC | MERGE | Same facts repeat in Info/Compare/Explorer | Critical | NAV-07, NAV-12 |

---

## 6. 3D Explorer — frozen canonical hierarchy

```text
3D Explorer
├── Overview
├── Workspace
│   ├── Geographic View
│   └── Water Column 3D
├── Block System
│   ├── Indian Ocean Block Engine
│   ├── Arabian Sea 3D Atlas
│   ├── Active Main Block
│   ├── Block Selector
│   └── Planned / Verified State
├── Scene Controls
│   ├── Guided / replay journey
│   ├── Enter Water Column 3D
│   ├── Inspect points / profiles
│   ├── Study Region
│   ├── Global View
│   ├── Zoom In
│   ├── Zoom Out
│   └── Camera / Perspective
├── Variables
│   ├── Temperature
│   ├── Salinity
│   ├── Currents
│   └── Chlorophyll
├── Display Range
│   ├── Minimum
│   ├── Maximum
│   ├── Colour Scale
│   ├── Palette
│   └── Units / rendered-sample context
├── Depth & Section
│   ├── Depth Plane
│   ├── Exact Depth
│   ├── Depth Zones
│   ├── Nadir
│   ├── Perspective
│   ├── Cross-section
│   └── Basin
├── Time
│   ├── Native Timestamp
│   ├── Timeline
│   ├── Play / Pause
│   └── Playback Speed
├── Observations
│   ├── Sensor Profiles
│   ├── Active Argo
│   ├── Imported / Verified Profiles
│   └── Profile Context
├── Render Quality
│   ├── High-res Auto
│   └── Offline / Fallback State
└── Context & Info
    ├── Active Scientific Source
    ├── Model / Product
    ├── Planned / Verified Target
    ├── Coordinates / Bounds
    └── Provenance / QC Shortcut
```

### 3D Explorer feature inventory

| Existing capability | Current implementation | Canonical parent | Disposition | Fragmentation / risk | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| GLORYS baseline / INCOIS multi-time / INCOIS chlorophyll | `SourceWorkbench.tsx` | Context & Info / Active Scientific Source | KEEP | Large source island above renderer | Critical | NAV-02, NAV-09 |
| Field overview | `SourceWorkbench.tsx`, `EvidenceRail.tsx` | Overview | MERGE | Multiple entry points to same concept | Critical | NAV-02, NAV-12 |
| Compare observations shortcut | `SourceWorkbench.tsx` | Related Tools → Model vs Observation | KEEP | Valid cross-workspace link | Critical | NAV-08 |
| Data Lab shortcut | `SourceWorkbench.tsx` | Related Tools → Data Lab | KEEP | Valid cross-workspace link | High | NAV-08 |
| Geographic View | `VisualizationDock.tsx`, `OceanGlobe.tsx` | Workspace / Geographic View | KEEP | Core renderer | Critical; pointer/wheel sensitive | NAV-02, NAV-10 |
| Water Column 3D | `VisualizationDock.tsx`, `WaterColumn3D.tsx` | Workspace / Water Column 3D | KEEP | Core renderer | Critical; orbit/pointer sensitive | NAV-02, NAV-10 |
| UTC / Region / Model / Observation context row | `VisualizationDock.tsx` | Context chrome | MERGE | Duplicates source/header/context | Critical | NAV-02, NAV-09, NAV-12 |
| Temperature | `ControlPanel.tsx` | Variables | KEEP | Buried in long panel | Critical | NAV-02 |
| Salinity | `ControlPanel.tsx` | Variables | KEEP | Buried in long panel | Critical | NAV-02 |
| Currents | `ControlPanel.tsx` | Variables | KEEP | Buried in long panel | Critical; no vertical component may be inferred | NAV-02 |
| Chlorophyll | `ControlPanel.tsx` | Variables | KEEP | Surface-only capability must stay explicit | Critical | NAV-02 |
| About active variable | `ControlPanel.tsx` | Variables / Active Variable / Info | CONTEXTUALIZE | Appropriate progressive disclosure | High | NAV-09 |
| Depth slice / 3D field | `ControlPanel.tsx` | Geographic View / Field Mode | CONTEXTUALIZE | Generic View Settings obscures relation | Critical | NAV-02, NAV-09 |
| Point opacity | `ControlPanel.tsx` | Water Column 3D / Display | CONTEXTUALIZE | Relevant only in water-column context | Low | NAV-09 |
| Vertical exaggeration | `ControlPanel.tsx` | Depth & Section / Vertical Display | CONTEXTUALIZE | Must remain clearly display-only | Critical guardrail | NAV-09 |
| Isosurface toggle + value | `ControlPanel.tsx` | Water Column 3D / Isosurface | CONTEXTUALIZE | Relevant only to compatible scalar volumes | Critical | NAV-09 |
| Selected-depth hero | `ControlPanel.tsx` | Depth & Section / Exact Depth | KEEP | Correct capability, oversized permanent panel | Critical | NAV-02 |
| Depth-zone buttons | `ControlPanel.tsx` | Depth & Section / Depth Zones | KEEP | Correct capability | Critical | NAV-02 |
| Nonlinear depth slider | `ControlPanel.tsx` | Depth & Section / Exact Depth | KEEP | Must select genuine source levels | Critical | NAV-02 |
| Timeline scrubber | `TimelineScrubber.tsx` | Time / Timeline | KEEP | Correct source-gated control | Critical | NAV-02 |
| Static one-timestamp state | `ControlPanel.tsx` | Time / Native Timestamp | KEEP | Scientific truth state, not missing feature | Critical | NAV-02 |
| Argo profile selector | `ControlPanel.tsx` | Observations / Active Argo | KEEP | Also selectable from globe; one state must remain authoritative | Critical | NAV-02 |
| Source-status card | `ControlPanel.tsx` | Context & Info / Science System shortcut | MOVE | Repeats source/product/cache status | Critical | NAV-07, NAV-12 |
| Display Range HUD | `ScientificColorbarHud.tsx` | Display Range | MOVE | Powerful feature detached from control hierarchy | High; display-only | NAV-02 |
| Linear/log colour scale | `ScientificColorbarHud.tsx` | Display Range / Colour Scale | KEEP | Contextual | High; cannot mutate data | NAV-02 |
| Palette selector | `ScientificColorbarHud.tsx` | Display Range / Palette | KEEP | Contextual | Low | NAV-02 |
| Min/max display thresholds | `ScientificColorbarHud.tsx` | Display Range / Minimum + Maximum | KEEP | Contextual | High; display-only | NAV-02 |
| Indian Ocean Block Engine launcher | `Phase35MainBlockEngine.tsx` | Block System / Indian Ocean Block Engine | MOVE | Floating island outside Explorer hierarchy | Critical; modal/pointer risk | NAV-02 |
| Block region filter + find | `Phase35MainBlockEngine.tsx` | Block System / Block Selector | KEEP | Correct internal controls | Critical | NAV-02 |
| 140 logical block cells | `Phase35MainBlockEngine.tsx` | Block System / Block Selector | KEEP | One generated control family | Critical | NAV-02 |
| Activate source-backed pilot | `Phase35MainBlockEngine.tsx` | Block System / Active Main Block | KEEP | Must remain fail-closed | Critical | NAV-02 |
| Return to verified baseline | `Phase35MainBlockEngine.tsx` | Block System / Active Main Block | KEEP | Essential recovery path | Critical | NAV-02 |
| Planned/materialized/baseline status | `Phase35MainBlockEngine.tsx` | Block System / Planned / Verified State | KEEP | Trust explanation is core | Critical | NAV-02, NAV-07 |
| Arabian Sea 3D Atlas launcher | `Phase3ArabianAtlas.tsx` | Block System / Arabian Sea 3D Atlas | MOVE | Separate floating feature island | High; modal/pointer risk | NAV-02 |
| Atlas variable selector | `Phase3ArabianAtlas.tsx` | Arabian Sea 3D Atlas | KEEP | Canonical once re-parented | High | NAV-02 |
| 12 verified atlas sector cards | `Phase3ArabianAtlas.tsx` | Arabian Sea 3D Atlas | KEEP | One generated control family | High | NAV-02 |
| Evidence inspector | `EvidenceRail.tsx` | Overview / Context Inspector | MERGE | Duplicated by Field overview pill + source/context cards | Critical | NAV-02, NAV-09, NAV-12 |
| Inspect profile | `EvidenceRail.tsx` | Observations / Profile Context | KEEP | Valid contextual action | Critical | NAV-02 |
| Open comparison | `EvidenceRail.tsx` | Related Tools → Model vs Observation | KEEP | Valid cross-workspace action | Critical | NAV-08 |
| Sources & methodology | `EvidenceRail.tsx` | Science System shortcut | MOVE | Duplicates global provenance entry | Critical | NAV-07, NAV-12 |
| Argo ProfilePanel | `ProfilePanel.tsx` | Observations / Profile Context | CONTEXTUALIZE | Right-side island today | Critical; scroll/focus risk | NAV-02, NAV-09 |
| ImportedObservationPanel | `ImportedObservationPanel.tsx` | Observations / Sensor Profiles | CONTEXTUALIZE | Right-side island today | Critical; scroll/focus risk | NAV-02, NAV-09 |
| Mobile Layer / Time / Depth / Observation / Compare tray | `App.tsx` | Mobile projection of canonical hierarchy | MERGE | Must not become a second independent IA | High | NAV-11, NAV-12 |
| Analysis Split surface | `AnalysisSplitPanel.tsx` | Workspace / Layout / Analysis Split | KEEP | Needs clear parent under Explorer | High | NAV-02 |
| Presentation surface | `App.tsx` | Workspace / Layout / Presentation | KEEP | Needs clear parent under Explorer | Medium | NAV-02, NAV-08 |

### Explorer controls requiring placement validation during NAV-02

The existing renderer implementations may also expose camera/scene actions such as study-region framing, global view, zoom, point/profile inspection, water-column entry, camera/perspective, nadir/cross-section/basin or quality/fallback indicators. NAV-02 must inventory their exact rendered controls again against then-current `main` and place every one under **Scene Controls**, **Depth & Section**, **Render Quality**, or the relevant renderer child. NAV-00 freezes those parent categories now so none remain orphaned later.

---

## 7. Telemetry — frozen canonical hierarchy

```text
Telemetry
├── Overview
├── Time Series
├── Depth Series
├── Sensors
├── Variable Comparison
├── Statistics
└── Export / Evidence
```

| Existing capability | Current implementation | Canonical parent | Disposition | Main problem | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| Telemetry hero + verified-window source card | `TelemetryPage.tsx` | Overview | MERGE | Too much permanent introductory/context bulk | High | NAV-03 |
| 3-card reading guide | `TelemetryPage.tsx` | Overview / Directory Guidance | MERGE | Should guide entry, not remain permanent page bulk | Medium | NAV-03, NAV-08 |
| INCOIS operational panel | `IncoisOperationalPanel.tsx` | Time Series | MOVE | Genuine-time capability buried in long page | Critical | NAV-03 |
| Temperature / Salinity switcher | `TelemetryPage.tsx` | Variable Comparison + contextual control | CONTEXTUALIZE | Repeated variable choice | Critical | NAV-03, NAV-09 |
| Telemetry depth slider | `TelemetryPage.tsx` | Depth Series | CONTEXTUALIZE | Should follow active child | Critical | NAV-03, NAV-09 |
| Genuine timestamp slider | `TelemetryPage.tsx` | Time Series | CONTEXTUALIZE | Must remain disabled when only one native time exists | Critical | NAV-03, NAV-09 |
| Download depth telemetry CSV | `TelemetryPage.tsx` | Export / Evidence | MOVE | Export buried in generic toolbar | High | NAV-03 |
| Depth/time/grid/variable summary metrics | `TelemetryPage.tsx` | Overview | KEEP | Good landing summary | High | NAV-03 |
| Exact-depth ladder | `TelemetryPage.tsx` | Depth Series | KEEP | Core control family | Critical | NAV-03 |
| Mean/P10/P90 depth chart | `TelemetryPage.tsx` | Depth Series | KEEP | Core result | Critical | NAV-03 |
| Selected-depth distribution | `TelemetryPage.tsx` | Statistics | MOVE | Currently stacked without explicit parent | Critical | NAV-03 |
| Current telemetry summary | `TelemetryPage.tsx` | Statistics | MOVE | Needs explicit parent | Critical | NAV-03 |
| Local vertical context / gradient | `TelemetryPage.tsx` | Depth Series | KEEP | Descriptive only; semantics must remain | Critical | NAV-03 |
| Time telemetry chart | `TelemetryPage.tsx` | Time Series | KEEP | Core genuine-time result | Critical | NAV-03 |
| Statistic definition + dataset + DOI | `TelemetryPage.tsx` | Export / Evidence + Science shortcut | MOVE | Trust detail clutters main workflow | Critical | NAV-03, NAV-07 |
| Observation/sensor context | Shared observation components | Sensors | MOVE/MERGE | Sensor capability is not first-class in current Telemetry directory | Critical | NAV-03 |

---

## 8. Model vs Observation — frozen canonical hierarchy

```text
Model vs Observation
├── Overview
├── Observation Sources
├── Matchups
├── Profile Comparison
├── Bias by Depth
├── Metrics
├── QC
└── Evidence
```

| Existing capability | Current implementation | Canonical parent | Disposition | Main problem | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| Hero + diagnostic disclaimer | `ComparisonPage.tsx` | Overview | KEEP | Guardrail must remain visible/inspectable | Critical | NAV-04 |
| Verified Argo profile selector | `ComparisonPage.tsx` | Observation Sources / Matchups context | CONTEXTUALIZE | Embedded in hero | Critical | NAV-04, NAV-09 |
| Matched-level / MAE / RMSE / distance / time-offset / depth metrics | `ComparisonPage.tsx` | Metrics | MOVE | Summary precedes clear workflow hierarchy | Critical | NAV-04 |
| Interactive matched-depth slider | `ComparisonPage.tsx` | Profile Comparison | KEEP | Core workflow | Critical | NAV-04 |
| Argo observed / model interpolated / signed bias / absolute error | `ComparisonPage.tsx` | Profile Comparison | KEEP | Core evidence | Critical | NAV-04 |
| Residual summary | `ComparisonPage.tsx` | Metrics | MOVE | Derived metrics need direct directory location | Critical | NAV-04 |
| Profile comparison chart | `ComparisonPage.tsx` | Profile Comparison | KEEP | Core result | Critical | NAV-04 |
| Model − Observation by depth chart | `ComparisonPage.tsx` | Bias by Depth | KEEP | Core result | Critical | NAV-04 |
| Method + comparison pipeline | `ComparisonPage.tsx` | QC | MOVE | Detailed method belongs under QC | Critical | NAV-04 |
| Collocation mini-map + observation/model-cell context | `ComparisonPage.tsx` | Matchups | MOVE | Clear canonical parent | Critical | NAV-04 |
| Matched-level table | `ComparisonPage.tsx` | Matchups / Evidence | MERGE | Data and downloadable evidence are separated | Critical | NAV-04 |
| Model/observation provenance card | `ComparisonPage.tsx` | Observation Sources + Science System shortcut | MOVE | Duplicates global provenance | Critical | NAV-04, NAV-07, NAV-12 |
| Download comparison CSV | `ComparisonPage.tsx` | Evidence | MOVE | Buried at page bottom | High | NAV-04 |
| Download evidence JSON | `ComparisonPage.tsx` | Evidence | MOVE | Buried at page bottom | High | NAV-04 |
| “Diagnostic, not independent validation” note | `ComparisonPage.tsx` | Overview guardrail + Evidence | KEEP | Scientific interpretation boundary | Critical | NAV-04 |

---

## 9. Anomaly Screening — frozen canonical hierarchy

```text
Anomaly Screening
├── Overview
├── Spatial Anomalies
├── Temporal Anomalies
├── Depth Anomalies
├── Thresholds
├── Detected Flags
└── Explainability
```

**Terminology freeze:** use **Detected Flags**, not “confirmed events.” Statistical flags are not proof of an ocean event, sensor failure, forecast failure, hazard, or operational risk.

| Existing capability | Current implementation | Canonical parent | Disposition | Main problem | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| Hero + interpretation guardrail | `AnomalyPage.tsx` | Overview | KEEP | Truth boundary | Critical | NAV-05 |
| Fixed `|robust z| ≥ 3.5` chip | `AnomalyPage.tsx` | Thresholds + compact context | MOVE | Method visually detached from result hierarchy | Critical | NAV-05 |
| Temperature / Salinity switcher | `AnomalyPage.tsx` | Active anomaly child context | CONTEXTUALIZE | Repeated across results | Critical | NAV-05, NAV-09 |
| Exact model-depth slider | `AnomalyPage.tsx` | Depth Anomalies / context | CONTEXTUALIZE | No direct child navigation currently | Critical | NAV-05, NAV-09 |
| Genuine timestamp slider | `AnomalyPage.tsx` | Temporal Anomalies / context | CONTEXTUALIZE | Must remain locked if evidence is insufficient | Critical | NAV-05, NAV-09 |
| Spatial/residual/profile/temporal summary | `AnomalyPage.tsx` | Overview | KEEP | Good landing summary | Critical | NAV-05 |
| Explainable Flag Inspector | `AnomalyPage.tsx` | Explainability | MOVE | Core feature is not directly discoverable | Critical | NAV-05 |
| Model Cell / Argo Residual switcher | `AnomalyPage.tsx` | Explainability context | KEEP | Valid context switch | Critical | NAV-05 |
| Robust-z orbit + threshold margin | `AnomalyPage.tsx` | Explainability | KEEP | Core explanation | Critical | NAV-05 |
| “Why flagged?” values | `AnomalyPage.tsx` | Explainability | KEEP | Core explanation | Critical | NAV-05 |
| Flagged-cell map | `AnomalyPage.tsx` | Spatial Anomalies | MOVE | Currently an adjacent card without directory parent | Critical | NAV-05 |
| Residual ranks by depth | `AnomalyPage.tsx` | Depth Anomalies | MOVE | Canonical depth result | Critical | NAV-05 |
| Download screening evidence | `AnomalyPage.tsx` | Detected Flags / Evidence action | MOVE | Export buried in context card | High | NAV-05 |
| Model-space extremes table | `AnomalyPage.tsx` | Spatial Anomalies | MOVE | Core result | Critical | NAV-05 |
| Argo residual-outlier table | `AnomalyPage.tsx` | Depth Anomalies / Detected Flags | MERGE | Same flags split across adjacent sections | Critical | NAV-05 |
| Method + threshold card | `AnomalyPage.tsx` | Thresholds | MOVE | Canonical parent | Critical | NAV-05 |
| Temporal screen LOCKED | `AnomalyPage.tsx` | Temporal Anomalies | KEEP | Honest unavailable state | Critical | NAV-05 |
| Interpretation card | `AnomalyPage.tsx` | Explainability | MOVE | Guardrail belongs with explanation | Critical | NAV-05 |

---

## 10. Data Lab — frozen canonical hierarchy

```text
Data Lab
├── Overview
├── Sources
├── Datasets
├── Variables
├── Filters
├── Inspection
├── Downloads
└── Provenance
```

| Existing capability | Current implementation | Canonical parent | Disposition | Main problem | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| Hero + local-processing privacy message | `DataLabPage.tsx` | Overview | KEEP | Should be compact landing context | High privacy/truth | NAV-06 |
| Validate-a-file jump | `DataLabPage.tsx` | Datasets | MOVE | Current scroll jump is long-page navigation | Medium | NAV-06 |
| Official Data Launchpad | `DataLabPage.tsx` | Sources | MOVE | Core source feature lacks directory parent | High | NAV-06 |
| Download import schema | `DataLabPage.tsx` | Downloads + contextual Sources action | MERGE | Duplicate download button appears in multiple places | Medium | NAV-06, NAV-12 |
| Official provider/source cards | `DataLabPage.tsx` | Sources | KEEP | Canonical source catalog | High | NAV-06 |
| Safe Import Path | `DataLabPage.tsx` | Overview / Sources guidance | MERGE | Guidance repeated around validator flow | High | NAV-06, NAV-08 |
| Registered source/protocol adapters | `DataLabPage.tsx` | Sources / Connectors | MOVE | Large technical section in flat page | High | NAV-06 |
| Connector protocol/standards badges | `DataLabPage.tsx` | Sources / Connectors | KEEP | Correct source metadata | High | NAV-06 |
| Provider / OPeNDAP / WMS / WCS links | `DataLabPage.tsx` | Sources / Connectors | KEEP | Correct contextual actions | High | NAV-06 |
| Plugin contracts | `DataLabPage.tsx` | Sources / Connectors / Contracts | KEEP | Technical but valid | High | NAV-06 |
| NetCDF / CSV / TSV / ASCII / JSON picker | `DataLabPage.tsx` | Datasets | KEEP | Core ingestion action | Critical | NAV-06 |
| NetCDF CF inspection | `DataLabPage.tsx` | Inspection | MOVE | Currently below picker in long page | Critical | NAV-06 |
| Validation contract | `DataLabPage.tsx` | Inspection / Validation Rules | MOVE | Core fail-closed contract | Critical | NAV-06 |
| Validation status | `DataLabPage.tsx` | Datasets / Inspection | KEEP | Core state | Critical | NAV-06 |
| Load validated profiles into 3D Explorer | `DataLabPage.tsx` | Datasets / Related Tools | KEEP | Valid cross-feature action | Critical | NAV-06, NAV-08 |
| Download validation report | `DataLabPage.tsx` | Downloads | MOVE | Buried in status row | High | NAV-06 |
| Clear dataset | `DataLabPage.tsx` | Datasets contextual action | KEEP | Correct local action | Medium | NAV-06 |
| Row/valid/invalid/variable/time/warning metrics | `DataLabPage.tsx` | Overview / Inspection | MERGE | Summary split from findings | High | NAV-06 |
| Validation findings | `DataLabPage.tsx` | Inspection | KEEP | Core result | Critical | NAV-06 |
| Spatial/time coverage | `DataLabPage.tsx` | Filters / Inspection | MOVE | Coverage doubles as dataset scoping information | High | NAV-06 |
| Required-field missingness | `DataLabPage.tsx` | Inspection | KEEP | Data-quality result | Critical | NAV-06 |
| Validated variable summaries | `DataLabPage.tsx` | Variables | MOVE | Core variable child | High | NAV-06 |
| Validated-row preview | `DataLabPage.tsx` | Inspection | MOVE | Core inspection child | High | NAV-06 |
| Source / dataset provenance preserved in validation output | `DataLabPage.tsx` | Provenance | MOVE | Provenance is implicit instead of first-class | Critical | NAV-06, NAV-07 |

### Data Lab Filters contract

The current page does not yet expose a standalone universal filtering workbench. **Filters** is frozen as a canonical child for source/dataset/variable/spatial/time/depth selection controls that already exist or are introduced by safe re-parenting in NAV-06. It must not create synthetic data, unsupported server queries, or fake remote filtering capability.

---

## 11. Science System — frozen canonical hierarchy

```text
Science System
├── Overview
├── Scientific Context
├── Data Provenance
├── Quality Control
├── Source Integrity
├── Architecture
├── System Health
├── Capabilities
├── Limitations
└── Demo / Verification Guide
```

| Existing capability | Current implementation | Canonical parent | Disposition | Main problem | Science sensitivity | Target phase |
|---|---|---|---|---|---|---|
| Science & System hero | `InfoPage.tsx` | Overview | KEEP | Route label should become Science System | High | NAV-07 |
| Evidence ladder | `InfoPage.tsx` | Scientific Context | MOVE | Good concept, currently part of long document | Critical | NAV-07 |
| Problem / response cards | `InfoPage.tsx` | Overview | MERGE | Useful orientation, not separate feature | Low | NAV-07 |
| Capability grid | `InfoPage.tsx` | Capabilities | MOVE | Needs direct directory path | High | NAV-07 |
| End-to-end architecture pipeline | `InfoPage.tsx` | Architecture | MOVE | Needs direct directory path | High | NAV-07 |
| Model evidence card | `InfoPage.tsx` | Data Provenance | MOVE | Duplicates ProvenanceDrawer | Critical | NAV-07, NAV-12 |
| Observation evidence card | `InfoPage.tsx` | Data Provenance | MOVE | Duplicates Compare/ProvenanceDrawer | Critical | NAV-07, NAV-12 |
| Scientific integrity contract | `InfoPage.tsx` | Source Integrity | MOVE | Core trust feature | Critical | NAV-07 |
| No synthetic timestamps | `InfoPage.tsx` | Limitations / Source Integrity | KEEP | Non-negotiable truth | Critical | NAV-07 |
| Depth-sign contract | `InfoPage.tsx` | Scientific Context / Limitations | KEEP | Non-negotiable truth | Critical | NAV-07 |
| Anomaly interpretation boundary | `InfoPage.tsx` | Limitations | KEEP | Non-negotiable truth | Critical | NAV-07 |
| Comparison validation boundary | `InfoPage.tsx` | Limitations | KEEP | Non-negotiable truth | Critical | NAV-07 |
| Recommended demo flow | `InfoPage.tsx` | Demo / Verification Guide | MOVE | Should be directly discoverable | High | NAV-07, NAV-08 |
| Current evidence boundary / scientific disclaimer | `InfoPage.tsx` | Limitations | KEEP | Canonical limitation | Critical | NAV-07 |
| Model source metadata | `ProvenanceDrawer.tsx` | Data Provenance | MERGE | Duplicated in multiple pages | Critical | NAV-07, NAV-12 |
| Observation source metadata | `ProvenanceDrawer.tsx` | Data Provenance | MERGE | Duplicated in multiple pages | Critical | NAV-07, NAV-12 |
| Comparison method | `ProvenanceDrawer.tsx` | Quality Control | MERGE | Duplicates Compare method | Critical | NAV-07, NAV-12 |
| Integrity checksums + “no synthetic measurements” | `ProvenanceDrawer.tsx` | Source Integrity | MERGE | Important but isolated in drawer | Critical | NAV-07, NAV-12 |
| Degraded-source warning state | `App.tsx` | System Health | MOVE | Detailed health not centrally discoverable | Critical | NAV-07 |

---

## 12. Guided discoverability inventory

These are not new scientific capabilities; they are navigation aids that must point to canonical features.

| Existing guide/action | Current location | Future role | Target |
|---|---|---|---|
| `PresentationGuide` demo sequence | Global header | Guided Journey overlay connected to canonical tree nodes | NAV-08 |
| Telemetry reading guide | Telemetry page | Directory “start here” guidance | NAV-08 |
| SourceWorkbench workflow actions | Explorer | Related-feature links | NAV-08 |
| EvidenceRail compare/source actions | Explorer | Contextual next actions | NAV-08 |
| Data Lab safe-import path | Data Lab | Guided import journey | NAV-08 |
| InfoPage recommended demo flow | Science System | Judge/demo verification guide | NAV-08 |

Guided navigation must never create a second version of a feature. It only opens or highlights the canonical feature location.

---

## 13. Fragmentation and duplicate register

The following duplicate/fragmented concepts are explicitly frozen for later consolidation.

| Concept | Current fragments | Canonical destination | Required treatment |
|---|---|---|---|
| Scientific source/product | Header MODEL, SourceWorkbench, VisualizationDock context, ControlPanel source card, InfoPage, ProvenanceDrawer | Context chrome + Science System / Data Provenance | MERGE, retain compact contextual readout |
| Field overview | SourceWorkbench action, Evidence status pill, EvidenceRail | 3D Explorer / Overview | MERGE |
| Provenance/QC | Header button, EvidenceRail link, ProvenanceDrawer, Compare provenance, Telemetry method, InfoPage evidence cards | Science System + contextual shortcuts | MERGE |
| Scientific-context selection | Sidebar ScientificContextBar, mobile context row, page-level variable/depth/time controls | Workspace context + active child controls | RE-PARENT, never duplicate state store |
| Variable controls | Explorer, Telemetry, Anomaly | Remain feature-specific projections of shared compatible context | CONTEXTUALIZE, preserve shared context continuity |
| Depth controls | Explorer, Telemetry, Anomaly, Compare matched depth | Feature-specific scientific meanings | DO NOT falsely merge semantics; organize under each canonical feature |
| Time controls | Explorer, Telemetry, Anomaly | Native source time | CONTEXTUALIZE, retain source capability locks |
| Argo selection | Explorer, Compare, EvidenceRail/profile panels | Shared selected-profile context | MERGE state, preserve multiple contextual entry points |
| Display settings | ControlPanel “View settings” + ScientificColorbarHud | 3D Explorer / active renderer contextual controls | MERGE placement |
| Block-system access | Indian Ocean Block Engine + Arabian Sea Atlas floating launchers | 3D Explorer / Block System | MOVE |
| Demo guidance | Present demo + InfoPage demo flow + local reading guides | Guided Journey / per-directory guidance | MERGE navigation logic |
| Data Lab schema download | Launchpad + validator | Data Lab / Downloads with contextual shortcut | MERGE |
| Science limitations | InfoPage + Compare note + Anomaly note + ControlPanel microcopy | Canonical Science System limitations plus local guardrails | MERGE source text carefully; local safety guardrails stay visible |

---

## 14. Orphan check

RUI-NAV-00 freezes the following rule for NAV-01 through NAV-12:

- No existing permanent user-facing feature may disappear solely because it does not fit the new shell.
- Every feature must be classified as **KEEP**, **MOVE**, **MERGE**, **CONTEXTUALIZE**, or **DELETE WITH EVIDENCE**.
- `DELETE` is allowed only for a proven duplicate wrapper or dead placeholder after its functionality is preserved elsewhere.
- Scientific unavailable/locked states are not placeholders and must not be deleted merely to make the UI look complete.
- Floating launchers, long-page jump links, and duplicate cards are migration candidates, not evidence that the underlying capability should be removed.

The inventory above gives every currently identified production capability a canonical destination. NAV-02 through NAV-07 must re-read current source before implementation to catch capabilities added by intervening merges.

---

## 15. Contextual control architecture freeze

NAV-09 will implement the following rule:

1. **Global controls** appear globally only if their effect is genuinely application-wide.
2. **Workspace controls** appear at the workspace level only if they affect multiple children.
3. **Feature controls** appear only when their feature is active.
4. **Renderer controls** appear only when their renderer/mode supports them.
5. **Source-limited controls** expose a truthful disabled/unavailable reason.
6. A contextual shortcut may open a canonical feature, but may not clone its state or implementation.

Examples:

- colour range is contextual to the active rendered variable;
- isosurface controls appear only for compatible scalar 3D data;
- chlorophyll cannot expose water-column depth controls;
- a one-time GLORYS source cannot expose fake playback;
- planned blocks cannot expose a scientific activation action;
- provenance can be opened contextually but remains canonically owned by Science System.

---

## 16. Scroll / pointer ownership freeze

NAV-10 will harden interaction using these frozen ownership rules.

### Workstation shell

- The document must not become an accidental scroll owner for fixed workstation surfaces.
- Long analytical/directory content may have one explicit scroll owner.
- Nested tables, lists, drawers and dialogs may scroll internally only when visibly bounded.

### 3D renderers

- Wheel/pointer gestures inside the active globe/water-column canvas belong to the renderer unless an explicit UI control has captured them.
- Overlay panels must not leave invisible hit areas over the renderer when closed.
- Mobile drawers/backdrops must be inert or removed from hit testing when closed.

### Navigation

- Opening navigation must not trap scrolling in hidden layers.
- Breadcrumbs and tree nodes must not intercept drag/orbit gestures outside their visible bounds.
- Focus restoration is required after temporary navigation/dialog surfaces close when practical.

These are interaction ownership rules, not renderer algorithm changes.

---

## 17. Accessibility / responsive freeze

NAV-11 must preserve:

- keyboard-accessible root and child navigation;
- visible focus;
- `aria-current` for the active location;
- semantic tree/directory/breadcrumb names where appropriate;
- no hover-only access to essential features;
- no horizontal document overflow at supported mobile widths;
- touch-safe controls;
- Escape handling for temporary drawers/dialogs;
- reduced-motion compatibility;
- readable scientific truth in both themes;
- mobile projection of the same canonical IA, not a separate mobile-only feature hierarchy.

---

## 18. Frozen migration sequence

| Phase | Frozen responsibility | Completion result |
|---|---|---|
| NAV-00 | Inventory every feature and freeze hierarchy | Nothing orphaned; canonical parents defined |
| NAV-01 | Build common file-manager navigation shell | Tree + breadcrumbs + directory views |
| NAV-02 | Consolidate 3D Explorer | Floating/fragmented Explorer capabilities have canonical homes |
| NAV-03 | Migrate Telemetry | Judge can discover depth/time/sensor/statistics tools |
| NAV-04 | Migrate Model vs Observation | Source → matchup → profile → bias → QC → evidence is obvious |
| NAV-05 | Migrate Anomaly Screening | Detect → locate → threshold → explain is obvious |
| NAV-06 | Migrate Data Lab | Source → dataset → inspect → variables → download/provenance is obvious |
| NAV-07 | Migrate Science System | Provenance/QC/integrity/architecture/limits centralized |
| NAV-08 | Guided Discoverability | First-time users receive truthful next-action guidance |
| NAV-09 | Contextual Control Architecture | Giant static control panels are replaced by active-context controls |
| NAV-10 | Scroll / Pointer / Interaction Hardening | No trapped scrolling, invisible blockers or renderer gesture theft |
| NAV-11 | Responsive + Accessibility | Desktop/mobile/keyboard share one coherent IA |
| NAV-12 | Fragmentation Purge | No orphan or duplicate UI remains |
| NAV-13 | Judge Journey Validation | App is navigable without verbal explanation |
| NAV-14 | Production Integration | Merge → exact-main CI → deploy → HTTPS → live Chromium → VERIFIED |

---

## 19. NAV-00 acceptance criteria

RUI-NAV-00 is complete only when all of the following are true:

1. Latest `main` was verified before work.
2. Open RUI/3DB work was checked and ownership conflicts recorded.
3. Exact-main CI/deployment state was verified.
4. Existing RUI master ownership was reconciled with the RUI-NAV workstream.
5. Root hierarchy is frozen.
6. 3D Explorer canonical hierarchy is frozen.
7. Telemetry canonical hierarchy is frozen.
8. Model vs Observation canonical hierarchy is frozen.
9. Anomaly Screening canonical hierarchy is frozen.
10. Data Lab canonical hierarchy is frozen.
11. Science System canonical hierarchy is frozen.
12. Cross-feature duplicate concepts have one canonical destination.
13. Contextual controls, scroll ownership and responsive/accessibility rules are frozen.
14. No runtime scientific code is changed in NAV-00.
15. The NAV-00 documentation is merged to current `main` without overwriting newer work.
16. Exact merged `main` passes required CI and Pages deployment.
17. Public HTTPS/live smoke verification confirms the production app remains reachable after the documentation-only release.
18. A final race check confirms reported `main` still contains the NAV-00 merge.

---

## 20. Phase boundary

RUI-NAV-00 authorizes **navigation planning only**. It does not authorize runtime hierarchy migration.

The first runtime implementation step is **RUI-NAV-01 — File-Manager Navigation Shell**, and it must begin by re-reading the then-current `main`, including any RUI-02/3DB work merged after this baseline.

Until NAV-01 lands, the production UI is expected to retain its current route-level sidebar and existing feature placement.

---

## 21. Frozen decision log

- **D1:** Root groups are EXPLORE / ANALYSE / DATA / SCIENCE.
- **D2:** Science & System is presented canonically as **Science System**; compatibility hashes may remain unchanged.
- **D3:** Scientific context is not a child of navigation; navigation links to context-sensitive workspaces while shared scientific state remains independently authoritative.
- **D4:** Indian Ocean Block Engine and Arabian Sea 3D Atlas are children of 3D Explorer → Block System, not floating peer products.
- **D5:** Display Range is a first-class Explorer child, not an unrelated HUD island.
- **D6:** Provenance/QC has one canonical home in Science System with contextual shortcuts from scientific workspaces.
- **D7:** Anomaly language uses “Detected Flags”; no UI may imply statistical flags are confirmed events.
- **D8:** Native-time/depth/source limits remain visible and fail closed.
- **D9:** Mobile uses the same hierarchy as desktop.
- **D10:** Later phases may improve presentation and placement but must not silently change this hierarchy without an explicit documented superseding decision.
