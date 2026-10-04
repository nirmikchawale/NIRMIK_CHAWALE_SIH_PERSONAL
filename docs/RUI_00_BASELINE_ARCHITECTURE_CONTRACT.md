# RUI-00 — Baseline Freeze & UI Architecture Contract

**Project:** Ocean Canvas · SIH26067 · The Optimizers  
**Phase:** RUI-00  
**Freeze date:** 2026-10-04  
**Authoritative source baseline:** `c50004a4faf286a7027a199685e6a1b6236e30ce`  
**Baseline tree:** `9502aebf50e783ffefe0c23c8fa342e943b4d8fa`  
**Production branch:** `main`  
**Public deployment:** `https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore`  
**RUI branch:** `rui/rui-00-baseline-architecture-contract`

## 1. Purpose

RUI-00 freezes the current judge-facing UI architecture before the complete responsive UI restructure begins.

This phase deliberately does **not** redesign production layout. It records what exists, identifies the safe seams for migration, defines ownership and architectural contracts, and supplies a reusable execution contract for RUI-01 through RUI-15.

Expected live visual delta for RUI-00: **none**.

The success condition is that the documentation lands through the normal production pipeline while the public application continues to pass its existing live browser and scientific-artifact acceptance checks.

## 2. Source authority used for this audit

The audit is source-first. The frozen baseline is the exact `main` commit above, not an older screenshot, remembered architecture, or prior planning document.

Primary inspected implementation surfaces include:

- `frontend/src/App.tsx`
- `frontend/src/navigation.ts`
- `frontend/src/components/AppNavigation.tsx`
- `frontend/src/components/ScientificContextBar.tsx`
- `frontend/src/components/ControlPanel.tsx`
- `frontend/src/components/EvidenceRail.tsx`
- `frontend/src/components/VisualizationDock.tsx`
- `frontend/src/components/ProfilePanel.tsx`
- `frontend/src/components/ImportedObservationPanel.tsx`
- `frontend/src/components/ProvenanceDrawer.tsx`
- `frontend/src/components/OceanGlobe.tsx`
- `frontend/src/components/WaterColumn3D.tsx`
- `frontend/src/pages/TelemetryPage.tsx`
- `frontend/src/pages/ComparisonPage.tsx`
- `frontend/src/pages/AnomalyPage.tsx`
- `frontend/src/pages/DataLabPage.tsx`
- `frontend/src/pages/InfoPage.tsx`
- `frontend/src/scientific-context-runtime.ts`
- `frontend/src/workbench.css`
- related responsive/glass/scroll stylesheets and Playwright suites
- `.github/workflows/final-mvp.yml`
- `.github/workflows/deploy-pages.yml`

## 3. Current route/workspace inventory

The route model currently exposes six judge-facing workspaces:

| Route id | Current label | Current component | Target group |
|---|---|---|---|
| `explore` | 3D Explorer | Explorer composition inside `App.tsx` | EXPLORE |
| `telemetry` | Telemetry | `TelemetryPage` | ANALYSE |
| `compare` | Model vs Observation | `ComparisonPage` | ANALYSE |
| `anomaly` | Anomaly Screening | `AnomalyPage` | ANALYSE |
| `data-lab` | Data Lab | `DataLabPage` | DATA |
| `about` | Science & System | `InfoPage` | EVIDENCE |

The existing navigation groups are:

- EXPLORE → Explorer
- ANALYSIS → Telemetry, Compare, Anomaly
- EVIDENCE → Data Lab, Science & System

RUI target grouping changes only the information architecture:

- EXPLORE → 3D Explorer
- ANALYSE → Telemetry, Model ↔ Observation, Anomaly Screening
- DATA → Data Lab
- EVIDENCE → Science & System

No route id needs to change simply to achieve the target grouping.

## 4. Current shell composition

At the frozen baseline, `App.tsx` is both the application orchestrator and a large part of the view composition.

It owns or coordinates:

