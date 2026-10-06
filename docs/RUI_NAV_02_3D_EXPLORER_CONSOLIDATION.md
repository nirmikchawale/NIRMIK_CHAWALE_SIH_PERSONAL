# RUI-NAV-02 — 3D Explorer Consolidation

Status: implementation candidate on `rui-nav-02-explorer-consolidation`

## Purpose

RUI-NAV-02 is the first feature-consolidation phase after the NAV-00 hierarchy freeze and NAV-01 file-manager shell. Its job is structural: every existing 3D Explorer capability must have one canonical, discoverable home without changing scientific truth, renderer values, source eligibility, provenance, QC, materialization, or 3DB lifecycle behavior.

The phase therefore follows the frozen rule:

> one capability → one canonical parent → one discoverable path

Contextual shortcuts may point to a capability, but they must not create a second feature island.

## Production baseline consumed

NAV-02 is built from the production tree containing:

- RUI-NAV-01 file-manager navigation shell;
- RUI-02 workspace-owned scientific context (`ScientificContextHeader` / `WorkspaceContextHost`);
- 3DB-03 geographic main-block ownership;
- 3DB-04 fail-closed Cesium rendering contract;
- 3DB-05 Geographic ↔ Water Column synchronization and canonical baseline/pilot/planned lifecycle identity.

3DB-05 remains authoritative for scientific state. NAV-02 does not change block payload values, coordinate/time/depth validation, materialization state, source-backed eligibility, Water Column fail-closed behavior, current-vector semantics, provenance, or QC.

## Frozen Explorer hierarchy

The canonical 3D Explorer directory is:

1. Overview
2. Workspace
3. Block System
4. Scene Controls
5. Variables
6. Display Range
7. Depth & Section
8. Time
9. Observations
10. Render Quality
11. Context & Info

The browser-visible NAV-02 directory exposes all eleven homes in this order.

## Runtime consolidation

### Feature directory

`ExplorerDirectoryNav` provides the single Explorer-level directory navigator. It points to the existing runtime capability homes rather than cloning their controls:

- **Overview** → the existing Evidence/Ocean Intelligence inspector;
- **Workspace** → the existing Geographic / Water Column visualization dock;
- **Block System** → the consolidated block-system home;
- **Scene Controls** → the existing renderer toolbar (`renderer-tools`);
- **Variables** → `#explore-variables` in `ControlPanel`;
- **Display Range** → the existing `ScientificColorbarHud`;
- **Depth & Section** → `#explore-depth` in `ControlPanel`;
- **Time** → `#explore-time` in `ControlPanel`;
- **Observations** → `#explore-observations` in `ControlPanel`;
- **Render Quality** → the existing renderer imagery/quality control;
- **Context & Info** → the existing `SourceWorkbench` source/context surface.

No duplicate variable, time, depth, observation, renderer, or display-range control is introduced.

### Workspace ownership

The Explorer / Analysis Split / Presentation switcher is no longer a visible global-header feature island. Its canonical visible home is the NAV-02 Explorer directory.

To minimize regression risk, the original App controls and handlers remain mounted as hidden delegation targets. NAV-02 invokes those already-tested controls rather than reimplementing App workspace state. This preserves existing cleanup behavior for focus mode, evidence panels, mobile sheets, control dock state, presentation mode, and renderer mode.

`Focus 3D` is likewise presented from the Explorer directory while delegating to the existing App handler. The existing focus-mode exit remains available because the Explorer directory intentionally disappears while 3D focus mode owns the viewport.

### Block System ownership

Before NAV-02, `Phase35MainBlockEngine` and `Phase3ArabianAtlas` were mounted as global siblings of `App`, and their launchers were fixed floating islands.

NAV-02 moves both engines into one canonical **Block System** surface inside `.station-workspace`:

- Indian Ocean Block Engine;
- Arabian Sea 3D Atlas.

Their scientific internals are not rewritten. Dialogs, manifests, source-backed pilot activation, planned-cell locking, baseline return, atlas sector generation, and native API calls remain the existing implementations.

