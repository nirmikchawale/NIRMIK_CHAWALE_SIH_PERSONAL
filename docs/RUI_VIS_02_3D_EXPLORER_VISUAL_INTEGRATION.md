# Ocean Canvas RUI-VIS-02 — 3D Explorer Visual Integration

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** RUI / Chat 1 visual integration only  
**Phase:** RUI-VIS-02 — 3D Explorer Visual Integration  
**Authoritative phase-start main:** `d4520f23cf64a6aa72e89ca439d6d526e2743a98` — merged RUI-NAV-03 production baseline  
**Fresh-main reconciliation baseline:** `e36baf916cd8dbfb83d98faac6cb476162a35947` — merged RUI-NAV-04 production state  
**Scientific reconciliation baseline:** `3d2dce3a1f07ec05d3aa38d07db27a2018d7ac60` — merged 3DB-07 production state  
**Latest production reconciliation baseline:** `25681c9a193a264d982b7c39fdf3f348f8f89e3d` — merged RUI-NAV-05 production state

## Mission

RUI-VIS-02 visually harmonizes the already-consolidated RUI-NAV-02 3D Explorer into one restrained scientific workstation language.

This phase does **not** own information architecture. It accepts the existing NAV-02 hierarchy exactly as production truth and changes only visual hierarchy, density, responsive ergonomics, focus treatment, surface hierarchy and motion presentation.

## Chat ownership lock

From this phase onward, this Chat 1 workstream follows the coordinated ownership boundary:

- **RUI / Chat 1:** visual presentation, density, responsive ergonomics, accessibility presentation, focus/hover/active treatment, touch sizing and final polish.
- **RUI-NAV / Chat 3:** canonical parentage, feature hierarchy, workspace directories, duplicate/orphan cleanup and cross-feature navigation.
- **3DB / Chat 2:** scientific values, data/materialization truth, renderer contracts, native time/depth semantics, QC, provenance and scientific eligibility.

A Chat-1 request that accidentally names a Chat-3 phase must not advance the Chat-3 roadmap from this branch.

## Phase-start concurrency check

At bootstrap:

- production `main` remains `d4520f23cf64a6aa72e89ca439d6d526e2743a98`;
- RUI-NAV-04 is an open Chat-3 PR and is not production truth;
- 3DB-07 is an open Chat-2 PR and is not production truth;
- both open PRs touch `frontend/src/main.tsx`, so RUI-VIS-02 deliberately avoids that shared seam;
- RUI-VIS-02 edits the already-imported Explorer CSS layer plus phase-specific acceptance/documentation only.

## Reconciliation after concurrent NAV-04 merge

While exact-head browser acceptance was running, Chat 3 completed RUI-NAV-04 and production advanced to `e36baf916cd8dbfb83d98faac6cb476162a35947`.

RUI-VIS-02 was therefore race-stopped and re-anchored on that fresh production commit before merge. The NAV-04 comparison hierarchy and all of its runtime files remain untouched by this Chat-1 visual phase.

The first exact-head browser matrix passed 83/86 tests and exposed three compact-screen presentation issues only:

- Chromium fractional rounding placed the integrated block HUD 0.125 px beyond the viewport tolerance at 390×844;
- the Explorer directory workspace control could intercept a source action after automatic compact-screen scrolling;
- the phase-specific mobile test incorrectly expected a control-panel jump action while the compact control dock was intentionally closed.

The corrective delta is presentation/test-only: explicit compact stacking priority, a 1 px HUD cap adjustment, and acceptance against a visible source-card touch target instead of a hidden control.

## Reconciliation after concurrent 3DB-07 merge

A second race stop was required after 3DB-07 merged to production at `3d2dce3a1f07ec05d3aa38d07db27a2018d7ac60`.

RUI-VIS-02 is re-anchored on that exact scientific baseline. The phase still edits only the Explorer visual CSS layer, its phase-specific browser acceptance, and this document; no 3DB-07 runtime, API, main-block-time, renderer, data or materialization file is changed.

The first NAV-04-reconciled browser retry passed 88/90 tests. All five RUI-VIS-02 tests passed. The two remaining failures were compact-screen presentation seams:

- a 0.125 px Chromium fractional viewport overshoot on the integrated block HUD at 390×844;
- source/workspace controls could occupy the same pointer zone after a source-evidence open/close scroll sequence.

The final correction uses physical mobile separation and scroll margins rather than competing z-index ownership, plus a 2 px display-only upward HUD translation. No scientific geometry or block semantics are changed.

## Reconciliation after concurrent RUI-NAV-05 merge

A third race stop was required after Chat 3 merged RUI-NAV-05 to production at `25681c9a193a264d982b7c39fdf3f348f8f89e3d`.

