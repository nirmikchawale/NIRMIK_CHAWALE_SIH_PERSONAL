# Ocean Canvas — Glassmorphism UI/UX Migration
## Phase 0: Baseline, Reference Study, Scroll Audit, and Rollback Lock

**Project:** Smart India Hackathon SIH26067  
**Product:** Ocean Canvas  
**Repository:** `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`  
**Phase:** 0 of 8  
**Status:** BASELINE LOCKED — NO PRODUCTION UI CHANGE IN THIS PHASE  
**Starting `main` SHA:** `d469c99a4caa98368c03e22f843e889391ef394f`  
**Phase branch:** `ui/glass-00-baseline`

---

## 1. Purpose of Phase 0

Phase 0 creates the safety and design foundation for the complete Ocean Canvas glassmorphism migration. It intentionally does **not** redesign production UI. It records the known-good application state, identifies every route and major interface family, maps the current scroll architecture, defines what must remain scientifically unchanged, records external design learnings, and establishes rollback and validation rules for every later phase.

The migration must remain phase-wise. A later phase must not be started implicitly.

---

## 2. Known-Good Rollback Anchor

The pre-glass production baseline is:

`d469c99a4caa98368c03e22f843e889391ef394f`

At Phase 0 start, the repository's existing workflows for this SHA were already completed successfully:

- `tests`
- `final-mvp`
- `deploy-oceantwin-pages`

This SHA is the immutable comparison point for the redesign.

### Rollback policy

1. Never force-reset public `main`.
2. Every visual phase starts from the latest accepted `main` state on a dedicated phase branch.
3. Every phase is merged independently.
4. If a phase causes a regression after merge, revert that phase's merge/commit while preserving earlier accepted phases.
5. Never mix unfinished work from a future phase into the current phase.
6. Scientific values and evidence must never be altered as a side effect of visual rollback.

---

## 3. Current Product Route Inventory

The current judge-facing application exposes six primary routes:

| Route ID | Product surface | Purpose |
|---|---|---|
| `explore` | 3D Explorer | Selectable Cesium globe and scientific Water Column 3D |
| `telemetry` | Telemetry | Depth, time, and ocean telemetry analytics |
| `compare` | Model vs Observation | Argo comparison, bias, and anomaly evidence |
| `anomaly` | Anomaly Screening | Explainable spatial extremes and Argo residual outliers |
| `data-lab` | Data Lab | Local CSV/JSON schema, quality, and provenance validation |
| `about` | Science & System | Sources, methods, limits, and architecture |

All six routes are in scope for the final redesign.

---

## 4. Current Styling Architecture

The frontend currently loads multiple stylesheet layers. The present sequence includes:

1. Cesium widget CSS
2. `styles.css`
3. `feature-upgrades.css`
4. `workbench.css`
5. `station.css`
6. `ocean-motion.css`
7. `interface-polish.css`

This layered history is functional, but it makes layout ownership and visual precedence harder to reason about because later files can override earlier rules.

### Migration rule

Do **not** delete the existing styling stack early.

Instead, later phases should introduce an explicit authoritative glass layer, for example:

```text
frontend/src/glass/
  tokens.css
  surfaces.css
  controls.css
  scroll.css
  responsive.css
```

The exact file structure may change after implementation inspection, but the principle is fixed: the redesign should converge toward semantic tokens and explicit component states rather than endless appended overrides.

Legacy CSS is removed only in the final stabilization phase after equivalence and regression checks prove it is redundant.

---

## 5. Scientific Renderer Boundary — Must Remain Stable

The glassmorphism redesign is primarily a **surrounding interface migration**.

The following scientific visualization engines remain conceptually the same unless a later prompt explicitly requests renderer work:

- Cesium Geographic / Earth view
- current scientific layer rendering
- Water Column 3D renderer
- depth relationships
- temperature / salinity / currents / chlorophyll semantics
- current vectors
- profile visualization
- Argo/model comparison values
- QC logic
- provenance
- collocation logic
- timestamps
- source identity
- downloads/evidence content

