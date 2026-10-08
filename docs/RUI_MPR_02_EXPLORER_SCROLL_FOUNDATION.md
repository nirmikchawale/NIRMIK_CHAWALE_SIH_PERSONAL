# RUI-MPR-02 — Explorer Shell Scroll Ownership

**Scope:** Explorer-only structural scroll migration. No science algorithm/data/renderer mutation; all 16 existing glass presets remain the source of styling.

## Source and stacking

- Branch: `rui/mpr-02-explorer-scroll-mainline`
- Parent: `rui/mpr-01-multitheme-design-foundation` until MPR-00/01 gate and merge.
- Original production main baseline: `1ce58c3e644e187c5ea0c497adea2afd1efd0b91` (revalidate before merging).
- Files changed: `frontend/src/mpr-explorer-scroll.css`, stylesheet import in `frontend/src/main.tsx`, updated `frontend/e2e/explorer-first-screen-layout.spec.ts`, new `frontend/e2e/mpr-02-explore-scroll.spec.ts`, this documentation.

## Scroll-owner decision

Use **one Explorer application-shell scroll owner** (`.ocean-workbench[data-page="explore"]`), not `document.body` and not the legacy `.station-workspace` scroller. This permits the main Ocean Canvas header, the scientific-context band, Explorer directory, Ocean Intelligence and the current 3D stage to move up naturally together. The browser document remains locked, as existing `viewport-lock.css` requires across the rest of the application. All non-Explorer routes keep their original content-scroller and viewport rules.

This avoids broad global html/body/root overflow overrides and JavaScript wheel redirects. Desktop sidebar stays accessible (sticky within the Explorer frame) until MPR-03 upgrades its navigation; mobile navbar/context/workspace are restored to normal flow, retaining current off-canvas drawer and bottom-sheet layering.

## Requirements

- A genuine wheel over page background scrolls the shell, including the header out of the viewport.
- Neither `.station-workspace` nor the browser document is a competing vertical scrollbar on Explorer.
- Desktop ControlPanel and existing profile/evidence inspectors remain local scroll surfaces; at dock boundary users can resume page scrolling. Mobile sheets remain bounded and do not leak scrolling to the scene behind.
- Globe/Cesium and Water Column pointer/wheel events remain unchanged; their interactive canvas owns zoom.
- Existing brand, source, block, theme, status, QC and 3D controls are not relocated in MPR-02.
- Focus/Presentation and mobile/320px variants must not clip content or suppress exits; non-Explorer routes unchanged.
- The separate full-width Geographic and Water Column sections, sticky two-view navigator, and independent new docks belong to later MPR-09..14, NOT this phase.

## Validation

1. Typecheck & React/Cesium Vite build; normal tests and full final-MVP workflow.
2. MPR-02 Playwright at 1440, 1024, 390, 320: the shell is scrollable; header & source move together; station and HTML do not scroll.
3. Existing Explorer first-screen island test now targets shell scroll owner; verify source cards remain non-overlapping and functional.
4. Existing document-layout route test still passes without edits.
5. Smoke theme persistence at representative dark/light and full 16-theme regression inherited from MPR-01.
6. Test controls/drawer/focus/presentation and canvas gestures after scrolling.
7. Review actual desktop/mobile screenshots before calling visually verified; no screenshot evidence -> not LIVE & VERIFIED.
8. Check PR and original baseline SHA before merge; do not merge stacked MPR-02 before MPR-00 and MPR-01.

**Status at initial commit:** UI-only branch work; PR/CI/browser/deployment gates pending. Update with precise CI and production evidence before marking complete.
**Next:** MPR-03 Adaptive global Workspaces navigator; do not implement in this phase.
