# Ocean Canvas RUI-COORD-00 — Visual Integration & Dependency Freeze

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** RUI / Chat 1 coordinated with RUI-NAV / Chat 3  
**Phase:** RUI-COORD-00  
**Reconciled authoritative baseline:** `66bc969b470a6b8da5d5de920e49c9c08d9bb5f8`  
**Baseline state:** RUI-00/01/02 LIVE & VERIFIED; RUI-NAV-00 merged and hierarchy frozen; 3DB-00/01/02/03 preserved on production `main`  
**Runtime effect:** none — documentation-only coordination gate

---

## 1. Purpose

This phase freezes how Chat 1 may continue the Responsive UI (RUI) roadmap now that the independent RUI-NAV information-architecture workstream is authoritative for navigation structure.

The governing ownership split is:

- **RUI-NAV decides WHERE capabilities live:** canonical parentage, navigation groups, feature hierarchy, breadcrumbs, directory states, contextual placement, duplicate/orphan removal, and navigation-driven discoverability.
- **RUI decides HOW the frozen architecture looks and behaves visually:** spacing, typography, glass surfaces, density, animation, responsive projection, accessibility presentation, focus/hover/active treatment, touch ergonomics, and final polish.
- **3DB remains authoritative for scientific truth:** source-backed values, materialization, provenance, QC, timestamps, depths, variables, geographic block contracts, scientific eligibility, and renderer/data semantics.

No Chat 1 phase may silently replace an RUI-NAV structural decision or change 3DB scientific meaning for presentation convenience.

---

## 2. Reconciled production truth

The phase originally began from RUI-02 merge `658bef1ac021dc5888813ea4b56d261e0a472925`. During the phase, production advanced. The branch was therefore race-stopped and reconciled to fresh `main`.

Current authoritative `main` for this coordination freeze is:

`66bc969b470a6b8da5d5de920e49c9c08d9bb5f8` — **Merge RUI-NAV-00 feature inventory and hierarchy freeze**.

That production state also contains:

- **RUI-00 — Baseline Freeze & UI Architecture Contract — LIVE & VERIFIED**
- **RUI-01 — App Shell & Left Sidebar Foundation — LIVE & VERIFIED**
- **RUI-02 — Shared Scientific Context Header / Workspace Chrome — LIVE & VERIFIED**
- **3DB-00 / 3DB-01 / 3DB-02 — preserved scientific/materialization truth**
- **3DB-03 — Geographic Block Engine — merged**, establishing deterministic canonical geographic ownership for the 140 Indian Ocean target blocks without transferring UI hierarchy ownership away from RUI-NAV.
- **RUI-NAV-00 — hierarchy freeze — merged**, including the RUI-02 reconciliation addendum.

The merged RUI-02 direction is a permanent integration invariant:

- shared scientific context is workspace-owned chrome;
- `ScientificContextHeader` / `WorkspaceContextHost` remains the production ownership direction;
- navigation must not become a second scientific-context store;
- route/deep-link continuity remains protected;
- mobile navigation and scientific context remain independently available.

The merged RUI-NAV-00 direction is now production truth, not a pending dependency.

---

## 3. Canonical root hierarchy Chat 1 must visually honor

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

Current route IDs may remain for compatibility until RUI-NAV explicitly migrates them:

- `explore`
- `telemetry`
- `compare`
- `anomaly`
- `data-lab`
- `about`

RUI visual work must not independently create a competing top-level hierarchy or duplicate tree nodes.

---

## 4. Chat 1 protected production assets

Reuse rather than rebuild unless a demonstrated defect requires change:

- AppShell viewport foundation;
- desktop sidebar collapse/expand behavior;
- mobile navigation drawer/dock behavior;
- route activation and deep-link continuity;
- brand relocation completed in RUI-01;
- workspace-owned scientific context completed in RUI-02;
- progressive scientific-context disclosure;
- responsive scientific-context row;
- currently passing keyboard/focus semantics;
- currently passing workspace/document scroll ownership;
- valid theme and reduced-motion behavior.

A later RUI-NAV migration may re-parent or compose these primitives, but Chat 1 must not replace them merely to obtain a cleaner code shape.

---

## 5. Historical remaining RUI phases — reconciliation matrix