The renderer canvas can receive carefully designed framing, labels, overlays, and controls, but glass blur must **not** be applied to the actual Cesium/WebGL scientific canvas.

### Why

A glass UI should make the scientific field easier to read, not repaint or soften the scientific evidence. The Earth and Water Column views are the visual anchors. The glass system floats above and around them.

---

## 6. Current Scroll Architecture — Baseline Findings

The current implementation has multiple independent overflow systems. This explains why scrolling can feel correct in one region but blocked or inconsistent in another.

Known patterns include:

- desktop root/app regions using hidden overflow
- mobile root switching to page-level auto scrolling
- a `100dvh` workbench viewport on mobile
- workspaces that deliberately hide overflow
- route pages using their own `overflow-y: auto`
- control and evidence drawers using internal vertical scrolling
- analysis mode using another independent scroll owner
- navigation/feature rail using horizontal scrolling
- mobile sensor disclosure using a bounded internal scroll area
- modal/presentation surfaces that can own vertical scrolling

These patterns are not individually wrong; the problem is that scroll ownership is distributed across several ancestor/descendant layers and media-query overrides.

### Phase 1 target scroll ownership

| Context | Intended scroll owner |
|---|---|
| Desktop app shell | None |
| Cesium / Water Column canvas | None |
| Control drawer | Drawer content |
| Evidence drawer | Drawer content |
| Analysis split panel | Analysis content |
| Navigation strip | Horizontal only when required |
| Telemetry route | Route content container |
| Model vs Observation route | Route content container |
| Anomaly Screening route | Route content container |
| Data Lab route | Route content container |
| Science & System route | Route content container |
| Mobile Explorer | Fixed app viewport; active sheet/drawer owns vertical scroll |
| Expanded mobile sensor list | Sensor disclosure region |
| Modal/dialog | Dialog content if content exceeds viewport |
| Background while modal open | Locked |
| Wide data tables | Table wrapper, only when necessary |

### Phase 1 required engineering rules

- one explicit vertical scroll owner per context
- no accidental double vertical scrollbar
- no unreachable lower controls
- no horizontal application overflow
- correct `min-height: 0` / `min-width: 0` on shrinking grid/flex descendants
- dynamic viewport units with sensible fallback
- mobile safe-area insets
- no background scrolling underneath blocking dialogs
- intentional `overscroll-behavior`
- wheel, trackpad, touch, and keyboard reachability where relevant
- no scroll traps created by Cesium interaction regions

---

## 7. Interaction Inventory — Everything Must Eventually Join the Glass System

The final migration must audit more than visible `<button>` elements.

In scope:

- primary navigation
- route navigation
- header controls
- theme control
- refresh control
- presentation/focus controls
- workspace mode controls
- geographic / Water Column switches
- variable selectors
- depth selectors and presets
- range sliders
- time controls and playback
- colourbar/palette controls
- opacity controls
- source selectors
- observation/profile chips
- imagery/basemap controls
- camera controls
- zoom controls
- evidence/provenance controls
- download actions
- tables
- tabs
- accordions / `<summary>`
- selects
- number/text inputs
- file import controls
- cards that act as controls
- close buttons
- icon buttons
- modal actions
- tooltips/popovers
- disabled states
- loading states
- empty states
- warnings/errors
- keyboard focus states
- any `[role="button"]`-style interaction
- dynamically rendered controls

No legacy interaction should remain visually accidental by the end of Phase 6.

---

## 8. Magnific Glassmorphism Reference Study

The supplied Magnific glassmorphism collection is being treated as **reference and learning material only**. No source artwork, layout, or component set is to be copied as-is.

The public collection is dynamically rendered, so not every thumbnail is exposed through text retrieval. However, the accessible result families and premium items reveal the major visual directions represented in the collection. The most relevant references reviewed for Ocean Canvas include:

