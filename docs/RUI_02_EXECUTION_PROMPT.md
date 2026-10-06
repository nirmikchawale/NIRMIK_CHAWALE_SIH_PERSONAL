# Ocean Canvas RUI-02 — Scientific Context Header / Workspace Chrome Master Prompt

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Phase:** RUI-02 · Shared Scientific Context Header / Workspace Chrome  
**Repository:** `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`  
**Authoritative implementation baseline:** `2779fe03cf3d6dde293f7ada25251d7168a42834`  
**Baseline meaning:** RUI-01 is live; 3DB-01 materialization foundation is merged on top of it.  
**Production branch:** `main`  
**Deployment:** GitHub Pages from `main`

## 1. Operating role

Act as the senior frontend architect, scientific-workstation UX engineer, accessibility engineer, regression engineer, and release engineer for Ocean Canvas.

Execute this phase autonomously through:

**RE-ANCHOR → AUDIT → CONTRACT → IMPLEMENT → TEST → DIFF-AUDIT → PR → RACE-CHECK → MERGE → DEPLOY → LIVE-VERIFY**

Do not stop at recommendations or local implementation. The phase is complete only at **LIVE & VERIFIED**.

## 2. Authority order

Use this precedence when evidence conflicts:

1. Current user instruction for RUI-02.
2. Latest `main` immediately before each write/merge decision.
3. Current source and automated tests.
4. `docs/RUI_MASTER_EXECUTION_PROMPT.md`.
5. `docs/RUI_00_BASELINE_ARCHITECTURE_CONTRACT.md`.
6. RUI-01 source now present on `main`.
7. 3DB-00/3DB-01 scientific-block contracts where they constrain UI truth.
8. Older project notes only when still consistent with the above.

Never overwrite newer scientific or materialization work with a remembered RUI snapshot.

## 3. Current authoritative state

At the start of this phase:

- `main` = `2779fe03cf3d6dde293f7ada25251d7168a42834`.
- RUI-01 left navigation is production baseline.
- Navigation groups are locked to EXPLORE / ANALYSE / DATA / EVIDENCE.
- Route ids remain `explore`, `telemetry`, `compare`, `anomaly`, `data-lab`, `about`.
- `ScientificContextBar` still lives inside `AppNavigation`: desktop in the sidebar and mobile in a navigation-adjacent row.
- The existing shared scientific-context runtime is authoritative and must remain the single source of cross-workspace scientific selection truth.
- 3DB-01 adds a fail-closed materialization foundation. RUI-02 must not bypass, duplicate, reinterpret, or weaken it.
- The global science footer permanently consumes shell height and duplicates integrity/context information that belongs in workspace chrome.

## 4. Phase objective

Move shared scientific context out of primary navigation and into one first-class workspace-context header that answers, compactly and truthfully:

- which scientific block is active;
- whether it is verified baseline, source-backed pilot, or planned geography only;
- active source;
- active variable;
- native time availability/current time;
- selected physical depth/surface-only state;
- selected verified profile when applicable;
- and whether the application is in a verified or degraded evidence state.

Detailed materialization explanation, block switching, deep-link copy, return-to-Explorer, integrity/disclaimer text, and origin metadata must remain available through progressive disclosure without permanently consuming the main workspace.

## 5. In scope

- Remove scientific-context rendering from `AppNavigation`.
- Introduce a single workspace-owned `ScientificContextHeader`.
- Add a workspace viewport/chrome composition seam between left navigation and active page content.
- Preserve the existing shared scientific-context subscription/publication runtime.
- Preserve Compare verified-profile bridging.
- Preserve materialized-block selection and previous/next stepping.
- Preserve planned-target fail-closed messaging.
- Preserve shareable scientific-context deep links.
- Preserve “Open context in 3D Explorer” behavior outside Explorer.
- Present source, variable, time, depth and profile as compact context fields.
- Move the global science footer’s evidence-integrity/disclaimer information into the context header disclosure and remove the permanent footer row.
- Keep desktop, compact desktop, tablet and mobile viewport ownership stable.
- Keep focus mode capable of maximizing the scientific visualization without mutating renderer/science state.
- Add phase-specific browser acceptance for ownership, continuity, progressive disclosure, accessibility and responsive behavior.

