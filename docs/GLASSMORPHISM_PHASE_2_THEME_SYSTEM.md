# Ocean Canvas — Phase 2 Master Prompt

## Mission
Transform the Phase 1 scroll/viewport-safe Ocean Canvas interface into a restrained but expressive glassmorphism design system, using the supplied glassmorphism visual references as aesthetic guidance while preserving the product's identity as a scientific ocean-data workstation.

The direction is **Minimal Scientific Glass**, not decorative glass everywhere. Glass must improve hierarchy, depth, focus and atmosphere without reducing scientific readability.

## Immutable scientific constraints
- Do not alter scientific source values, model/observation comparisons, QC rules, provenance, units, time/depth semantics or derived statistics.
- Do not recolour scientific scalar/vector colour maps as part of interface theming.
- Do not change Cesium Earth geometry, camera semantics, water-column coordinates or renderer calculations.
- Preserve the Earth → India → ocean journey and all existing interaction paths.
- Preserve the Streamlit scientific reference/fallback architecture.
- Treat renderer canvases as scientific surfaces; glass belongs primarily to the UI around them.

## Phase dependency
Phase 2 is stacked on Phase 1 branch `ui/glass-01-scroll-foundation`, commit `9c7e8700a00c89bba6f0244fae7496d074071dd7`.

Phase 2 branch: `ui/glass-02-theme-system`.

Do not merge Phase 2 before Phase 1 is validated/merged or otherwise reconciled. Keep production `main` untouched until acceptance is complete.

## Primary user requirement
Replace the binary dark/light mental model with a rich appearance gallery. The end user should be able to choose among many feasible glassmorphism atmospheres on desktop and mobile.

The selector must be more than two states and must include dark, light, oceanic, aurora, neutral, mineral and warm families.

## Implemented theme catalogue
### Dark glass
1. Abyss Noir — deep navy / cyan scientific baseline.
2. Aurora Borealis — teal / violet / polar green.
3. Midnight Indigo — ink blue / indigo / electric blue.
4. Deep Sea Emerald — blue-black / emerald / teal.
5. Bioluminescent Cyan — marine black / luminous cyan.
6. Coral Dusk — plum-black / coral / rose.
7. Solar Amber — charcoal / amber / warm orange.
8. Graphite Clear — neutral graphite / silver-blue.

### Light glass
9. Polar Frost — frosted pearl / cold blue.
10. Arctic Mist — cool white / slate blue.
11. Pearl Lagoon — pearl / aqua / marine teal.
12. Glacier Mint — ice mint / mineral green.
13. Rose Quartz — warm white / rose / berry.
14. Lavender Haze — pale violet / blue diffraction.
15. Sandglass — warm ivory / bronze / muted ocean slate.
16. Cloud Prism — neutral cloud white / cyan-violet edges.

## Theme-system architecture
- Theme choice is represented by a stable `GlassThemeId`.
- Theme definitions are centralized in `frontend/src/theme.ts`.
- Interface colour, border, blur, shadow and atmosphere use semantic CSS variables rather than per-component hard-coded colours.
- Theme application uses `data-glass-theme` on the document root.
- A compatible `data-theme="dark|light"` remains available to legacy styles during migration.
- User selection persists locally under `oceantwin-glass-theme-v2`.
- Existing legacy `oceantwin-theme` is read only as a migration hint.
- The glass selector is additive and non-destructive; the old binary button remains hidden as a rollback-compatible implementation detail in this phase.

## Glass tokens
Each theme controls the following semantic layers:
- canvas background
- deep canvas background
- translucent panel
- strong translucent panel
- soft panel highlight
- normal border
- strong border
- primary text
- muted text
- accent
- secondary accent
- accent-foreground contrast colour
- three ambient background orbs
- surface shadow
- subtle shadow
- blur amount
- saturation amount
- surface radii

## Surface hierarchy
### Level 0 — scientific renderer
Cesium and Water Column 3D remain optically clean and scientifically authoritative. Apply only a restrained frame/border around the renderer container.

### Level 1 — primary glass panes
- app header
- navigation rail
- control panel
- evidence inspector
- observation/profile inspector
- analysis split inspector
- provenance drawer
- presentation guide

Use medium translucency, strong blur, clear border and readable contrast.

### Level 2 — secondary glass cards
- source cards
- telemetry cards
- comparison cards
- anomaly cards
- data-lab cards
- method cards
- metric cards
- scientific colourbar shell

Use slightly lower blur/shadow and maintain clear grouping.

### Level 3 — interactive glass controls
Buttons, tabs, segmented controls, select inputs and theme swatches receive restrained transparent fills and high-contrast active states.

## Theme selector UX
Desktop:
- Header control labelled `GLASS` + active theme short name.
- Clicking opens a large translucent appearance gallery.
- Gallery shows visual preview, theme name, family feel, dark/light type and swatches.
- Filters: All 16 / Dark glass / Light glass.
- Selected state is obvious.
- Gallery stays inside viewport and scrolls internally.

Mobile:
- Same control remains reachable in the header.
- Gallery becomes a bounded bottom-oriented floating sheet.
- It must respect safe areas and never exceed the dynamic viewport.
- Single-column theme cards.
- Internal scroll only; no document scroll leak.

## Accessibility requirements
- Theme choices are native buttons.
- Current selection uses `aria-pressed`.
- Trigger reports active appearance and expanded state.
- Escape closes the gallery.
- Clicking outside closes the gallery.
- Focus remains keyboard reachable.
- `prefers-reduced-motion` removes nonessential theme-card motion.
- `prefers-contrast: more` strengthens borders and pane opacity.
- Glass fallback exists when `backdrop-filter` is unsupported.
- Never encode scientific meaning by UI-theme colour alone.

## Performance requirements
- No animated full-screen blur filters.
- Limit high-cost backdrop blur to bounded UI surfaces.
- Lower blur on mobile.
- Ambient orbs are static and pointer-inert.
- Avoid theme-specific image assets; themes are token-driven.
- No scientific data reload when appearance changes.

## Acceptance criteria
1. Exactly 16 selectable themes are available.
2. At least 8 dark and 8 light presets are present.
3. Selection persists across reload.
4. Theme selection changes interface atmosphere but not scientific source/data state.
5. Desktop gallery is fully within viewport.
6. 390 px and 430 px mobile galleries are fully within viewport.
7. Phase 1 scroll ownership remains intact.
8. No horizontal overflow is introduced.
9. Existing Explore, Telemetry, Compare, Anomaly, Data Lab and About routes remain usable.
10. Cesium and Water Column wheel/camera interaction remains available.
11. TypeScript typecheck passes.
12. Production build passes.
13. Existing browser suite still passes.
14. New glass-theme Playwright acceptance tests pass.
15. Scientific/API/fallback CI remains unchanged and green.

## Validation strategy
- TypeScript typecheck.
- Production frontend build.
- Existing Playwright suite discovery.
- Full hosted-browser suite after static evidence export.
- New `glass-theme.spec.ts` checks:
  - all 16 presets exposed;
  - light/dark compatibility scheme updates;
  - persistence after reload;
  - scientific source remains unchanged;
  - mobile sheet geometry stays inside viewport;
  - filter counts are correct.

## Rollback strategy
Phase 2 is additive and branch-isolated. If rejected, abandon `ui/glass-02-theme-system` and return to the Phase 1 branch. Do not force-reset production `main`.

## Definition of done
Phase 2 is complete only when the theme system is implemented, the 16 variants are selectable and persistent across desktop/mobile, browser and build tests pass, scientific behavior remains unchanged, and the stacked Phase 2 PR is reviewable without touching production.
