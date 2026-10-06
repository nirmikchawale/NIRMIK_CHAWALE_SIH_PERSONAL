# Ocean Canvas RUI-NAV-01 — File-Manager Navigation Shell

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** RUI-NAV — Navigation, Information Architecture & Feature Consolidation  
**Phase:** RUI-NAV-01  
**Implementation base:** `1ec8fdad3f45eaa8ed29012f9b843c215050fcd9`  
**Dependency state:** NAV-00 merged; RUI-02 merged; 3DB-03 merged; RUI-COORD-00 merged  
**Runtime scope:** navigation structure only

---

## 1. Purpose

RUI-NAV-01 is the first runtime implementation of the hierarchy frozen by RUI-NAV-00. It converts the existing route-level workspace sidebar into a common file-manager-style navigation shell without changing route ids, scientific truth, renderer semantics, provenance, materialization, or workspace scientific-context ownership.

The phase implements three structural primitives:

1. the frozen four-directory tree;
2. canonical breadcrumb semantics for the active workspace;
3. explicit semantic directory views for each root group.

This phase deliberately does **not** migrate Explorer controls, Telemetry controls, comparison tools, anomaly tools, Data Lab internals, or Science System internals. Those remain NAV-02 through NAV-07 responsibilities.

---

## 2. Canonical tree implemented

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

The production route ids remain unchanged:

- `explore`
- `telemetry`
- `compare`
- `anomaly`
- `data-lab`
- `about`

`about` remains the deep-link/runtime route id while its canonical navigation name is **Science System**.

---

## 3. Runtime implementation

### `frontend/src/navigation.ts`

The route list is promoted into a canonical navigation model with:

- `NAVIGATION_TREE` as the single root-directory definition;
- stable group ids: `explore`, `analyse`, `data`, `science`;
- page metadata retained in `PAGE_ITEMS`;
- `navigationGroupForPage()` for canonical parent lookup;
- `breadcrumbForPage()` for one deterministic location path;
- unchanged `routeFromHash()` compatibility.

### `frontend/src/components/AppNavigation.tsx`

The existing RUI-01 shell is composed rather than replaced. NAV-01 adds:

- canonical directory groups from `NAVIGATION_TREE`;
- semantic `tree` / `treeitem` structure;
- explicit directory-view markers for each root group;
- `aria-current="page"` on the active workspace;
- canonical `Ocean Canvas / Directory / Workspace` breadcrumb;
- active-directory state on the shell root;
- the same desktop collapse and mobile drawer behavior already verified by RUI-01.

### `frontend/src/rui-nav-file-manager.css`

Only minimal structural breadcrumb/directory presentation is added. Broad visual refinement is intentionally deferred to the RUI visual-integration workstream unlocked after NAV-01.

---

## 4. Preserved ownership boundaries

### RUI-02 scientific context remains workspace-owned

NAV-01 does not move scientific context into the tree and does not create a second scientific state store. `ScientificContextHeader`, `WorkspaceContextHost`, and the existing scientific-context runtime remain authoritative.

### 3DB-03 geography remains authoritative

NAV-01 does not alter:

- geographic block ownership;
- 140-cell target geometry;
- pilot/materialized/planned state;
- source-backed payload eligibility;
- renderer data contracts.

### RUI presentation ownership remains intact

NAV-01 supplies structure and semantic state only. It does not perform the later RUI-VIS-01 visual redesign. Existing shell behavior, theme handling, reduced-motion behavior, desktop collapse, mobile drawer and focus restoration are preserved.

---

## 5. Scientific safety

No changes are made to:

- GLORYS baseline values or identity;
- INCOIS values or timestamps;
- Argo/Glider/CTD/BGC observations;
- variable availability;
- depths;
- QC semantics;
- comparison or anomaly methods;
- provenance/evidence payloads;
- materialized block files/checksums;
- Cesium or Water Column renderer calculations.

Navigation contains hierarchy only. Scientific source/model state remains outside the tree.

---

## 6. Acceptance contract

RUI-NAV-01 is complete only when all of the following are true:

1. root groups are exactly `EXPLORE`, `ANALYSE`, `DATA`, `SCIENCE` in frozen order;
2. all six current workspaces have exactly one canonical parent;
3. active workspace exposes `aria-current="page"`;
4. canonical breadcrumb resolves `Ocean Canvas / root directory / workspace`;
5. semantic directory states expose the frozen child membership;
6. all existing route ids and deep links remain valid;
7. desktop sidebar collapse/expand remains functional;
8. mobile drawer open/close/Escape/focus restoration remains functional;
9. RUI-02 scientific context remains outside the navigation tree;
10. no scientific, renderer, data, materialization or provenance behavior changes;
11. TypeScript/build/browser acceptance is green on the exact branch head;
12. branch is race-checked against fresh `main` before merge;
13. exact merge commit standard CI is green;
14. GitHub Pages deploy succeeds;
15. public HTTPS and live Chromium judge-flow verification succeed.

---

## 7. Explicit deferrals

The following are **not NAV-01 work** and remain intentionally unchanged:

- Explorer feature consolidation and contextual control placement — NAV-02 / NAV-09;
- Telemetry consolidation — NAV-03;
- Model vs Observation consolidation — NAV-04;
- Anomaly Screening consolidation — NAV-05;
- Data Lab consolidation — NAV-06;
- provenance/QC consolidation into Science System — NAV-07;
- guided cross-workspace discovery — NAV-08;
- scroll/pointer hardening — NAV-10;
- final responsive/accessibility navigation consolidation — NAV-11;
- duplicate/orphan purge — NAV-12.

---

## 8. Next integration unlock

A verified NAV-01 merge unlocks **RUI-VIS-01 — File-Manager Shell Visual Integration** for Chat 1. Structurally, the next RUI-NAV phase remains **NAV-02 — 3D Explorer Consolidation**.
