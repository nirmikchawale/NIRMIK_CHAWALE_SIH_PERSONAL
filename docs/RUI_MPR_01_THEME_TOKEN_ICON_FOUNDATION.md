# RUI-MPR-01 — Multi-Theme Component Foundation

**Scope:** Visual-only presentation foundation. No scientific/data/algorithm changes.
**Parent:** `docs/RUI_MPR_00_17_MULTI_THEME_MAIN_PAGE_MASTER_PROMPT.md`
**Base:** PR #167 (`rui/mpr-00-sixteen-theme-contract`) until it merges to main.

## Files and ownership

- `frontend/src/mpr-design-foundation.css` — semantic spacing/radii/surface/border/focus tokens; restrained pre-migration polish on existing shell/islands/sidebar controls; opt-in future `.mpr-glass-island`, `.mpr-glass-card`, `.mpr-control` recipes.
- `frontend/src/components/MprIcon.tsx` — accessible, lightweight, 30-name, theme-neutral currentColor SVG icon vocabulary. Not mass-installed in legacy code at this phase; subsequent MPR-03..13 phases must reuse it and pair meaningful icons with visible labels.
- `frontend/src/main.tsx` — one stylesheet import after existing CSS; **no React/scientific behavior changes**.
- `frontend/e2e/mpr-01-theme-foundation.spec.ts` — select and verify all 16 themes, inherited accent/radii, and unchanged scientific source.

## Visual specification

The four user-approved reference images define **layout only**, not one mandatory colour palette. Rounded islands: 20–26 px responsive; cards 18 px; controls 12–14 px; pill tokens 999 px. No new hardcoded Arctic background/text colours. Semantic surfaces, borders, focus, accent and muted state must derive from the live `--glass-*` tokens.

Icon vocabulary: workspace, explore, analyze, data, science, globe, water-column, block, layers, settings, variable, depth, time, observations, profile, render, palette, source, quality, sync, warning, verified, planned, compare, download, expand, collapse, fullscreen, refresh, focus.

- **Navigation**: explore / analyze / data / science / workspace.
- **Scientific**: globe / water-column / block / variable / depth / time / observations / profile / source / quality.
- **Actions**: expand / collapse / fullscreen / refresh / download / compare / settings / focus.
- **Statuses**: sync / warning / verified / planned. These icons carry **no science status by themselves**: pair with status text derived from existing evidence.

## Science and UI invariants

Keep 16 `GLASS_THEME_IDS` names, 8 dark + 8 light; preserve ThemePicker and localStorage keys/default; renderer scientific palettes remain independent. Do not edit scientific APIs, data, models, time/depth, observation comparisons, provenance, 3DB owner code, camera behavior, page scroll, routes, or UI component hierarchy in this foundation phase.

## Acceptance and progress ledger

1. Exactly 16 canonical theme IDs, unchanged.
2. Frontend TypeScript and production build pass.
3. All-16 theme smoke passes at 1440px; no scientific source change on theme switch.
4. Existing CI `tests` + `final-mvp` must pass for this branch.
5. Compare screenshot at representative light/dark theme if browser screenshots are available. Without that, mark **CI VERIFIED ONLY**, not LIVE VISUALLY VERIFIED.
6. Merge only after parent PR #167 passes/merges and this PR's required checks pass; then verify deployment and live page separately.

**Progress:** UI code committed on `rui/mpr-01-multitheme-design-foundation`; PR/CI and live verification pending at initial authoring. Update this ledger with exact gates before declaring completion.

**Next:** MPR-02 Explore scrolling; no modification to scroll ownership or the fixed header in MPR-01.