Launcher positioning is changed from fixed/floating to normal-flow cards only inside the canonical Block System home. Dialog panels remain fixed modal surfaces when opened.

## Safe composition mechanism

`ExplorerConsolidationHost` is mounted next to `App`, but it creates a dedicated NAV-02 portal slot as a direct child of the existing `.station-workspace` and renders the directory and Block System into that slot.

This approach is deliberate:

- `App.tsx` scientific data loading and state transitions remain untouched;
- `ControlPanel`, `OceanGlobe`, `WaterColumn3D`, `VisualizationDock`, evidence, profile and display-range logic remain untouched;
- existing CSS direct-child contracts for the workstation remain intact;
- block engines now render in the actual Explorer workspace DOM instead of as global feature islands;
- workspace/focus actions reuse existing App handlers instead of forking state ownership.

The portal host observes route/workspace/focus state only for presentation and delegation. It does not own scientific state.

## Scientific invariants

NAV-02 must preserve all of the following:

- immutable GLORYS12V1 baseline semantics;
- source-backed pilot vs planned target distinction;
- planned cells cannot become scientific renderer sources;
- 3DB-05 Geographic ↔ Water Column synchronization;
- genuine source coordinates, native timestamps and source depth levels;
- no synthetic scientific measurements, timestamps, coordinates or depths;
- horizontal current semantics only; no vertical component inference;
- chlorophyll surface-only truth remains explicit;
- display min/max, palette and scale remain display controls only;
- RUI-02 scientific context remains workspace-owned and outside the file-manager navigation tree;
- provenance/QC/source metadata remain authoritative and unchanged.

## Responsive and accessibility contract

- The eleven-directory navigator is horizontally scrollable where needed and becomes a stacked layout on narrower screens.
- Workspace mode controls remain a labelled `role="group"`.
- Block System launchers remain real buttons with their existing test IDs and dialog semantics.
- Existing mobile Explorer tray behavior is not replaced in NAV-02; NAV-11/NAV-12 retain ownership of broader mobile and progressive-disclosure redesign.
- Focus-visible treatment uses the existing workstation focus system.

## Regression and acceptance gates

NAV-02 is not complete until all of the following are true on the exact branch head and again on the exact merge commit:

1. TypeScript / React / Cesium build succeeds.
2. Existing scientific API/fallback suite succeeds.
3. Existing 3DB-03/04/05 browser coverage succeeds.
4. Existing NAV-01 file-manager coverage succeeds.
5. NAV-02 browser acceptance confirms all eleven Explorer homes.
6. Workspace mode changes still use production App behavior.
7. Both block tools are visible inside the canonical Block System and no longer fixed launchers.
8. Both block dialogs still open and preserve their existing runtime contracts.
9. Mobile Explorer retains directory and Block System access.
10. GitHub Pages build/deploy succeeds.
11. Public HTTPS verification succeeds.
12. Live Chromium judge-flow succeeds.

## Explicitly deferred

NAV-02 does **not** implement later-phase ownership:

- Telemetry consolidation (NAV-03);
- Model vs Observation consolidation (NAV-04);
- Anomaly Screening consolidation (NAV-05);
- Data Lab consolidation (NAV-06);
- Science System consolidation (NAV-07);
- judge-mode / presentation simplification beyond moving its workspace entry (NAV-08);
- full contextual-control normalization across every workspace (NAV-09);
- scroll/pointer ownership rewrite (NAV-10);
- mobile redesign (NAV-11);
- progressive disclosure pass (NAV-12);
- cross-page duplication cleanup (NAV-13);
- final regression/hardening (NAV-14).

## Completion rule

RUI-NAV-02 may be marked **COMPLETE / MERGED / DEPLOYED / LIVE / VERIFIED** only after exact-head CI is green, a fresh-main race check passes, the PR is merged without dropping concurrent 3DB/RUI work, and exact-main tests + final-MVP + Pages + live Chromium verification all finish successfully.