- global header,
- brand/logo dialog,
- route state,
- theme state,
- presentation guide state,
- Explorer workspace mode,
- control-dock state,
- evidence-inspector state,
- provenance drawer state,
- mobile-sheet state,
- profile panel state,
- Explorer source mode,
- variable/depth/time/visualization state,
- color scale/palette state,
- scientific loading/error state,
- imported observation state,
- Cesium globe rendering,
- water-column rendering,
- profile/evidence panels,
- non-Explorer route composition,
- and the global science footer.

This central ownership is functional but makes it difficult to replace the shell without risking unrelated science and renderer behavior.

### Current top-level structure

```text
App
├── app-header
│   ├── brand/logo
│   ├── refresh
│   ├── presentation guide
│   ├── Explorer workspace-mode switcher
│   ├── active field/page metadata
│   ├── model metadata
│   ├── Explorer quick actions
│   ├── verified/degraded status
│   └── theme switch
├── workspace-frame
│   ├── AppNavigation
│   │   ├── route buttons
│   │   └── ScientificContextBar
│   └── workspace
│       ├── selected workspace
│       └── ProvenanceDrawer
├── transient loading/error toast
└── science-footer
```

### Explorer composition

```text
Explorer workspace
├── SourceWorkbench
├── EvidenceRail
├── ControlPanel
├── VisualizationDock
├── VisualizationStage
│   ├── OceanGlobe
│   └── WaterColumn3D
├── ScientificColorbarHud
├── AnalysisSplitPanel
├── ProfilePanel / ImportedObservationPanel
└── mobile quick-control tray
```

The renderer surfaces are already substantive. RUI should move and reframe their controls before considering renderer rewrites.

## 5. Current shared scientific-context behavior

The frozen application already contains a cross-workspace scientific-context runtime. RUI must preserve it.

The current context system carries compatible selection state such as:

- main scientific block identity,
- block materialization state,
- block region,
- source mode,
- variable,
- depth index and physical depth,
- native timestamp / time index / time kind,
- selected profile id,
- and origin workspace.

Telemetry and Anomaly initialize from shared context and publish compatible context as their selections change. Compare profile selection is bridged back into the shared context. The context UI can also generate a deep link and open the current context in Explorer.

**Architecture rule:** RUI must not create a second global science-selection store merely to support the new layout. The existing runtime is the continuity layer unless a later dedicated state-management migration proves necessary.

## 6. Current scroll and viewport ownership

### Explorer

The desktop workbench already treats the visualization area as a clipped application viewport. Explorer controls/panels are absolutely or fixed positioned over/around that viewport depending on breakpoint.

The current workbench stylesheet places a persistent visualization dock above the visualization stage and uses overlay side panels for Explorer controls/evidence/profile surfaces.

### Non-Explorer workspaces

`App.tsx` contains explicit wheel handling for non-Explorer routes. It preserves nested scrollable regions when possible; otherwise it manually advances `document.scrollingElement`.

This is evidence that the document is currently part of the scroll architecture for operational workspaces.

**Target contract:** after shell migration, workstation routes should have one intentional scroll owner. Long workspaces may scroll inside `WorkspaceViewport`, but document scrolling should no longer be an accidental fallback behavior on desktop.

## 7. Current responsive panel behavior

The existing CSS already contains useful responsive mechanics that should be reused conceptually:

- desktop Explorer controls are an overlay panel;
- the control dock can be closed;
- mobile control panel becomes a fixed off-canvas sheet;
- mobile profile panel becomes a fixed right-side sheet;
- evidence rail becomes a mobile fixed panel;
- mobile quick controls expose layer, time, depth, observation, and compare actions.

RUI should consolidate these into one predictable panel/inspector framework rather than keep multiple independent positioning systems.

## 8. Current page-content diagnosis

The following observations describe information architecture, not scientific quality.

### 8.1 3D Explorer

**Strengths**

- substantive Cesium globe;
- substantive Water Column 3D renderer;
- real source/variable/depth/time controls;
- observation/profile selection;
- evidence/provenance inspection;
- color controls;
- geographic ↔ water-column mode;
- analysis split and presentation mode;
- mobile quick-control tray.

**UI debt**