| Historical RUI phase | Original objective | RUI-NAV dependency | Current classification | Chat 1 action |
|---|---|---|---|---|
| **RUI-03** | Inspector Framework & Panel State Model | NAV-09 contextual inspector + NAV-12 duplicate/orphan cleanup | **SUPERSEDED structurally / retained visually** | Do not invent a competing inspector IA. Style the canonical inspector host/sheets after NAV ownership lands. |
| **RUI-04** | 3D Explorer Restructure | NAV-02 Explorer Consolidation; NAV-09/10 contextual and interaction seams | **NAV-dependent** | Defer structural Explorer work. After NAV-02, perform visual hierarchy, density, glass, responsive and ergonomic integration only. |
| **RUI-05** | Telemetry Restructure | NAV-03 | **NAV-dependent** | Wait for canonical Telemetry hierarchy, then visually harmonize it without changing science. |
| **RUI-06** | Model ↔ Observation Restructure | NAV-04 | **NAV-dependent** | Wait for canonical comparison hierarchy, then visually prioritize profile/evidence/metrics. |
| **RUI-07** | Anomaly Screening Restructure | NAV-05 | **NAV-dependent** | Wait for canonical anomaly hierarchy, then style diagnostic/explainability flow. |
| **RUI-08** | Data Lab Restructure | NAV-06 | **NAV-dependent** | Wait for canonical import/validation hierarchy, then optimize task presentation. |
| **RUI-09** | Science & System Restructure | NAV-07 | **NAV-dependent** | Wait for canonical Science System hierarchy, then style evidence/provenance presentation. |
| **RUI-10** | Responsive / Mobile / Tablet Consolidation | NAV-10 pointer/scroll + NAV-11 responsive projection | **MERGED responsibility** | Preserve current working shell; final consolidation follows structural migration. |
| **RUI-11** | Accessibility & Keyboard Consolidation | NAV-11 plus per-phase a11y | **MERGED responsibility** | Protect accessibility continuously; run full consolidation after structural primitives stabilize. |
| **RUI-12** | Visual-System / Density / Theme Consolidation | Best after NAV-01 and again near closure | **Visually independent, sequencing constrained** | No broad restyle before NAV-01. Apply local tokens incrementally, final consolidation late. |
| **RUI-13** | Cross-Workspace Context & Command Navigation | NAV-08/11/13 | **NAV-dependent** | Preserve shared context runtime; do not create competing command/navigation architecture. |
| **RUI-14** | Full Regression / Judge Flow | All structural/visual migrations | **Release gate** | Execute near production closure. |
| **RUI-15** | Final Polish / Documentation / Release Freeze | Joint RUI-NAV + 3DB closeout | **Joint final phase** | Execute only after hierarchy, responsive, accessibility, visual system and judge-flow completion. |

The historical roadmap remains useful as product intent, but RUI-03 through RUI-13 are no longer independent structural authority where RUI-NAV owns the same decision.

---

## 6. Coordinated Chat 1 sequence

### Checkpoint A — NAV-00 hierarchy freeze

**COMPLETE on production.** Chat 1 accepts the canonical inventory and KEEP / MOVE / MERGE / CONTEXTUALIZE / REMOVE decisions, does not recreate removed/merged islands, and keeps RUI-02 scientific context outside navigation.

### Checkpoint B — NAV-01 File-Manager Navigation Shell

**This is the next runtime unlock for Chat 1.**

After NAV-01 provides structural navigation primitives, breadcrumb semantics, and directory architecture, Chat 1 may execute:

**RUI-VIS-01 — File-Manager Shell Visual Integration**

RUI-VIS-01 may own only the visual/behavioral projection of NAV-01:

- sidebar/tree appearance;
- expanded/collapsed visual states;
- iconography and indentation;
- selected/hover/focus states;
- typography and readable density;
- glass/surface hierarchy;
- breadcrumb visual treatment and responsive truncation;
- desktop/mobile/tablet presentation;
- animation/reduced-motion behavior;
- accessibility presentation and touch targets;
- visual compatibility with `ScientificContextHeader`.

It must not change canonical parentage, add duplicate nodes, or reintroduce science state into navigation.

### Checkpoint C — NAV-02 Explorer Consolidation

After NAV-02 structural Explorer migration, execute the Explorer visual integration pass instead of the historical independent RUI-04 restructure.

### Checkpoint D — NAV-03 through NAV-07