### A. Dark glassmorphism dashboard/UI kits

- **Dark glassmorphism UI kit dashboard elements** — strong fit for Ocean Canvas because the product already has a dark scientific field and cyan accents.
- **Modern glassmorphism dashboard UI kit with transparent data visualization widgets** — relevant for evidence, telemetry, comparison, and anomaly analytics.
- **Glassmorphism dashboard UI layout template** — useful for spacing and hierarchy patterns.

### B. Minimal glass component systems

- **Modern glassmorphism user interface elements kit for web and app design** — useful for buttons, search, input, and state consistency.
- **Glassmorphism UI elements kit with transparent search bar and icons** — relevant to the header and compact controls.
- **Modern glassmorphism UI elements kit** — useful for consistent primitives across desktop and mobile.

### C. Bento / modular panel systems

- **Modern bento-style glassmorphism UI design with frosted glass transparent panel layout**
- **Glass morphism bento grid UI template with frosted glass elements**

Bento principles can help secondary pages, but should **not** dominate the Explorer because the Explorer needs the globe and Water Column views to remain primary.

### D. Liquid / glossy glass systems

- **Modern liquid glass UI element / app icon kit**
- **Set of liquid glass buttons and panels**
- **Transparent glass buttons and banners**

These are visually attractive but should be used sparingly. Heavy liquid-glass distortion on every control would make the scientific workstation look decorative and could increase rendering cost.

### E. Frosted background systems

- **Glassmorphism UI background with frosted glass effect**
- **Modern glassmorphism UI background with frosted glass effect**

These reinforce the need for depth, subtle blur, and controlled transparency, but Ocean Canvas should not blur the scientific renderer itself.

---

## 9. Chosen Ocean Canvas Design Direction

### Selected direction: **Minimal Dark Scientific Glass**

This is a synthesis of the strongest reference principles, not a copy of any one template.

Primary traits:

- Earth / Water Column renderer remains visually dominant
- fewer persistent containers
- more negative space
- dark neutral translucent surfaces
- restrained cyan edge/highlight system
- small number of blur layers
- thin luminous borders rather than heavy glow
- low-noise shadows
- compact typography hierarchy
- selected states that are unmistakable without excessive neon
- secondary metrics can use modular/bento grouping
- no decorative blobs competing with ocean data
- consistent dark/light theme token model
- graceful fallback when `backdrop-filter` is unavailable

### What we will deliberately avoid

- blurring the Cesium/WebGL canvas
- applying `backdrop-filter` to every small button
- rainbow iridescence across the entire app
- large blurry decorative gradients over charts
- excessive glossy reflections
- floating glass layers that obscure scientific values
- copying one commercial template's exact composition
- turning the app into a generic SaaS dashboard

---

## 10. Prototype Interpretation

The minimalist reference prototypes prepared for this migration should be interpreted as **visual direction only**.

The strongest layout principle is:

> **scientific renderer first; glass interface second**

Desktop Explorer should feel like a scientific instrument over the ocean field:

- compact structural header
- unobtrusive navigation
- one primary control surface
- one evidence surface
- optional contextual overlays
- maximum uninterrupted globe / water-column area

On mobile:

- renderer remains visible
- controls move into an intentional sheet/drawer
- sheet owns scrolling
- important map controls remain reachable
- touch targets remain practical
- app body should not compete with drawer scrolling

---

## 11. Responsive Validation Matrix

Each visual phase should inspect, at minimum:

| Viewport | Purpose |
|---|---|
| `390 × 844` | common phone portrait |
| `430 × 932` | large phone portrait |
| `768 × 1024` | tablet portrait |
| `1280 × 720` | projector / small laptop |
| `1366 × 768` | common laptop |
| `1440 × 900` | desktop/laptop |
| `1920 × 1080` | full desktop |

Intermediate widths should be tested whenever layout mode changes.

---

## 12. Accessibility Baseline for the Redesign