RUI-VIS-02 is re-anchored on that latest production state without changing NAV-05 Anomaly Screening files or hierarchy.

The 3DB-07-reconciled browser run passed 88/91 tests. The remaining three failures were all compact-screen presentation acceptance:

- the legacy block-HUD containment test still hit Chromium's 0.125 px fractional scroll boundary at 390×844;
- the phase-specific RUI-VIS-02 sequence reproduced source-card paint overlapping the two-row Explorer workspace switcher;
- the legacy workstation test reproduced the same workspace/source pointer overlap.

The correction now reserves an explicit 236 px mobile directory content box with a 96 px workspace-control subregion, removes competing positioned stacking contexts, and caps the existing scrollable 390 px block HUD at 148 px. No route, hierarchy, source, block, time/depth, QC, provenance or renderer semantic is changed.

## Frozen Explorer hierarchy

RUI-VIS-02 does not add, remove, rename, re-parent or duplicate any NAV-02 home:

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

The existing root route remains `explore`.

## Visual integration

The pass harmonizes the existing Explorer DOM rather than creating replacement controls.

### Explorer directory

- stronger but restrained workstation surface;
- improved title/subtitle legibility;
- 38 px desktop directory/workspace targets and 44 px mobile targets;
- clearer hover, focus and pressed workspace states;
- reduced-motion-safe transitions.

### Scientific source workspace

- source chooser reads as a first-class evidence selector rather than a loose strip;
- selected source remains distinguished by border/surface/rail, not colour alone;
- source cards retain their existing labels, availability and click handlers;
- workflow shortcuts remain unchanged.

### Block System

- one coherent visual parent for the existing Indian Ocean Block Engine and Arabian Sea 3D Atlas;
- larger launcher targets and clearer surface separation;
- no changes to block materialization, planned/verified status, dialogs or scientific eligibility.

### Explorer controls

- stronger control-column containment and section rhythm;
- more readable jump navigation and control targets;
- clearer progressive disclosure for existing advanced settings;
- exact depth, time, variable and observation controls retain their current semantics.

### 3D workspace

- visualization dock, scientific scene and renderer tools share one surface language;
- renderer-stage border/radius hierarchy creates a single visual focal layer;
- renderer controls gain more consistent minimum hit targets;
- no Cesium/Water Column renderer behavior is altered.

### Display range

- the existing colorbar/range surface receives the same workstation hierarchy;
- min/max, palette and scale remain display-only controls;
- no scientific values are mutated.

### Evidence and inspector surfaces

- existing evidence status, evidence rail, profile panel and analysis panel gain consistent borders/radii/surface depth;
- ownership and visibility logic are untouched.

## Responsive and accessibility presentation

RUI-VIS-02 preserves the existing NAV-02 responsive structure while improving presentation:

- tablet spacing is tightened without changing Explorer parentage;
- mobile directory/workspace actions are at least 44 px high;
- mobile control jump actions are at least 44 px high;
- block launchers remain at least 56 px high;
- horizontal page overflow remains prohibited;
- visible focus outlines remain at least 2 px;
- reduced-motion removes decorative transitions;
- forced-colour mode removes decorative shadows and uses system borders/focus.

## Explicit non-goals

RUI-VIS-02 does not:

- modify `navigation.ts`;
- modify `App.tsx`;
- modify `main.tsx`;
- modify Explorer component parentage;
- create a new directory, inspector or state store;
- change workspace/deep-link semantics;
- alter scientific APIs or payloads;
- change model values, timestamps, depths, coordinates, QC or provenance;
- change block eligibility/materialization;
- infer a vertical current component;
- synthesize measurements or timestamps;
- execute RUI-NAV-04 or any later Chat-3 phase.

## Acceptance gates

RUI-VIS-02 is complete only when:

1. all eleven existing NAV-02 Explorer homes remain present;
2. desktop Explorer directory density is readable and visually coherent;
3. source cards, block launchers, control panel, scene and display-range surfaces share the workstation visual language;
4. source/workspace interaction behavior remains unchanged;
5. keyboard focus remains visible;
6. mobile target sizing and horizontal containment pass;
7. reduced-motion presentation passes;
8. RUI-NAV-02 hierarchy acceptance remains green unchanged;
9. RUI-VIS-01 shell acceptance remains green unchanged;
10. 3DB scientific/materialization/rendering acceptance remains green;
11. exact-head repository CI and full browser acceptance pass;
12. fresh-main race check is clean or reconciled without overwriting Chat 2/3 work;
13. after merge, exact-main tests/final-mvp/Pages/HTTPS/live Chromium all pass.

Only after those gates may RUI-VIS-02 be marked **COMPLETE · MERGED · DEPLOYED · LIVE · VERIFIED**.
