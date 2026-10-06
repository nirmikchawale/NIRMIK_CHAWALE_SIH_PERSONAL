# Ocean Canvas RUI-VIS-01 — File-Manager Shell Visual Integration

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** RUI visual integration coordinated with RUI-NAV and 3DB  
**Phase:** RUI-VIS-01 — File-Manager Shell Visual Integration  
**Authoritative phase-start `main`:** `2c2f869dd67000e1da067c022fe22b2e9a9507bc` — Merge 3DB-05 Geographic ↔ Water Column Synchronization

## Mission

Visually integrate the already-merged RUI-NAV-01 file-manager navigation shell into one restrained scientific workstation language without changing its canonical information architecture or any scientific/runtime meaning.

RUI-NAV remains authoritative for **where** capabilities live. RUI-VIS-01 owns only **how that frozen shell looks and behaves visually**.

## Production baseline preserved

RUI-VIS-01 starts after all of the following production work and must preserve it:

- RUI-00 baseline/architecture contract;
- RUI-01 App Shell & Left Sidebar Foundation;
- RUI-02 workspace-owned Scientific Context Header;
- RUI-NAV-00 hierarchy freeze;
- RUI-NAV-01 canonical file-manager shell, tree semantics, breadcrumbs and route continuity;
- 3DB-00 through 3DB-05 scientific/materialization/geographic/renderer synchronization contracts;
- the immutable independently model-observation validated baseline distinction;
- source-backed pilot identity and evidence limits;
- planned-block fail-closed behavior;
- native timestamp/depth/coordinate semantics;
- provenance, QC, anomaly and comparison meaning;
- no vertical-current claim and no synthetic science.

## Frozen hierarchy

This phase does not add, remove, rename, re-parent or duplicate navigation nodes:

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

The production route IDs remain unchanged: `explore`, `telemetry`, `compare`, `anomaly`, `data-lab`, `about`.

## Visual changes

RUI-VIS-01 refines the existing shell presentation through the RUI-owned `rui-nav-file-manager.css` layer:

- increases expanded desktop navigation width slightly to improve scanability while retaining a compact collapsed rail;
- establishes restrained surface hierarchy using existing workstation theme tokens rather than introducing a second colour system;
- improves brand, directory and workspace typography to eliminate microscopic shell text;
- turns breadcrumb presentation into compact workstation chrome with safe ellipsis/truncation;
- strengthens active-directory and active-workspace differentiation without relying on colour alone;
- gives workspace targets a consistent 48–50 px operational height;
- improves initials/icon tiles, indentation and selected-state hierarchy;
- keeps collapsed mode intentionally tool-rail-like rather than visually squeezing the expanded layout;
- tunes tablet density while preserving viewport width for science;
- projects the same hierarchy into the mobile drawer with larger close/touch controls and safe-area-aware spacing;
- preserves focus-visible treatment and adds explicit reduced-motion behavior;
- preserves forced-colour/high-contrast operability.

## Scientific Context Header compatibility

The scientific context remains owned by `ScientificContextHeader` / `WorkspaceContextHost`. RUI-VIS-01 does not move scientific state into navigation.

Desktop navigation continues to occupy the first shell grid column while the Scientific Context Header occupies the workspace column. Mobile continues to keep navigation and scientific context in separate shell rows, so closing or opening the navigation drawer does not hide the scientific context contract.

## Accessibility and interaction contract

The phase preserves or strengthens:

- real button targets inside semantic treeitems;
- keyboard focus visibility;
- Escape-to-close mobile navigation;
- focus restoration to the mobile navigation trigger;
- touch targets at or above the existing usable shell baseline;
- readable expanded navigation typography;
- breadcrumb truncation rather than horizontal overflow;
- reduced-motion compliance;
- light/dark theme compatibility;
- no hover-only essential navigation;
- no colour-only active-state dependency: active state also uses border/rail/surface treatment.

## Scope boundary

RUI-VIS-01 deliberately does **not**:

- modify `navigation.ts` or canonical parentage;
- change route/deep-link semantics;
- restructure Explorer or any analysis/data/science workspace;
- introduce a new inspector architecture;
- alter scientific context state ownership;
- edit 3DB data, renderer, materialization or synchronization code;
- modify source values, timestamps, depths, coordinates, units, provenance or QC;
- acquire new data;
- relabel pilots as independently model-observation verified.

Explorer consolidation remains dependent on the corresponding RUI-NAV structural phase rather than being pulled into this visual pass.

## Acceptance criteria

RUI-VIS-01 is complete only when all of the following are true:

1. production hierarchy remains exactly four root directories and six workspace nodes;
2. all six existing route IDs and deep links remain intact;
3. expanded desktop navigation is readable and active workspace/directory state is visually distinct;
4. collapsed desktop navigation remains usable and retains visible workspace initials/icons;
5. tablet presentation preserves hierarchy without excessive viewport loss;
6. mobile drawer preserves hierarchy, breadcrumb context, safe sizing, Escape close and focus restoration;
7. navigation and Scientific Context Header do not overlap or compete for state ownership;
8. breadcrumb content truncates safely without horizontal shell overflow;
9. shell controls preserve visible keyboard focus and reduced-motion behavior;
10. dark and light themes remain usable through existing theme tokens;
11. RUI-NAV-01 browser acceptance remains green without weakening its assertions;
12. 3DB-05 and earlier scientific/materialization tests remain green;
13. TypeScript, production build, science/API/fallback, static-hosted artifact and exhaustive browser acceptance pass;
14. a fresh-main race check is performed immediately before merge;
15. after merge, exact-main `tests`, `final-mvp`, GitHub Pages build/deploy, HTTPS verification and live Chromium judge-flow all pass.

## Validation additions

`frontend/e2e/rui-vis-01-file-manager-visual.spec.ts` adds direct acceptance for:

- expanded desktop visual density;
- active-state differentiation;
- sidebar/Scientific Context Header separation;
- collapsed mode;
- route continuity after collapse/expand;
- tablet density and breadcrumb overflow;
- reduced-motion transition removal;
- mobile drawer dimensions and touch targets;
- mobile Escape/focus recovery;
- mobile scientific-context separation;
- dark/light shell surfaces;
- unchanged six-workspace semantics.

Existing RUI-NAV-01 tests remain authoritative for hierarchy and breadcrumb meaning.

## Rollback

Rollback is a normal revert of the RUI-VIS-01 merge commit. Do not force-reset public `main`.

Because the implementation is visual-layer scoped, reverting it should restore the RUI-NAV-01 structural presentation while leaving RUI-NAV hierarchy, RUI-02 context ownership and 3DB-05 scientific synchronization intact.