## 6. Explicit non-goals

Do **not** in RUI-02:

- create a second scientific context store;
- change scientific payloads or source values;
- change model/observation calculations;
- change anomaly methods or thresholds;
- change 3DB materialization eligibility/validation;
- rewrite Cesium, Water Column 3D or main-block renderers;
- restructure Explorer controls/VisualizationDock (RUI-04);
- introduce the unified right inspector framework (RUI-03);
- redesign Telemetry, Compare, Anomaly, Data Lab or Science & System task bodies (RUI-05–09);
- change route ids or deep-link semantics;
- perform broad CSS cleanup unrelated to workspace chrome;
- claim planned geography is materialized science.

## 7. Scientific integrity invariants

The implementation must preserve all of the following:

1. No fabricated timestamps or depths.
2. No invented vertical current component.
3. No hidden source-value replacement.
4. No unsupported validation claim.
5. Planned target selection remains clearly distinguished from materialized/verified evidence.
6. Analytics may remain anchored to verified evidence when a planned geographic target has no materialized volume.
7. Pilot blocks remain explicitly source-backed pilots, not silently promoted to baseline validation.
8. Depth remains metres positive downward where currently used.
9. Display/layout changes cannot mutate scientific values.
10. Provenance, QC, dataset identity, time/source limitations and scientific disclaimer remain inspectable.
11. 3DB-01 fail-closed materialization behavior must remain unchanged.

## 8. Target component contract

Target composition:

```text
AppShell
├── GlobalHeader
├── WorkspaceFrame
│   ├── SidebarNavigation
│   └── WorkspaceViewport
│       ├── ScientificContextHeader
│       │   ├── active block + materialization state
│       │   ├── source / variable / time / depth / profile summary
│       │   └── progressive details
│       │       ├── block selector + stepper
│       │       ├── materialization truth / limitations
│       │       ├── context deep-link actions
│       │       ├── origin / evidence state
│       │       └── scientific integrity / disclaimer
│       └── WorkspaceSurface
│           └── existing Explorer or route component
└── GlobalOverlays
```

`AppNavigation` owns navigation only. `ScientificContextHeader` owns context presentation only. Existing scientific runtime owns scientific state.

## 9. Interaction and accessibility contract

- Context header is a named semantic region.
- The compact header is visible whenever normal workspace chrome is visible.
- Details are progressively disclosed and closed by default.
- The disclosure has an explicit accessible name.
- Existing context controls retain meaningful accessible names.
- Planned/unavailable states expose an explicit reason.
- Disabled previous/next controls remain genuinely disabled when stepping is unsupported.
- Keyboard navigation and visible focus remain intact.
- Escape behavior for navigation drawers remains unchanged.
- Reduced-motion users get no new nonessential transitions.
- Mobile content must not horizontally overflow.
- No critical information relies on hover.
- Context fields remain readable under dark and light themes.

## 10. Responsive contract

### Desktop

- Left sidebar remains RUI-01 layout.
- Context header sits above the active workspace surface, not inside the sidebar.
- Header consumes only compact vertical space.
- Context fields may flow/wrap before they overlap or truncate critical truth.
- Details expand as a bounded chrome panel rather than causing uncontrolled document scrolling.

### Tablet/mobile

- RUI-01 mobile workspace dock remains first navigation row.
- Scientific context becomes the next compact workspace-chrome row.
- Navigation drawer remains inert/hidden when closed.
- Context remains visible while navigation drawer is closed.
- Expanded details remain viewport-safe and internally scrollable if necessary.
- No horizontal document overflow.

### Focus mode

- Existing focus mode may suppress sidebar/context chrome to maximize the 3D task.
- Suppression must not unsubscribe, reset or mutate shared scientific context.

## 11. Footer migration contract

The permanent `science-footer` may be removed only if all of its information remains inspectable in context chrome:

- cached/reanalysis/no-runtime-download state;
- degraded-source warning details when present;
- canonical scientific disclaimer.

Removing the footer must increase usable workspace height without hiding scientific limitations.

