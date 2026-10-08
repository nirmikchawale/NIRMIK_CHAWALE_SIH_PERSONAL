# RUI-MPR-16 — All-16 Glass Theme Visual Acceptance

**Previous phase:** MPR-15 PR #188 (`rui/mpr-15-inspector-responsive-accessibility`).  
**Phase branch:** `rui/mpr-16-all-theme-visual-acceptance`.  
**Authoritative production baseline:** `43265375ef1c28ab6e94a48e6162f928b1aeb367`.  
**Scope:** automated acceptance and screenshot evidence **only**. No new theme palette, theme lock-in, scientific colour edits or renderer changes.

## Canonical coverage
Exactly 16 persisted glass themes from `frontend/src/theme.ts`, not a single Arctic reference: Abyss Noir, Aurora Borealis, Midnight Indigo, Deep Sea Emerald, Bioluminescent Cyan, Coral Dusk, Solar Amber, Graphite Clear, Polar Frost, Arctic Mist, Pearl Lagoon, Glacier Mint, Rose Quartz, Lavender Haze, Sandglass, Cloud Prism.

## Browser certification matrix
`frontend/e2e/mpr-16-all-themes-visual.spec.ts` opens a **real built frontend** (requires `OCEANTWIN_LIVE_URL`) and cycles each theme at 1440×900, 768×900, 390×844, including:
- Browser screenshots of **both the actual Cesium geographic stage** and **actual source-backed water-column section** for each theme and viewport (96 PNG attachments total, no mocked ocean values).
- `html[data-glass-theme]` and dark/light scheme match canonical metadata; the exact theme ID is persisted in localStorage, survives page reload at 320px; theme gallery controls remain real and clickable.
- WCAG AA normal-text foundational contrast of main text versus page canvas at least 4.5:1, muted essential labels vs page canvas at least 3:1; both text and color swatches are inspected in computed CSS, not assumed from theme names. Contrast on translucent surfaces, icon contrasts and chart labels require human screenshot review; these ratios are screening gates only, not blanket WCAG certification.
- No horizontal viewport overflow (tolerance 2 CSS px). Both real views and inspector action hub remain visible; water 3D section follows geographic 3D section.
- Real selected source, variable and native time remain unchanged while choosing visual themes; the exact computed scientific colorbar gradient must remain unchanged across all 16 visual themes. No scientific palette is derived from the page theme.
- Responsive and keyboard-first behavior retains focus / reduced-motion styles and original renderer controls.

## Evidence / certification
The MPR-17 workflow must upload Playwright PNG and JSON artifacts and verify all test outcomes on **the exact release HEAD**. Screenshots are **not** statements that an individual theme's layout was visually approved: a human-readable manifest and screenshot comparison review are part of final certification. Do not report 16/16 passed until actual Playwright job says so.

## Release contract
MPR-16 is stacked on MPR-15 and must remain separate until earlier exact-head gates are reconciled. Next MPR-17 adds machine-enforced science-file diff guard, build/regression browser workflow, auditable release checklist and final source compatibility. Publication to GitHub Pages and independent live HTTPS browser acceptance are **later** gates; no branch commit itself is a public deployment.
