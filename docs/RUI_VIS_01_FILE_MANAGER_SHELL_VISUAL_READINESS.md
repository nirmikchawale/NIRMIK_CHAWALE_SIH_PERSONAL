# Ocean Canvas RUI-VIS-01 — File-Manager Shell Visual Readiness

**Project:** SIH26067 · Ocean Canvas · The Optimizers  
**Workstream:** RUI / Chat 1  
**Phase:** RUI-VIS-01 readiness gate  
**Starting production baseline:** `1ec8fdad3f45eaa8ed29012f9b843c215050fcd9`  
**Runtime implementation status:** **BLOCKED — requires merged RUI-NAV-01 structural primitives**  
**This document status:** visual contract prepared; documentation only  
**Runtime/science effect:** none

---

## 1. Purpose

RUI-COORD-00 established a strict ownership boundary: RUI-NAV decides **where** capabilities live and RUI decides **how** that approved architecture is presented. RUI-VIS-01 is therefore not permitted to invent the file-manager tree, breadcrumb semantics, nested workspace directory model, or canonical parentage before RUI-NAV-01 lands.

This readiness phase does the maximum safe work available before that dependency exists. It freezes the visual, responsive, accessibility and interaction-presentation contract that Chat 1 will apply to RUI-NAV-01 immediately after its structural primitives are merged.

This phase intentionally does **not**:

- create a navigation tree;
- rename or regroup the current production root navigation;
- change `EVIDENCE` to `SCIENCE` ahead of RUI-NAV-01;
- create breadcrumbs;
- create Explorer/workspace child directories;
- modify route IDs or deep-link behavior;
- move scientific context back into navigation;
- alter scientific values, datasets, provenance, QC, timestamps, depths, variables, block ownership or renderer semantics;
- perform a broad visual restyle of current production.

---

## 2. Verified dependency state

Fresh repository verification at phase start found:

- production `main`: `1ec8fdad3f45eaa8ed29012f9b843c215050fcd9`;
- RUI-COORD-00: merged and LIVE & VERIFIED;
- RUI-NAV-00: merged and hierarchy frozen;
- no RUI-NAV-01 pull request exists;
- no RUI-NAV-01 implementation branch exists;
- the only RUI-NAV branch currently present is `rui-nav-00-hierarchy-freeze`.

Therefore the runtime portion of RUI-VIS-01 is correctly **BLOCKED**, not incomplete by accident.

The unblock condition is a merged RUI-NAV-01 implementation, or an explicitly equivalent merged structural change, that provides the canonical file-manager navigation primitives and breadcrumb semantics without violating the existing RUI-02 scientific-context ownership direction.

---

## 3. Production visual baseline to preserve

### Current navigation behavior already worth keeping

`AppNavigation.tsx` currently provides:

- persistent desktop left navigation;
- expanded/collapsed desktop modes;
- local persistence of collapsed state;
- accessible current-page semantics through `aria-current="page"`;
- mobile navigation drawer;
- backdrop dismissal;
- Escape dismissal;
- focus restoration to the mobile navigation trigger;
- inert/hidden closed navigation state;
- focus-mode suppression without route/science reset;
- stable production route IDs.

These are established production behaviors. RUI-VIS-01 should visually adapt the future NAV-01 structure around them rather than regress them.

### Current scientific-context behavior already worth keeping

RUI-02 established `ScientificContextHeader` / `WorkspaceContextHost` as workspace-owned scientific chrome. The current acceptance suite proves that it remains independently available when the sidebar is collapsed and independently available from the mobile navigation drawer.

RUI-VIS-01 must visually coordinate with this header but must not embed it into the future navigation tree.

---

## 4. Structural authority RUI-VIS-01 must consume, not redefine

RUI-NAV-00 freezes the root architecture as:

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

Current route IDs remain compatible:

- `explore`
- `telemetry`
- `compare`
- `anomaly`
- `data-lab`
- `about`

NAV-01, not this visual-readiness phase, owns conversion from today’s route-level selector into the canonical file-manager navigation shell.

---

## 5. Presentation primitive contract

The following names describe visual roles only. RUI-NAV-01 may choose different implementation/component names.

```text
NavigationSurface
├── NavigationIdentity
├── NavigationGroup
│   └── NavigationNode
│       ├── NavigationNodeIcon
│       ├── NavigationNodeLabel
│       ├── NavigationNodeMeta
│       └── OptionalExpansionAffordance
├── GlobalUtilities
└── MobileNavigationSheet

WorkspaceChrome
├── BreadcrumbBar
│   └── BreadcrumbSegment
└── ScientificContextHeader   ← separate ownership; never a tree node
```

RUI-VIS-01 will style whichever NAV-01 primitives implement these roles. It must not require a second parallel component tree simply to satisfy visual naming.