After each workspace migration, visually harmonize the migrated workspace using one workstation language.

### Checkpoint E — NAV-08 through NAV-11+

Perform coordinated discoverability, inspector presentation, scroll/pointer ergonomics, responsive, accessibility and cross-workspace integration.

### Checkpoint F — production closure

Run joint fragmentation, visual, accessibility, scientific, responsive and judge-flow regression before release freeze.

---

## 7. Shared high-risk seams

Before Chat 1 edits any of the following, re-read current `main` and all open RUI-NAV / 3DB branches and PRs:

- `frontend/src/App.tsx`
- `frontend/src/components/AppNavigation.tsx`
- `frontend/src/navigation.ts`
- `frontend/src/main.tsx`
- `frontend/src/components/ScientificContextHeader.tsx`
- `frontend/src/components/WorkspaceContextHost.tsx`
- shell/sidebar/context CSS
- Explorer composition files
- workspace page components
- inspector/panel components
- mobile drawer/sheet CSS
- scroll/pointer CSS
- shared Playwright acceptance tests

If Chat 3 or 3DB changes the same seam, stop before merge, inspect overlap, reconcile onto fresh `main`, preserve newer work, and rerun validation.

---

## 8. Scientific safety contract

All future Chat 1 visual work must preserve:

- immutable GLORYS baseline semantics;
- source-backed materialized pilot truth;
- planned vs materialized vs verified distinctions;
- 3DB-03 canonical geographic ownership semantics;
- native timestamps only;
- genuine source depths only;
- variable availability truth;
- provenance/QC semantics;
- model-observation collocation/comparison meaning;
- anomaly-method meaning and limitations;
- no invented vertical current component;
- no synthetic scientific data;
- display-only controls remaining display-only.

A visual simplification may use progressive disclosure but must not change the scientific claim.

---

## 9. Validation contract

Every runtime RUI phase must preserve, as applicable:

- TypeScript typecheck;
- production build;
- RUI browser acceptance;
- RUI-NAV navigation/tree/breadcrumb acceptance;
- 3DB scientific/materialization/geography tests;
- science API/fallback checks;
- static-hosted artifact verification;
- route/deep-link continuity;
- expanded/collapsed shell states;
- scroll/pointer ownership;
- desktop/tablet/mobile behavior;
- keyboard/focus behavior;
- reduced-motion behavior;
- dark/light theme behavior;
- no overlap/clipping;
- exhaustive browser acceptance.

Tests may change only when architecture intentionally changes; they must not be weakened merely to produce a green run.

---

## 10. Merge/deployment standard

For any Chat 1 production UI phase:

`IMPLEMENTED → TESTED → PR GREEN → FRESH-MAIN RACE CHECK → MERGED → EXACT-MAIN CI GREEN → DEPLOYED → HTTPS GREEN → LIVE CHROMIUM GREEN → VERIFIED`

For documentation-only coordination phases, the visible delta is intentionally none; successful exact-main regression/deployment/live Chromium is the correct completion evidence.

---

## 11. RUI-COORD-00 acceptance criteria

RUI-COORD-00 is complete only when:

1. this contract exists on a dedicated RUI branch;
2. the branch is reconciled to current production `main` after concurrent NAV/3DB advances;
3. diff scope contains only this coordination document;
4. exact-head standard repository CI is green;
5. the contract is merged to `main`;
6. exact-merge `tests` and `final-mvp` are green;
7. exact-merge GitHub Pages deployment succeeds;
8. public HTTPS verification succeeds;
9. live Chromium judge-flow acceptance succeeds;
10. no runtime visual/scientific regression is introduced.

---

## 12. Frozen next-action rule

**Do not begin a new structural RUI implementation immediately after RUI-COORD-00.**

The next Chat 1 runtime implementation is unlocked by **RUI-NAV-01 — File-Manager Navigation Shell** or an explicitly equivalent merged structural primitive from Chat 3.

Until NAV-01 exists:

- Chat 1 may audit, document, and prepare visual tokens;
- Chat 1 may fix demonstrated regressions in already-owned RUI surfaces;
- Chat 1 must not independently build the file-manager hierarchy, breadcrumb semantics, contextual inspector IA, Explorer feature tree, or workspace directory structure.

This prevents fragmentation and ensures Chat 1, Chat 3, and the 3DB workstream converge on one final Ocean Canvas experience.