## 12. Required implementation constraints

Prefer the smallest safe seam:

- modify `AppNavigation` only to remove context ownership;
- introduce a dedicated context-header component or equivalent clean ownership boundary;
- modify `App.tsx` only where needed to compose workspace chrome and pass integrity/disclaimer state;
- add an RUI-02 CSS layer after existing shell compatibility CSS rather than rewriting historical styles wholesale;
- retain compatibility with existing `data-testid="scientific-context-bar"` assertions where practical while adding a phase-specific header test id;
- avoid broad changes to page components or scientific code.

## 13. Validation gates before merge

Require evidence for all applicable gates:

1. TypeScript typecheck.
2. Production frontend build.
3. Existing React/Cesium integration tests.
4. Existing science/API/fallback tests because `App.tsx` and the shared context seam are touched.
5. Static-hosted production artifact verification.
6. Existing Phase 5/6 scientific-context bridge tests.
7. Existing RUI-01 navigation tests.
8. Existing 3DB-00/3DB-01 truth/materialization regressions.
9. New RUI-02 desktop acceptance:
   - context is outside navigation;
   - context header is visible;
   - compact fields show source/variable/time/depth;
   - planned target retains fail-closed truth;
   - details expose block selector, deep-link action and disclaimer;
   - navigation collapse no longer hides scientific context;
   - route changes preserve compatible context.
10. New RUI-02 mobile acceptance:
   - workspace dock remains visible;
   - context header remains visible while drawer is closed;
   - details are viewport-safe;
   - no horizontal overflow;
   - route changes preserve context.
11. Dark/light compatibility.
12. Reduced-motion compatibility.
13. Diff-scope audit proves no scientific data/generated evidence/algorithm change.

## 14. PR and race rules

Before opening the PR, compare the phase branch against its baseline and confirm every changed file is in scope.

Before merge:

1. Re-read current `main`.
2. If `main` moved, inspect intervening changes.
3. Require the PR synthetic merge to be conflict-free and CI-green against the new base.
4. Never force-merge an obsolete synthetic merge result.
5. Preserve any newer scientific/materialization work.

Use `expected_head_sha` when merging so an unexpected branch mutation cannot be merged silently.

## 15. Deployment and live-verification gates

Merge to `main` is not completion.

Require the exact merge SHA to pass:

1. `deploy-oceantwin-pages` build.
2. Static scientific export and artifact verification.
3. GitHub Pages deployment.
4. Public HTTPS reachability and live evidence-integrity assertions.
5. Full live Chromium judge-flow acceptance.
6. RUI-02-specific live browser acceptance on desktop and mobile.
7. Final check that `main` still contains/is descended from the reported merge and no parallel commit invalidated the release claim.

Only then report **RUI-02 — LIVE & VERIFIED**.

## 16. Recovery rules

- **CI failure:** inspect the exact failed job/log; patch only the demonstrated regression; rerun required gates.
- **Main advances before merge:** do not overwrite. Let GitHub build the current synthetic merge, inspect conflicts/diff, and update/re-anchor only if necessary.
- **Deployment failure:** distinguish build, Pages publish, HTTPS verification and live-browser failure; fix the failing layer only.
- **External source fetch degradation:** preserve the repository’s existing verified fallback/fail-safe behavior; do not fabricate replacement evidence.
- **Context regression:** preserve the runtime and roll back presentation changes before altering scientific state logic.
- **Mobile overflow:** fix chrome sizing/layout; do not hide critical scientific truth to make the viewport pass.
- **Required live acceptance unavailable:** report **BLOCKED**, never “verified.”

## 17. Status vocabulary

Use only these phase states precisely:

- PLANNED
- CREATED
- VALIDATED
- MERGED
- DEPLOYED
- LIVE & VERIFIED
- BLOCKED

## 18. Completion definition

RUI-02 is complete only when the production site has one workspace-owned scientific context header, navigation no longer owns scientific context, footer integrity content remains inspectable without a permanent footer row, shared scientific context remains continuous and scientifically truthful, all regression/phase tests pass, the exact merge is deployed, and the public live Chromium suite verifies the result.