---

## 6. Visual token targets

These targets are deliberately expressed as bounded visual rules rather than hard architectural requirements. Final values are applied only after NAV-01 exposes real tree depth and density.

### Sidebar width

Current production uses:

- expanded: `252px`;
- collapsed: `76px`;
- tablet expanded: `224px`.

Post-NAV-01 visual target range:

- desktop expanded: approximately `248–264px`;
- desktop collapsed: approximately `64–76px`;
- tablet expanded: approximately `216–232px` if child hierarchy remains legible;
- mobile: sheet/drawer rather than permanently consuming workspace width.

The actual chosen width must be validated against real tree labels and cannot truncate the canonical hierarchy into ambiguity.

### Spacing

Use the established restrained workstation rhythm:

- 4px base spacing logic;
- compact but not compressed vertical grouping;
- related nodes closer than separate groups;
- avoid nested card-on-card padding where a simple group label is enough;
- avoid decorative whitespace that reduces scientific viewport area.

### Tree indentation

After NAV-01 exists:

- first nested level: roughly 14–16px visual indentation from its parent label line;
- deeper levels should remain visibly subordinate without sacrificing label width;
- avoid excessive guide lines or ornamental branching;
- active ancestry may be communicated subtly, but the current/active destination must remain the strongest state;
- do not visually imply deeper hierarchy than the semantic/navigation model actually provides.

---

## 7. Typography and density contract

Current production contains multiple 8–10px shell/context labels. These are acceptable as historical implementation detail but are a known RUI debt item and must not be propagated into the file-manager shell.

RUI-VIS-01 targets:

- primary navigation labels: normally at least `12px`;
- supporting descriptions/meta: normally at least `11px` when shown;
- uppercase group labels: normally `10–11px`, with restrained tracking;
- breadcrumb active segment: at least primary-navigation readability;
- compact scientific-context metadata may remain denser, but essential status cannot depend on microscopic text;
- no required judge action or critical state may depend on 8–9px text.

The visual pass should prefer progressive disclosure or removal of redundant helper text over shrinking type to fit.

---

## 8. Navigation-node state language

Every rendered navigation node should expose only states supported by the structural implementation.

### Required visual states

- idle;
- hover, where hover exists;
- focus-visible;
- current/active destination;
- ancestor-expanded when NAV-01 provides expansion;
- ancestor-collapsed when NAV-01 provides expansion;
- sidebar expanded;
- sidebar collapsed;
- mobile drawer open/closed.

### Conditional states

Only when structurally meaningful:

- disabled with a visible/accessible reason;
- loading if a subtree genuinely loads asynchronously;
- unavailable when a feature cannot be entered.

No production node may look interactive while doing nothing. RUI must not invent loading or disabled decoration for nodes that do not possess those runtime states.

### Active treatment

Preserve the successful current principle:

- restrained surface change;
- accent indicator;
- readable text contrast;
- no heavy glow;
- do not reuse scientific status colours such as verified/pilot/planned as generic navigation-selection colours.

Scientific colours retain scientific meaning.

---

## 9. Input and target-size contract

Current desktop navigation items are 46px high, which is a strong baseline.

Future visual integration targets:

- desktop navigation hit area: at least about 40px high;
- touch/mobile actionable targets: at least about 44px where practical;
- expand/collapse chevrons must not become tiny precision targets;
- mobile close/open affordances should meet touch-size expectations;
- collapsed-sidebar nodes retain accessible names and discoverability even when visible copy is removed.

Tooltips may supplement collapsed desktop discoverability but cannot be the sole accessible name.

---

## 10. Glass and surface hierarchy

Ocean Canvas should remain a restrained scientific workstation, not a stack of translucent cards.

### Navigation surface

Use one primary shell plane:

- modest translucency;
- subtle border separation from the workspace;
- restrained blur;
- no strong glow;
- no nested glass merely to contain every node.

### Navigation nodes

- idle nodes should be visually quiet;
- hover/focus may use a slightly raised surface;
- active node receives the strongest non-scientific accent treatment;
- groups should primarily use spacing and typography rather than permanent boxes.

### Scientific-context compatibility

`ScientificContextHeader` remains a separate horizontal surface. Its border/background/blur may be visually harmonized with the navigation shell after NAV-01, but its scientific content and ownership remain untouched.

---

## 11. Breadcrumb visual contract

Breadcrumb structure and semantics belong to NAV-01. Once provided, RUI-VIS-01 will style them under these rules:

- single-line, low-height workspace chrome;
- target visual height approximately `36–40px`, subject to the actual shell layout;
- visually quieter than the scientific-context header and active workspace content;
- current segment strongest; ancestors visibly secondary;
- long paths truncate gracefully rather than wrap into a second toolbar row;
- prefer collapsing/ellipsizing early or middle ancestry before truncating the active destination into ambiguity;
- keyboard focus is visible on interactive ancestor segments;
- no duplicate block/source/variable/time/depth text already owned by `ScientificContextHeader`;
- mobile breadcrumbs may collapse to a compact parent/current representation if NAV-01 defines that projection.

RUI-VIS-01 will not create breadcrumbs before NAV-01 defines their path semantics.

---

## 12. Responsive projection contract

### Desktop

- persistent left navigation;
- collapsed mode remains available;
- central scientific workspace receives the majority of width;
- future nested tree remains readable without horizontal page scrolling;
- breadcrumb and scientific-context chrome remain independently legible.

### Tablet

- metadata/descriptions may reduce before primary labels do;
- sidebar may narrow within the target range;
- touch targets remain usable;
- tree depth must not force horizontal document scrolling.

### Mobile

Current drawer mechanics are protected:

- navigation presented as sheet/drawer;
- backdrop dismissal;
- Escape dismissal where hardware keyboard exists;
- focus restoration;
- safe-area awareness;
- navigation and scientific context remain independently accessible;
- no hover-only discovery;
- closing navigation does not hide scientific context;
- route navigation closes the drawer and returns focus appropriately.

The future file-manager hierarchy must be a responsive projection of one IA, not a second mobile-only architecture.

---

## 13. Motion contract

Current shell transitions are approximately 180–190ms. This is an appropriate baseline.

RUI-VIS-01 targets:

- shell expansion/collapse: approximately 140–190ms;
- small node disclosure: short, non-distracting transition only if NAV-01 actually uses expandable nodes;
- no large route-change animation that competes with scientific visualization;
- no animation required to understand navigation state;
- `prefers-reduced-motion: reduce` removes nonessential shell transitions.

The existing reduced-motion behavior must remain protected.

---

## 14. Accessibility presentation contract

RUI-VIS-01 must preserve or improve:

- semantic `nav` landmark;
- meaningful accessible labels;
- `aria-current` or NAV-01’s equivalent current-destination semantics;
- visible focus;
- keyboard operability;
- Escape-close transient mobile navigation;
- focus restoration after transient navigation closes;
- adequate target size;
- no colour-only meaning;
- contrast in dark and light themes;
- usable layout at narrow widths and browser zoom;
- no hover-required essential actions.

Important semantic rule: RUI-VIS-01 must not style a flat route list to falsely imply ARIA tree semantics. `tree`, `treeitem`, expansion attributes and keyboard behavior should be used only if NAV-01 actually implements a semantic tree.

---

## 15. Theme contract

Use existing workstation semantic variables such as the current `--wb-*` family rather than introducing a competing palette.

RUI-VIS-01 may add visual shell aliases after NAV-01, but aliases should resolve to established semantic theme values.

Do not:

- hard-code an unrelated navigation palette;
- use red for normal selection;
- use verified/pilot/planned scientific state colours as generic hierarchy colours;
- introduce remote font dependencies;
- make light/dark mode change scientific meaning.

Theme remains a global utility and must not become a scientific-context control.

---

## 16. Current visual debt register for RUI-VIS-01

| ID | Current production debt | Owner after NAV-01 | Readiness decision |
|---|---|---|---|
| VIS-01 | 8–9px sidebar supporting/group text | RUI-VIS-01 | Raise readable minimums; remove redundant copy before shrinking type. |
| VIS-02 | 8–10px scientific-context labels | RUI-VIS-01 + RUI-02 surface | Harmonize carefully without increasing header height unnecessarily. |
| VIS-03 | Current sidebar is route-level only | RUI-NAV-01 | Do not solve from RUI. Consume NAV structure. |
| VIS-04 | No breadcrumb surface | RUI-NAV-01 structure / RUI visual styling | Do not invent path semantics. Visual contract frozen here. |
| VIS-05 | Current `EVIDENCE` label differs from frozen `SCIENCE` hierarchy | RUI-NAV-01 | Do not rename independently in this phase. |
| VIS-06 | Current collapsed sidebar relies strongly on abbreviations | RUI-VIS-01 | Preserve accessible labels; improve visual icon/abbreviation consistency after actual nodes exist. |
| VIS-07 | Legacy `.rui-sidebar-context` CSS remains after RUI-02 context relocation | RUI maintenance | Remove only when fresh code audit proves selectors are dead and NAV-01 overlap is understood. |
| VIS-08 | Sidebar/context chrome use separate dense scales | RUI-VIS-01 | Harmonize type, control heights, borders and surface strength after NAV-01. |
| VIS-09 | Mobile group label is 8px | RUI-VIS-01 | Increase readable minimum without crowding the dock. |
| VIS-10 | Current shell blur/surface values are locally defined | RUI-VIS-01 / later RUI-12 | Introduce aliases only after NAV primitives stabilize; avoid premature broad token rewrite. |