- header, navigation strip, visualization dock, control overlay, evidence rail, profile panel, color HUD, source workbench, and global footer compete for limited viewport space;
- global and Explorer-specific actions are mixed in the same header;
- several independent overlay systems exist;
- context is exposed in more than one visual region;
- the persistent dock consumes vertical canvas height;
- compact controls include essential text at very small sizes in parts of the current stylesheet.

### 8.2 Telemetry

**Strengths**

- exact depth selection;
- genuine time selection where available;
- full-column depth ladder;
- full-grid descriptive statistics;
- depth chart;
- selected-depth distribution;
- local vertical-neighborhood diagnostic;
- time telemetry;
- current summary;
- INCOIS operational breadth panel;
- CSV export;
- method/provenance evidence.

**UI debt**

The primary analysis is preceded by a large hero, a three-card reading guide, INCOIS operational content, and a toolbar before the main metrics/plots. The result is scientifically rich but vertically expensive.

The GLORYS genuine-time slider can be disabled when only one timestamp exists; RUI should ensure the unavailability reason is always adjacent/discoverable, not inferred from surrounding prose.

### 8.3 Model ↔ Observation

**Strengths**

- verified profile selector;
- matched-level evidence;
- MAE/RMSE and other diagnostics;
- observation/model collocation context;
- observed vs interpolated profile chart;
- signed-bias chart;
- evidence/provenance export.

**UI debt**

Operational comparison evidence is mixed with explanatory framing that can be made more compact. The selected profile and matched-depth evidence should dominate the first viewport.

### 8.4 Anomaly Screening

**Strengths**

- explicit robust-z method;
- fixed threshold;
- variable/depth/time context;
- spatial and residual screens;
- explainable selected flag;
- actual value/median/MAD/residual evidence;
- spatial constellation/ranking views;
- exported screening evidence;
- clear scientific guardrails.

**UI debt**

The page still follows a long hero → toolbar → metric cards → inspector/context cards → additional grids pattern. RUI should turn the explainable flag inspector into the central task and keep guardrails visible without repeated theory blocks.

The temporal screen is correctly locked when evidence is insufficient; this is the model for future disabled-state explainability.

### 8.5 Data Lab

**Strengths**

- browser-local file handling;
- guarded CSV/TSV/ASCII/JSON validation;
- browser NetCDF/CF inspection;
- required scientific schema checks;
- explicit file/record limits;
- missingness/duplicate/unit/provenance diagnostics;
- temporary observation-profile handoff to Explorer;
- source/protocol adapter registry;
- official-source launchpad;
- validation report download;
- fail-closed behavior.

**UI debt**

The actual task—choose a file and validate it—appears after a hero, trusted-source launchpad, safe-import workflow, and interoperability registry. These are valuable resources but should not force every user through a long preamble before the validator.

### 8.6 Science & System

**Strengths**

This page already contains the natural home for deeper explanation:

- problem framing,
- evidence ladder,
- implemented capabilities,
- end-to-end architecture,
- model evidence,
- observation evidence,
- scientific integrity contract,
- demo flow,
- and provenance/system information.

**UI debt**

It is intentionally information-dense and long. RUI should preserve the evidence but improve scanability, navigation, progressive disclosure, and section hierarchy. Content removed from operational workspaces can migrate here when it adds scientific or system understanding.

## 9. Baseline UI debt inventory

The following issues are frozen as migration targets, not RUI-00 runtime fixes.