Later phases must preserve or improve:

- keyboard access
- `:focus-visible`
- readable text over glass
- state distinction beyond colour alone
- practical touch targets
- labels associated with controls
- disabled state clarity
- reduced-motion support
- modal focus behaviour
- escape/close behaviour where appropriate
- contrast under both light and dark themes

Transparency is a visual effect, never a reason to reduce legibility.

---

## 13. Performance Budget Principles

Ocean Canvas already renders GPU-intensive 3D content. Therefore:

- blur should be applied to a small number of parent surfaces
- nested interactive children should normally use translucent fills/borders rather than independent blur
- avoid animated filter values
- avoid full-screen permanent blur over Cesium
- avoid blur on every table cell or repeated chip
- avoid expensive decorative pseudo-elements covering the full viewport
- preserve smooth globe interaction and Water Column manipulation

---

## 14. Phase Plan

| Phase | Scope |
|---|---|
| 0 | Baseline, rollback, route/component inventory, reference study, scroll audit |
| 1 | Scroll + viewport foundation |
| 2 | Glass design-system tokens and primitives |
| 3 | Global shell: header, navigation, footer, workspace controls |
| 4 | Explorer + Geographic + Water Column 3D + overlays |
| 5 | Telemetry, Compare, Anomaly, Data Lab, Science & System |
| 6 | Full interactive-component completion audit |
| 7 | Mobile/tablet/responsive refinement |
| 8 | Accessibility, performance, regression, release candidate, deployment verification |

Every phase stops before the next phase begins.

---

## 15. Phase 1 Acceptance Criteria — Not Started Yet

Phase 1 may begin only after explicit instruction.

It will be complete when:

1. Every route has one documented vertical scroll owner.
2. Desktop shell does not accidentally page-scroll.
3. Mobile route/sheet strategy is deterministic.
4. Panels can reach their final control/content item.
5. No route exposes accidental horizontal page overflow.
6. Modal/background scroll interaction is correct.
7. Cesium wheel/pointer interaction does not create an unrecoverable scroll trap.
8. `100vh`/`100dvh` usage is normalized intentionally.
9. Safe-area insets are respected on mobile.
10. Existing scientific behaviour is unchanged.
11. Typecheck and production build pass.
12. Existing relevant CI/regression suites remain green.
13. Representative desktop and mobile browser acceptance passes.

---

## 16. Phase 0 Result

**Completed in Phase 0:**

- known-good pre-glass SHA recorded
- dedicated phase branch created
- current routes documented
- styling cascade documented
- renderer/science boundary defined
- scroll architecture problem mapped
- target scroll ownership defined
- interaction coverage defined
- Magnific reference principles reviewed
- selected design direction documented
- responsive/accessibility/performance constraints documented
- phase-by-phase rollout locked
- Phase 1 acceptance criteria written

**Intentionally not performed in Phase 0:**

- no production CSS changes
- no React visual changes
- no renderer changes
- no scientific changes
- no merge into `main`
- no deployment triggered
- no Phase 1 work

---

## 17. Design Decision Log

### Decision 0.1 — Preserve scientific renderers
The Cesium Earth view and Water Column 3D remain the scientific visual core. Glassmorphism modifies the UI shell and controls around them, not their scientific meaning.

### Decision 0.2 — Minimal dark scientific glass
The redesign will follow a restrained minimal glass language rather than a heavily glossy/liquid aesthetic.

### Decision 0.3 — Scroll before styling
Scroll/viewport architecture is corrected before large-scale visual restyling.

### Decision 0.4 — Parent-surface blur
Blur is concentrated at panel/surface level, not duplicated across every child control.

### Decision 0.5 — Rollback per phase
Each phase is independently reversible.

### Decision 0.6 — External references are principles, not templates
Magnific references are used to extract visual principles only; Ocean Canvas retains its own scientific product identity.

---

**Phase 0 is complete. Phase 1 is explicitly NOT STARTED.**