---

## 17. Protected files and race-sensitive seams

Before the runtime visual phase starts, Chat 1 must re-read fresh `main` and inspect all open RUI-NAV / 3DB work touching:

- `frontend/src/App.tsx`;
- `frontend/src/main.tsx`;
- `frontend/src/navigation.ts`;
- `frontend/src/components/AppNavigation.tsx`;
- any new NAV-01 navigation/tree/breadcrumb components;
- `frontend/src/components/ScientificContextHeader.tsx`;
- `frontend/src/components/WorkspaceContextHost.tsx`;
- `frontend/src/rui-shell.css`;
- `frontend/src/rui-shell-compat.css`;
- `frontend/src/rui-context-header.css`;
- global/workbench theme tokens;
- mobile drawer/sheet styles;
- shell/context Playwright acceptance.

If NAV-01 lands while a RUI-VIS branch is open, rebase/rebuild visually on fresh `main`; never overwrite newer hierarchy work with an older RUI shell.

---

## 18. RUI-VIS-01 future implementation acceptance matrix

After NAV-01 is merged, the actual runtime RUI-VIS-01 is complete only when all applicable items below pass.

### Architecture preservation

- canonical NAV-01 parentage unchanged;
- no duplicate navigation architecture;
- route IDs/deep links preserved unless NAV explicitly changes them;
- `ScientificContextHeader` remains workspace-owned;
- no scientific runtime/state duplication.

### Desktop

- expanded navigation visually coherent;
- collapsed navigation visually coherent;
- active node/ancestor distinction clear;
- real nested nodes fit without clipping;
- real breadcrumbs fit/truncate intentionally;
- central workspace remains dominant;
- no accidental document horizontal scroll.

### Tablet

- primary labels remain readable;
- hierarchy remains understandable;
- target sizes remain usable;
- breadcrumb projection remains legible;
- context header and navigation do not overlap.

### Mobile

- drawer opens/closes correctly;
- nested hierarchy remains reachable;
- Escape closes;
- focus restores;
- route navigation closes drawer;
- no viewport overflow;
- safe areas respected;
- scientific context remains independently accessible.

### Keyboard/accessibility

- visible focus on all interactive hierarchy controls;
- current location exposed semantically;
- expansion semantics match actual behavior;
- no keyboard trap;
- no hover-only critical feature;
- reduced-motion honored;
- zoom/narrow-width acceptance.

### Theme/visual system

- dark mode pass;
- light mode pass;
- readable contrast;
- no microscopic essential labels;
- no scientific status-colour misuse;
- no decorative glass stacking that harms readability.

### Regression

- RUI shell acceptance;
- RUI context-header acceptance;
- NAV-01 navigation/tree/breadcrumb acceptance;
- route/deep-link continuity;
- 3DB scientific regressions;
- React/Cesium typecheck/build;
- static-hosted artifact verification;
- complete browser acceptance;
- exact-main Pages deploy;
- public HTTPS;
- live Chromium judge flow.

---

## 19. Runtime implementation procedure once NAV-01 lands

1. Re-read fresh `main` SHA.
2. Verify NAV-01 merge and exact production status.
3. Inspect NAV-01 changed files and semantics before touching styles.
4. Reconcile any simultaneous 3DB/RUI changes.
5. Branch from fresh main, not from this readiness branch.
6. Apply visual-only integration to the NAV-provided structure.
7. Keep structural edits out unless required to fix a demonstrated accessibility bug and coordinated with NAV ownership.
8. Add/update visual and responsive browser acceptance without weakening NAV tests.
9. Run typecheck/build/science/browser suites.
10. Scope-audit the diff.
11. PR and wait for green CI.
12. Fresh-main race check.
13. Merge.
14. Verify exact-main CI.
15. Verify Pages deployment.
16. Verify public HTTPS.
17. Verify live Chromium judge flow.
18. Only then report **RUI-VIS-01 runtime LIVE & VERIFIED**.

---

## 20. Status rule

At the end of this documentation-only readiness gate:

- **RUI-VIS-01 readiness:** may be VALIDATED / MERGED / LIVE & VERIFIED once this document completes normal repository gates.
- **RUI-VIS-01 runtime:** remains **BLOCKED on RUI-NAV-01**.

The existence or deployment of this document must never be used to claim that the file-manager shell visual integration itself is live.

That distinction is intentional adherence to the merged coordination architecture and protects Ocean Canvas from parallel UI fragmentation.