| ID | Baseline issue | Risk if changed carelessly | Target phase |
|---|---|---|---|
| IA-01 | Primary nav is a horizontal workbench strip, not target left sidebar | route/judge-flow regression | RUI-01 |
| IA-02 | Data Lab currently grouped under EVIDENCE | navigation expectation mismatch | RUI-01 |
| IA-03 | ScientificContextBar is embedded inside navigation | context/nav coupling | RUI-02 |
| SH-01 | `App.tsx` mixes shell, Explorer, routes, overlays, and scientific state | broad regression blast radius | RUI-01–03 |
| SH-02 | Global header mixes global and Explorer-only actions | clutter and duplicated hierarchy | RUI-01–04 |
| SH-03 | Global science footer permanently consumes shell height | viewport pressure | RUI-01/02 |
| PN-01 | Evidence, provenance, profile, mobile sheets use separate panel systems | overlay conflict | RUI-03 |
| VP-01 | Persistent visualization dock consumes Explorer canvas height | smaller primary visualization | RUI-04 |
| SC-01 | Non-Explorer routes can fall back to document scrolling | inconsistent workstation feel | RUI-01, then per-page phases |
| DN-01 | Operational pages use long hero/explainer/card sequences | high vertical cost | RUI-05–09 |
| ST-01 | Some compact labels reach ~8–10 px in current workbench CSS | readability/accessibility | RUI-12 |
| DS-01 | Disabled/locked-state reason treatment is inconsistent across controls | discoverability | RUI-03–11 |
| CT-01 | Shared science context is valuable but visually heavy inside current nav | risk of losing continuity during redesign | RUI-02/13 |
| RS-01 | Multiple historic CSS systems overlap (`styles`, feature upgrades, workbench, glass, scroll, station) | cascade/regression risk | RUI-01–12 |

## 10. Target shell architecture contract

The migration target is:

```text
AppShell
├── SidebarNavigation
│   ├── Brand
│   ├── EXPLORE
│   ├── ANALYSE
│   ├── DATA
│   ├── EVIDENCE
│   └── Global utilities
├── WorkspaceViewport
│   ├── ScientificContextHeader
│   ├── WorkspaceToolRegion
│   │   ├── PrimaryWorkspaceSurface
│   │   └── OptionalContextDock
│   └── InspectorHost
├── GlobalOverlays
│   ├── dialogs
│   ├── command palette
│   └── transient notifications
└── Responsive mobile dock/drawers
```

### 10.1 Sidebar contract

Desktop:

- persistent left-side workspace navigation;
- expanded and collapsed modes;
- active route unmistakable;
- labels remain available through visible text or accessible tooltip/name in collapsed mode;
- route ids remain stable unless a future phase explicitly changes deep-link behavior;
- Data Lab belongs to DATA;
- Science & System belongs to EVIDENCE.

Mobile/tablet:

- sidebar may transform into compact drawer/dock;
- primary workspace remains immediately recoverable;
- navigation cannot cover the full scientific task unintentionally after a route change.

### 10.2 Scientific context header contract

The shared scientific context moves out of primary route navigation.

The header should answer, compactly and truthfully:

- where am I scientifically?
- which source/block is active?
- which variable?
- which time?
- which depth?
- which profile, when applicable?

Detailed block materialization explanation, deep-link controls, and full context metadata may use progressive disclosure or the inspector.

### 10.3 Workspace tool region contract

The first viewport is for the current task.

Examples:

- Explorer: renderer and active scientific controls;
- Telemetry: selected context + primary depth/time visual analysis;
- Compare: profile selector + matched profile/residual evidence;
- Anomaly: selected flag explanation;
- Data Lab: file validation workflow;
- Science & System: navigable evidence/system document.

Long explanatory content should not precede the primary task unless it is essential to safe interpretation.

### 10.4 Inspector contract

The right inspector is **closed by default**.

Use it for:

- evidence details,
- selected observation/profile details,
- provenance/QC,
- advanced display settings,
- method details,
- source limitations,
- context help,
- and selected anomaly/comparison details where appropriate.

Rules:

- one inspector host, multiple inspector contents;
- opening one inspector mode should not spawn an overlapping second right panel;
- Escape closes transient inspector/drawer state where appropriate;
- closing returns focus to the launching control where practical;
- desktop inspector should reflow/shrink the central region when the task benefits from side-by-side evidence;
- mobile inspector becomes a drawer/sheet;
- default-closed state must not hide a safety-critical interpretation guardrail.

### 10.5 Optional context dock contract

Depth/time/playback controls may use a dock when that improves task efficiency.

The dock must:

- be compact,
- be collapsible or contextual when not needed,
- avoid permanently taking large canvas height,
- clearly distinguish genuine/native time from unavailable or surface-only sources,
- and avoid presenting a disabled slider without a reason.

