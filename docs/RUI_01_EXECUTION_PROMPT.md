# Ocean Canvas RUI-01 — Optimized Phase Execution Prompt

**Phase:** RUI-01 · App Shell & Left Sidebar Foundation  
**Repository:** `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`  
**Authoritative re-anchor:** `746c45a1717cea06aaa0cbe30cb8ffa5cbb736cf`  
**Parent phase:** RUI-00  
**Primary goal:** establish the responsive scientific-workstation shell and left navigation without altering scientific semantics.

## Role

Act as the senior frontend architect, scientific-workstation UX engineer, accessibility reviewer, regression engineer, and release engineer for Ocean Canvas.

Execute this phase through:

**RE-ANCHOR → AUDIT → DESIGN → IMPLEMENT → VERIFY → DIFF-AUDIT → PR → MERGE → DEPLOY → LIVE-VERIFY**

Do not stop at recommendations.

## Source priority

1. Current phase instruction.
2. Latest authoritative `main` immediately before writes.
3. Current source and automated tests.
4. `docs/RUI_MASTER_EXECUTION_PROMPT.md`.
5. `docs/RUI_00_BASELINE_ARCHITECTURE_CONTRACT.md`.
6. Older project notes only when still consistent with source.

If `main` moves before a write or merge, inspect the intervening commits and re-anchor rather than overwriting newer scientific work.

## Phase objective

Replace the horizontal workspace strip with a true left-side workspace selector while keeping every current route, renderer, scientific API call, shared-context runtime, deep link, page body, and source value intact.

The shell must become structurally ready for RUI-02 context-header extraction and RUI-03 inspector unification, but those migrations must not be pulled into this phase.

## In scope

- Persistent desktop left sidebar.
- Expanded and collapsed desktop states.
- Correct navigation groups:
  - EXPLORE → 3D Explorer
  - ANALYSE → Telemetry, Model vs Observation, Anomaly Screening
  - DATA → Data Lab
  - EVIDENCE → Science & System
- Stable active-route indication with `aria-current="page"`.
- Stable existing hash route IDs: `explore`, `telemetry`, `compare`, `anomaly`, `data-lab`, `about`.
- Compact mobile workspace dock.
- Mobile navigation drawer with backdrop, close action, Escape behavior, and focus restoration.
- Theme-compatible shell styling.
- Reduced-motion behavior.
- Responsive workstation viewport ownership.
- Browser acceptance for desktop grouping/collapse and representative mobile navigation.
- Existing ScientificContextBar remains mounted and functional as a temporary legacy slot until RUI-02.

## Explicit non-goals

Do not in RUI-01:

- redesign the ScientificContextBar;
- create a second scientific context store;
- unify evidence/profile/provenance inspectors;
- restructure Explorer controls or VisualizationDock;
- rewrite Cesium or Water Column 3D;
- change Telemetry, Compare, Anomaly, Data Lab, or Science & System task layouts;
- alter scientific calculations, source payloads, provenance, QC, timestamps, depths, current components, anomaly thresholds, or generated evidence;
- change route IDs or deep-link semantics;
- perform a broad CSS cleanup outside the shell layer.

## Architectural decisions

1. Preserve the existing `AppNavigation` export to minimize the shared-seam blast radius, but turn its internal markup into the RUI sidebar.
2. Give navigation-local UI state—desktop collapse and mobile drawer ownership—to `AppNavigation`; do not add it to the scientific state inside `App.tsx`.
3. Persist only the non-scientific desktop collapse preference in local storage.
4. Keep ScientificContextBar mounted even when the mobile drawer is visually closed so its existing context bridge/listeners continue to operate.
5. Add `rui-shell.css` as the final stylesheet layer. It owns only shell/navigation composition and intentionally avoids rewriting the accumulated renderer/page CSS in this phase.
6. On desktop, use an auto-sized sidebar column plus a `minmax(0, 1fr)` workspace column.
7. On compact/mobile layouts, convert the sidebar to an off-canvas drawer and provide a small dock that always communicates the active workspace.
8. When the Explorer enters existing focus mode, remove RUI navigation chrome from the active layout without changing renderer state.

## Scientific invariants

- No source values change.
- No source availability changes.
- No timestamps or depths are synthesized.
- No renderer input changes.
- No context publication/subscription semantics change.
- Compare-profile context bridging remains active.
- Existing deep links continue to resolve to the same route IDs.
- Existing model, observation, anomaly, import, and provenance behavior remains untouched.

## Accessibility requirements

- Sidebar has a meaningful navigation landmark name.
- Active route uses `aria-current="page"`.
- Collapse and expand controls have explicit accessible names.
- Collapsed routes retain accessible names and title descriptions.
- Mobile trigger exposes `aria-controls` and `aria-expanded`.
- Visually closed mobile navigation is inert and hidden from the accessibility tree while remaining mounted for scientific-context runtime behavior.
- Escape closes the mobile drawer.
- Closing the mobile drawer restores focus to the launch control where practical.
- Visible focus indication survives dark/light themes.
- No critical navigation depends on hover.
- Reduced-motion preference disables shell transitions.

## Responsive requirements

### Wide desktop

- Expanded left sidebar visible by default.
- Sidebar can collapse to a compact route-code rail.
- Central workspace gets the remaining width with no horizontal document scroll.
- Current page is unmistakable.

### Compact desktop

- Expanded sidebar becomes narrower without removing route functionality.
- Descriptions may progressively disappear before route names.

### Tablet/mobile

- Persistent desktop sidebar becomes a drawer.
- A compact workspace dock remains visible above the active workspace.
- Route change automatically dismisses the drawer.
- Backdrop and Escape both dismiss the drawer.
- Safe-area padding is respected.

## Required validation

Before merge, require evidence for:

1. TypeScript typecheck.
2. Production frontend build.
3. Existing React/Cesium browser regression suite.
4. Existing scientific API/static artifact regressions because `AppNavigation` is a shared application seam.
5. RUI-01 desktop browser acceptance:
   - all four groups visible;
   - Data Lab under DATA;
   - Science & System under EVIDENCE;
   - expanded/collapsed state changes actual sidebar width;
   - route IDs remain unchanged;
   - active route updates correctly.
6. RUI-01 mobile acceptance:
   - compact dock visible;
   - drawer opens;
   - closed drawer is accessibility-inert;
   - route change dismisses drawer;
   - Escape dismisses drawer;
   - focus returns to trigger.
7. Dark/light compatibility through the existing theme regression suite.
8. Reduced-motion compatibility.
9. Diff-scope audit confirms no science/data/generated evidence changes.

## Merge and release gates

Do not call RUI-01 complete until:

- phase branch exists from the verified baseline;
- phase diff is scoped;
- PR CI is green;
- PR is merged to `main`;
- Pages build succeeds;
- Pages deployment succeeds;
- public HTTPS verification succeeds;
- live Chromium judge flow succeeds;
- RUI shell acceptance succeeds on the deployed build;
- final `main` still contains the merge being reported.

Use status vocabulary exactly: PLANNED, CREATED, VALIDATED, MERGED, DEPLOYED, LIVE & VERIFIED, or BLOCKED.
