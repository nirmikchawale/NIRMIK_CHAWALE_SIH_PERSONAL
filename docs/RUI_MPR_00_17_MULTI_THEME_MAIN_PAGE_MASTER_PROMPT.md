# Ocean Canvas — RUI-MPR Multi-Theme Main Page Restructure
## Autonomous master prompt, 18 × 20-minute phase plan, and recovery ledger

**Workstream:** RUI-MPR (Responsive UI — Main Page Restructure). Separate from RUI-NAV, RUI-VIS, RUI-00..15, and scientific 3DB-00..15.
**Repository:** https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL
**Production:** https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore
**Baseline verified on 2026-10-08:** main SHA `1ce58c3e644e187c5ea0c497adea2afd1efd0b91`; latest main `tests`, `final-mvp`, and `deploy-oceantwin-pages` workflow runs reported success. Recheck before every phase. Existing 3DB-12 PR #161 and RUI-VIS-01 preflight PR #140 remain independently owned.
**Approval:** User approved four visual reference segments and the structural design direction. Visual references are target *layouts*, not exact science screenshots, source values, or a single locked theme. Real UI must be judged by screenshot comparison and functional gates, not assumed pixel perfect.

### PRIMARY EXECUTION INSTRUCTION TO FUTURE CHATGPT WORK SESSIONS

You are the visual/UI restructure lead for Ocean Canvas SIH26067. Continue from the last VERIFIED RUI-MPR checkpoint in this file and main branch. Check current main SHA, open PRs, relevant CI and Pages deployment before editing. Never replay a completed phase. Do **one timeboxed phase at a time**. Target <=20 minutes of ACTIVE implementation per phase (3 phases/hour as an optimistic planning cadence). A build, browser test, CI gate, merge, or deployment may exceed this. Never call a phase complete without required evidence. At the 20-minute work boundary, make a recoverable, documented checkpoint on a dedicated branch and continue it in the next session rather than truncating tests, misreporting deployment, or piling unverified work onto main.

**This is a cosmetic/structural UI migration, not a scientific project or new scientific roadmap.** No scientific algorithms, model values, backend endpoints, scientific payloads, materialized block registries, geometry semantics, QC rules, scientific source manifests, source hashes, native time/depth semantics, source availability truth, comparison calculations, observation matching, or fake samples may change. Shared `App.tsx` changes are permitted strictly for presentation composition, prop wiring, view navigation, current controls, scrolling and source-neutral synchronization *presentation* only. If two real simultaneously mounted renderers require mutation of the scientific-data contract or scientific 3DB engine, STOP, open a compatibility issue/checkpoint, and request the scientific owner's integration rather than silently expanding scope. Never claim display-label/DOM reconciliation proves synchronized payloads.

**Strictly preserve the full existing 16-theme system.** Arctic Mist is a design reference *only*. Never hardcode Arctic colors, backgrounds, SVG colours, light-only typography, or theme imagery into new UI. Preserve the existing ThemePicker, its persisted localStorage behavior, the `data-glass-theme` attribute, and renderer colourmaps. Use shared design tokens from `frontend/src/glass-system.css`; extend them only for reusable semantic needs. Every new UI component must visibly and functionally work in ALL 16 themes, including dark, light, reduced-motion, focus and high-contrast modes.

### Frozen 16-theme registry

Canonical authority: `frontend/src/theme.ts` and `frontend/src/glass-system.css`, not generated imagery.

**Eight dark:** abyss-noir, aurora-borealis, midnight-indigo, deep-sea-emerald, bioluminescent-cyan, coral-dusk, solar-amber, graphite-clear.
**Eight light:** polar-frost, arctic-mist, pearl-lagoon, glacier-mint, rose-quartz, lavender-haze, sandglass, cloud-prism.

Do not rename, delete, reorder, silently change the default `abyss-noir`, or alter saved selection keys. Preserve coherent rounded corners across all 16 themes (large islands 24–28 px, medium 18–22 px, controls 12–16 px, pills 999px, adjusted where necessary for density). Use a single professional icon system (current SVG/Lucide-like symbols or existing project icon assets) with meaningful alt/aria names; use semantic emojis only where they improve meaning, never emoji-only inaccessible buttons. State semantics: active accent from theme, science verified green where actually verified, warning amber, dangerous errors red, inactive muted/disabled, pilot/materialized/planned each honestly differentiated. Avoid treating all source-backed data as independently validated.

### FROZEN PAGE HIERARCHY