## 11. Scroll ownership contract

### Desktop workstation routes

- app shell owns the viewport;
- document should not be the routine scroll container;
- each workspace declares its primary internal scroll surface when needed;
- renderer canvases remain size-stable when adjacent panels open;
- nested tables/lists may scroll independently only when clearly intentional.

### Information-heavy workspaces

Data Lab and Science & System may require substantial vertical content. They should scroll inside the central workspace viewport, not force the entire application chrome off-screen.

### Mobile

Mobile may allow page-like scrolling inside the workspace surface if it is the least confusing behavior, but navigation/context controls should remain reachable and safe-area aware.

## 12. Interaction-state contract

All visible controls must resolve to explicit states:

- ready,
- active,
- loading,
- disabled with reason,
- unavailable with reason,
- empty with next action,
- error with recovery where possible,
- or verified/success when evidence supports it.

Specific migration requirements:

- single-timestamp GLORYS controls must state that only one genuine timestamp is available;
- surface-only chlorophyll must state why water-column mode/depth controls are unavailable;
- unsupported source/variable combinations must be explicit;
- planned/non-materialized blocks must not look equivalent to source-backed blocks;
- temporal anomaly screening must remain visibly locked until genuine evidence supports it;
- static-host protocol links that require an API deployment must retain that limitation;
- imported files that fail validation must remain ineligible for downstream analysis.

## 13. Responsive contract

### Wide desktop

- left sidebar visible;
- central task dominant;
- right inspector optional/default closed;
- no unintended document scroll;
- renderer and charts use available width fluidly.

### Compact desktop/tablet landscape

- sidebar may collapse;
- inspector width becomes fluid and capped;
- controls wrap without hiding key state;
- the primary task must remain usable without horizontal page scrolling.

### Tablet portrait/mobile

- sidebar becomes drawer/dock;
- inspector and control panels become sheets;
- safe-area insets respected;
- touch targets remain usable;
- selected scientific context remains understandable without opening several overlays;
- no critical function relies on hover.

## 14. Accessibility contract

Every RUI phase that changes UI must preserve or improve:

- semantic landmarks;
- accessible route/current-page indication;
- meaningful button/select/input labels;
- keyboard traversal;
- visible focus;
- Escape behavior for transient UI;
- focus restoration where practical;
- reduced-motion behavior;
- dark/light contrast;
- non-color-only state communication;
- responsive zoom behavior;
- and readable essential typography.

Essential operational labels should not depend on the baseline’s smallest 8–10 px treatment.

## 15. Visual-system contract

RUI should converge the existing overlapping style layers toward a coherent system without performing an unsafe one-shot CSS rewrite.

Target system properties:

- stable spacing scale;
- readable compact typography;
- consistent control heights;
- limited elevation levels;
- consistent radius/border language;
- theme-safe semantic tokens;
- clear selected/loading/error/locked states;
- translucent/glass surfaces only where they improve spatial awareness;
- reduced decorative card density;
- and no visual treatment that implies stronger scientific certainty than the data supports.

CSS migration should be incremental and verified phase by phase.

## 16. Component ownership / migration seams

### Safe RUI-owned composition surfaces

These are natural RUI targets, though each change still requires regression testing:

- `frontend/src/navigation.ts`
- `frontend/src/components/AppNavigation.tsx`
- `frontend/src/workbench.css`
- shell/layout-focused CSS
- new RUI shell/sidebar/inspector/context-header components
- page composition markup that moves existing scientific widgets without changing their data logic
- browser acceptance specs for layout/navigation/accessibility

### Shared seams — preserve behavior carefully

- `frontend/src/App.tsx`
- `frontend/src/components/ScientificContextBar.tsx`
- `frontend/src/scientific-context-runtime.ts`
- `frontend/src/pages/TelemetryPage.tsx`
- `frontend/src/pages/ComparisonPage.tsx`
- `frontend/src/pages/AnomalyPage.tsx`
- `frontend/src/pages/DataLabPage.tsx`
- `frontend/src/pages/InfoPage.tsx`
- shared frontend scientific types

### Science/data surfaces out of RUI scope by default