1. **Scroll-away app header:** Ocean Canvas brand and team logo interaction, RefreshControl, 16-theme Glass picker, Present Demo, relevant action(s), preserved error/degraded reporting; remove "scroll to explore" instructional arrow; not fixed/sticky. The global Workspaces entry must remain reachable.
2. **Workspace Mode island:** Explorer, Analysis Split, Presentation, Focus 3D in an independent horizontal row.
3. **3D Explorer Feature Directory island:** uninterrupted horizontally scrollable directory with Overview, Workspace, Block System, Scene Controls, Variables, Display Range, Depth & Section, Time, Observations, Render, Context & Info when currently supported; no empty spacer in place of a feature, no overlapping modes. Every directory item must navigate to a real relocated functional target.
4. **Ocean Intelligence / Choose Your Ocean island:** label, heading and subtitle ABOVE three cards in one full-width row: GLORYS baseline, INCOIS multi-time, INCOIS chlorophyll. Preserve unavailable-disabled states and real source switching. Beneath cards: compact FULL-WIDTH Active Main Block disclosure, then existing Field overview, Compare observations, Open Data Lab links. Place a dedicated Ocean Intelligence action in Active Main Block; do not substitute a duplicate header Sources & QC button. Distinguish this source-choice island from the bottom `evidence-status-pill` (relocate the latter's *function* to the Ocean Intelligence destination).
5. **Smart Dual-View Navigator** directly above 3D workspaces: two strong names Geographic 3D | Water Column 3D; active emphasized, inactive visually subdued, BOTH clickable. Sticky/compact only while in the TWO visualization sections; never use sticky global header. Clicking moves to the named full-width section and automatically updates active state on manual scrolling. Preserve reduced-motion behavior.
6. **Full-width Geographic 3D:** dominant interactive Cesium globe ~72–78% width, right independently scrollable tool dock ~22–28% / ~340–420px as viewport allows, responsive collapse/sheet on mobile. Visible camera controls, inspection callout and compact scientific legend on canvas; all complex controls in progressive dock. Height normally ~75–90dvh, never force all page content into one screen.
7. **Full-width Water Column 3D BELOW Geographic 3D** (not side-by-side): independently scrollable right dock, same component language, one-to-one matching genuine data source/block/time/variable/depth/compatible observations. If selected region/source has no scientifically eligible water column, show honest non-synthetic unavailable/planned state. No separate full-width "Additional Scientific Features" placeholder below. Retain small source disclaimer/footer and existing navigable deeper workspaces.

**Global Workspaces navigation:** Adaptive 68–72px icon rail on desktop (Explore, Analyze, Data, Science), expanding into accessible, dismissible ~280–320px overlay drawer WITHOUT resizing scene/camera. Explore -> 3D Explorer; Analyze -> Telemetry, Model vs Observation, Anomaly Screening; Data -> Data Lab; Science -> Science System. On mobile use launcher + navigation drawer; preserve six existing routes, hash/deep-link context, focus restoration and Escape. The approved FOUR reference images collectively specify the target interaction and style; no single screenshot describes the entire scrollable document.

### UI-to-UI traceability (no orphaned feature)

- App brand/ARGO logo overlay, refresh, 16-theme picker, presentation guide, focus/exit, controls show/hide, warning/degraded/verified -> compact header, Workspace Mode, or Ocean Intelligence status as appropriate; all existing actions remain.
- `AppNavigation` groups, breadcrumbs, collapsed state, keyboard/mobile -> Workspaces mini rail/overlay drawer.
- `ExplorerDirectoryNav` buttons -> actual section/dock anchors and responsive scrolling; remove duplicate workspace controls *from the directory island* only after separately relocating them.
- `SourceWorkbench`: original three cards, availability, three quick links -> Ocean Intelligence island; heading/subheading above cards.
- `ScientificContextHeader` / `ScientificContextBar` / `WorkspaceContextHost`: active baseline/pilot/planned scientific block, source, variable, native time, depth, profile, region, origin, time kind, deep link, materialized stepper, evidence availability, degradation, disclaimer and return-to-Explorer -> expandable Active Main Block; retain globally accessible context on other routes.
- `Phase35MainBlockEngine`: ocean/land coverage counts (read manifest, do not invent), search, region filter, source-backed vs planned grid, block selection/activation, native dates, bounds, checksum/source information -> Geographic dock "Block & Region" catalog dialog.
- `Phase3ArabianAtlas`: preserve launcher and sector information in Block System/advanced Block & Region.
- `OceanGlobe` main-block selector/status/legend; fit block, fit field, enter water column; Argo anchored callout, source-backed multi-sensor chips, geographic inspection, basemap automatic HD/offline, journey replay/skip, explanatory HUD, depth indication, compass/camera presets/zoom, field legend, vector and volume notes, fallback -> Geographic canvas / corresponding dock group.
- `ControlPanel`: variable options, true ranges, info; depth slice/volume mode; actual depth zones/slider; native timeline with previous/next/play/pause/speed/Argo markers; observations; point opacity, vertical exaggeration, iso toggle/value, caveats -> divided into own Geographic and Water Column accordion groups. Preserve true native availability.
- `ScientificColorbarHud`: interactive min/max threshold handles, histogram, palette choices thermal/viridis/icefire, linear/log eligibility -> compact on-scene legend and accessible display-range accordion; no nonworking duplicate.
- `WaterColumn3D`: actual source volume, selected layer, lon/lat/depth axes, hover readout, scientific legend, compass, eased zoom, orbit/touch/keyboard presets, current u/v-only explanation, isosurface, opacity, positive-down depth, planned/loading/unavailable fallback -> Water Column canvas and own dock.
- `VisualizationDock`: model/region/time/observation summary and view switch -> Smart Dual-View Navigator plus linked block badge/context summary; behavior changes to scroll rather than toggle two overlaid layers, but preserve scientific eligibility.
- `EvidenceRail` and `evidence-status-pill`: field overview, explanatory text, depth coverage, model/observation summary, sources/methodology -> dedicated Ocean Intelligence destination, preserving open/close, loading/unavailable and actions.
- `ProvenanceDrawer`: providers, DOI, QC acceptance, method, source/renderer checksums, withheld claims, scientific limitations -> Ocean Intelligence scientific/QC/provenance hub, no information loss.
- `ProfilePanel`, `ImportedObservationPanel`, `AnalysisSplitPanel`: depth plots, Argo matching/MAE/RMSE/bias, CTD/Glider/BGC where genuinely available, inspection, comparison, exports CSV/JSON -> link from observation controls to existing inspector/Analyze workspace; no new below-column card wall.
- `mobile-explore-tray`, mobile sheet, browser fallback, `science-footer`, error/toast, keyboard Ctrl+B and Escape -> preserve and adapt, never suppress truth.

### NEW SCROLL / INTERACTION CONTRACT

- Three levels of navigation NEVER conflated: global workspaces; Explorer feature directory; Geographic↔Water Column section navigation.
- Header and islands naturally leave the viewport on scrolling. The Dual-View Navigator sticks ONLY through the paired model region. Use actual scrolling-container geometry, a stable explicit anchor and scroll-margin to prevent controls being hidden. Make nav state track section visibility. Dedicated View-switch button in each dock's visible header; no need to scroll to the end of a long dock.
- Document or app-root scroll owner must be ONE deliberate system. The existing `scroll-foundation.css` and `viewport-lock.css` currently lock `html/body/#root` and scroll `.station-workspace`; do not layer an arbitrary CSS override. Refactor carefully only for Explore, preserving other routes, and test wheel chaining, touch, focus, fixed overlays and Cesium wheel vs page wheel.
- Globe wheel zoom remains globe zoom; Water Column canvas wheel zoom remains 3D zoom; dock wheel scrolls its own controls; navigator switches section at any dock position, including at scroll boundary; use accessible scrollbar or arrow actions only if actually implemented.
- Two real renderer sections in the page means UI composition must keep them mounted/loaded where eligible; reuse the existing scientific payload/props without duplicating science; account for GPU pressure, offscreen work, resize and refresh. If this cannot be done without scientific-engine edits, STOP with an explicit seam request. Never render old/stale scientific values for a newly selected block/source/time.

### 18 SMALL, ORDERED PHASES: THREE PER HOUR TARGET

Each phase: one single responsibility, intended active work <=20 minutes, max 3 per hour, one small branch/PR/checkpoint. If too large, split at a safe boundary and do not call it done. Complete prerequisite tests before follow-on work.

**HOUR 1 — THEME & SCROLL FOUNDATION**
- **MPR-00 — Baseline & 16-theme contract:** inventory source, four approved visual references, all 16 theme IDs, science ownership boundaries, feature traceability; publish THIS master prompt and ledger on separate branch; no UI/science code. Pass: verified registry count 16, one source-of-truth doc, no code diff.
- **MPR-01 — Design tokens, rounded styling & icon mapping:** introduce only reusable theme-aware semantic tokens and component layout CSS, avoid duplication/hardcoded Arctic; retain 16 selections and persisted scheme. Pass: representative dark/light checks, no renderer-palette delta.
- **MPR-02 — Explore scroll foundation:** remove viewport-locked header behavior for Explore only; leave header and top islands scrollable away while protected non-Explore workspaces remain functional. Pass: wheel/touch navigation with globe and dock scroll separation, no viewport overflow.

**HOUR 2 — PRIMARY NAVIGATION**
- **MPR-03 — Adaptive Workspaces mini rail/drawer:** preserve four groups and six pages, keyboard focus/aria, overlay width no canvas push. Pass: route/back/deep-link/navigation/desktop+mobile tests.
- **MPR-04 — Workspace Mode dedicated island:** Explorer/Analysis Split/Presentation/Focus 3D move to one independent strip; preserve demo/exit, no duplicates. Pass: mode switches work with selected source/time intact.
- **MPR-05 — Explorer Feature Directory strip:** all current navigation names/targets, continuous horizontal keyboard/swipe scroll, responsive controls, no blank card/overlap. Pass: targets work even within relocated dock.

**HOUR 3 — SCIENTIFIC CONTEXT CHROME (NO SCIENCE CHANGES)**
- **MPR-06 — Ocean Intelligence source selector:** heading/subheading above cards, three original source modes with actual disabled reasons; three quick links. Pass: source selection remains genuine and resets only as currently designed.
- **MPR-07 — Active Main Block disclosure:** full-width identity strip below source cards, expanded scientific context with block navigation/native selections/provenance summary/deep link/status/planned lock; retain global context on other routes. Pass: no content lost, no fake validation.
- **MPR-08 — Ocean Intelligence evidence hub:** move existing bottom Ocean Intelligence pill behavior and Sources & QC into a dedicated button in the Active Main Block area; retain EvidenceRail/ProvenanceDrawer functionality with one canonical home. "AI Copilot" future-only must not look active. Pass: provenance, source DOI and degradation inspectable.

**HOUR 4 — VIEW NAVIGATION & GEOGRAPHIC**
- **MPR-09 — Smart Dual-View section navigator:** Geographic 3D / Water Column 3D, active dimming, sticky only within model region, smooth reduced-motion-safe scroll, per-dock switch shortcut. Pass: click transitions independent of dock scroll; selected scientific state untouched.
- **MPR-10 — Geographic full-width section shell:** globe dominant, ~72–78% visual width, own ~22–28% dock; collapsible responsive layout, preserved native Cesium camera and overlays. Pass: no canvas clipping, resize or legend collisions.
- **MPR-11 — Geographic control relocation:** move block/region/catalog, variables/layers, genuine time, depth zones, observations, display range, basemap, camera, quality into labeled responsive progressive dock. Pass: prior controls reachable and wired; no duplicate actions or scientific drift.

**HOUR 5 — WATER COLUMN & LINKED SCIENCE PRESENTATION**
- **MPR-12 — Water Column full-width section shell:** separate full-width Water Column BELOW Geographic, independently scrollable right dock, own on-canvas zoom/legend, scoped resource management. Pass: supported real scientific payload displayed, no stale/copy geometry.
- **MPR-13 — Water Column control relocation:** variable display, native depths/section/camera presets, genuine observation/profile, time, colourmap, opacity, vertical exaggeration, iso threshold and telemetry to right accordion. Pass: depth/data values unchanged.
- **MPR-14 — Unified linked-view UI gate:** when geographic block/source/time changes, both visualizations accept only their matching scientific payloads and show honest loading/planned/unavailable state. NO changes to algorithms/registry/API/source files. If existing scientific contract cannot guarantee this using UI-only bindings, BLOCK and hand off to 3DB owner. Pass: same source/block/native time/variable/depth, no stale mismatches in assertions.

**HOUR 6 — RESPONSIVE, THEME MATRIX & DEPLOY**
- **MPR-15 — Inspectors, accessibility & responsive:** legacy profile drawers, presentation/focus demo, callouts, fallback/errors, footer, mobile tray/drawer, keyboard/pointer/touch and reduced motion; no orphaned interactions. Pass: 320/390/768/1024/1366/1440-width smoke.
- **MPR-16 — All-16 glass theme visual acceptance:** automated theme-loop screenshots on representative screens and layouts; check text contrast, focus, icons, radius, scrollers, charts and statuses. Persist chosen theme and confirm scientific colourbar mapping independent. Pass: all 16, not only Arctic; no broken dark themes.
- **MPR-17 — Full regression, merge, Pages deployment & live QA:** run required typecheck/build, existing science/CI, Playwright desktop/mobile, 16-theme targeted acceptance, compare approved four UI references at relevant viewports, check source & block provenance, no backend/scientific diff, merge sequentially only once gates green, inspect GitHub Pages workflow and public URL. If unavailable, report BLOCKED/PARTIAL, never falsely LIVE.

### PER-PHASE CHECKLIST / EVIDENCE

1. Read authoritative `main` SHA, open RUI/3DB PRs and changed paths; stop on concurrent scientific/frontend shared-file changes until reconciled.
2. Read this document + last phase ledger and relevant source files. Say exactly what is already DONE vs next TODO.
3. State exact phase boundaries, expected changed files, non-changes, and acceptance checks.
4. Perform the smallest CSS/component composition change; preserve all existing science states, labels and generated input payloads.
5. Test: React/TS typecheck; frontend build; relevant Playwright functional tests; existing science integration when shared App/renderer seams touched. Use screenshot visual QA for layout phases; compare at >= desktop/tablet/mobile.
6. Check all 16 themes for each broadly shared changed surface; representative light/dark interim checks are fine, but MPR-16 is full matrix. No theme lock-in.
7. Audit diff: NO modifications under backend/scientific transforms/canonical artifacts/datasets/registry/provenance/manifest folders. UI-only App prop/call-site changes are okay; scientific renderer algorithm edits are NOT.
8. Write/update ledger with source main sha, branch sha, PR, changed files, tests, screenshots, blockers, next exact action.
9. Open an isolated PR. Do not merge if failed/unobserved required CI or visual gates, or if main drift introduced conflict.
10. Only after merge + Pages publication + observable acceptance can visual phases say LIVE & VERIFIED. Never infer result from draft mockup. Report production link.
11. Time-box: if <=20min budget ends early, preserve safe commit and provenance; if work cannot be safely stopped, explain and save a recoverable branch; do not count unfinished phase.
12. At user interruption/resume: reopen fresh repository states, find last completed phase in ledger, continue exactly from first unmet gate, no repeated commits.

**Status labels:** PLANNED → IN PROGRESS → COMMITTED → PR OPEN → CI VERIFIED → MERGED → DEPLOYED → LIVE & VERIFIED. Use BLOCKED with cause and next step when evidence is missing.

### INITIAL LEDGER — MPR-00

- Phase: MPR-00 Baseline & 16-theme contract
- Baseline main: `1ce58c3e644e187c5ea0c497adea2afd1efd0b91`
- Branch: `rui/mpr-00-sixteen-theme-contract`
- Verified theme count: 16 = 8 dark + 8 light
- Current scroll owner: `.station-workspace` inside `scroll-foundation.css`; html/body/root viewport locked, also `viewport-lock.css`.
- Current preview stage: `App.tsx` uses `visualizationMode` to send live fields to only one active visualization layer. Stack migration is UI composition and must be gated on data identity and performance, not presumed CSS-only.
- Current shared code: `App.tsx`, `main.tsx`, `WaterColumn3D.tsx`, `OceanGlobe.tsx`; scientific internals owned by 3DB workstream.
- Existing all-theme implementation: `frontend/src/theme.ts`, `frontend/src/components/ThemePicker.tsx`, `frontend/src/glass-system.css`, `frontend/src/glass-system-bridge.css`.
- Required next after MPR-00 merged: reverify main then MPR-01 token/icon contract.
- Current change: documentation only; NO production UI change and NO scientific code change.
- Live verification remains pending until phase merged and its applicable gates observed.

### RESUME PROMPT TO COPY INTO ANY FUTURE WORK SESSION

"Resume Ocean Canvas **RUI-MPR** main-page restructure from `docs/RUI_MPR_00_17_MULTI_THEME_MAIN_PAGE_MASTER_PROMPT.md`. Before any change, verify current main SHA, open PRs, CI, Pages state and last MPR ledger status. Preserve all 16 glass themes and every scientific invariant; Arctic Mist is only a reference. Continue exactly the first unfinished MPR phase, timebox to <=20min active work, use isolated branch/PR and checkpoint when interrupted. Do not do 3DB scientific work. Implement and verify source-traceable UI changes, 16-theme accessibility, scroll, full-width stacked Geographic 3D and Water Column 3D, and truthful linked data, only as their phases authorize. Never claim completed/deployed/live without gates."