- backend scientific calculations;
- data ingestion/fetch scripts;
- generated static evidence payloads;
- current scientific values;
- model/observation interpolation/collocation formulas;
- anomaly formulas;
- main-block materialization logic;
- provider QC interpretation;
- source provenance.

## 17. Planned phase responsibilities

| Phase | Primary responsibility | Must preserve |
|---|---|---|
| RUI-00 | baseline + contracts | all runtime behavior |
| RUI-01 | app shell + left sidebar | routes, deep links, science state |
| RUI-02 | shared scientific context header | context runtime/deep links |
| RUI-03 | unified inspector/panel model | evidence/profile/provenance content |
| RUI-04 | Explorer spatial restructure | Cesium/WaterColumn science and renderer behavior |
| RUI-05 | Telemetry restructure | telemetry calculations/API semantics |
| RUI-06 | Compare restructure | collocation/comparison calculations |
| RUI-07 | Anomaly restructure | robust-z method and guardrails |
| RUI-08 | Data Lab restructure | validation/security/fail-closed behavior |
| RUI-09 | Science & System restructure | provenance/limitations/implemented capability truth |
| RUI-10 | responsive consolidation | desktop behavior + mobile scientific usability |
| RUI-11 | accessibility consolidation | all scientific controls and routes |
| RUI-12 | visual-system/density/theme consolidation | layout semantics and contrast |
| RUI-13 | cross-workspace context + command navigation | shared context correctness |
| RUI-14 | full regression/judge flow | every previous acceptance contract |
| RUI-15 | final polish/release freeze | no speculative feature creep |

## 18. RUI-01 handoff requirements

RUI-01 should begin from the newest `main`, not blindly from the frozen RUI-00 SHA if another project thread has advanced.

Before coding RUI-01:

1. Re-read `main`.
2. Diff any commits newer than the RUI-00 baseline.
3. Preserve new scientific work.
4. Introduce shell primitives with the smallest possible route/render changes.
5. Keep existing Explorer renderers and scientific state in place while moving chrome around them.
6. Add browser acceptance for expanded/collapsed sidebar, route grouping, route continuity, and representative mobile behavior.
7. Do not combine the inspector migration into RUI-01 unless required for a non-overlapping shell foundation.

## 19. RUI-00 acceptance criteria

RUI-00 is accepted only when all applicable conditions are true:

- [x] authoritative `main` SHA frozen before writes;
- [x] six current workspaces inventoried;
- [x] current route grouping recorded;
- [x] current shell composition recorded;
- [x] shared scientific-context behavior recorded;
- [x] scroll ownership recorded;
- [x] responsive panel behavior recorded;
- [x] workspace-specific UI debt recorded;
- [x] target shell contract defined;
- [x] inspector/default-closed contract defined;
- [x] responsive contract defined;
- [x] accessibility contract defined;
- [x] disabled/unavailable-state contract defined;
- [x] parallel-work ownership boundary defined;
- [x] reusable RUI master execution prompt created;
- [ ] branch CI/build regressions passed;
- [ ] PR diff-scope review passed;
- [ ] PR merged to `main`;
- [ ] GitHub Pages deployed exact merge;
- [ ] public live verification passed;
- [ ] live visual delta confirmed as intentionally none.

The unchecked deployment items are execution gates, not documentation claims. They are completed only by repository/workflow evidence after this document is committed.

## 20. Frozen conclusion

Ocean Canvas already contains substantial scientific functionality. The primary RUI problem at this baseline is not missing science; it is that the application chrome, context, panels, explanatory content, and operational controls compete for attention and space.

The redesign therefore follows a **preserve-science / restructure-interaction** strategy:

1. stabilize the shell,
2. extract shared context from navigation,
3. unify inspectors/panels,
4. maximize the primary task surface,
5. restructure each workspace around its actual job,
6. consolidate responsive/accessibility/visual behavior,
7. verify cross-workspace context,
8. then freeze the final judge flow.

RUI-00 changes no scientific values, no algorithms, no generated evidence, no routes, and no production UI behavior. It establishes the contract that future RUI phases must satisfy.
