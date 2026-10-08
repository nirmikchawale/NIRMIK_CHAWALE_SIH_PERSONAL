# RUI-MPR-06 — Ocean Intelligence Source Selector

Parent: PR #174 (MPR-05). Branch: rui/mpr-06-ocean-intelligence-source-layout. Scope: presentation only.

The Ocean Intelligence header and truthful explanatory subtitle sit above the three existing source buttons. Cards remain GLORYS baseline, INCOIS multi-time and INCOIS chlorophyll. The same React source handlers, disabled availability guards, source hydration, real timestamp/depth rules, and three workflow shortcuts remain. The new theme-neutral MprIcon vocabulary, rounded glass tokens, forced-colours/reduced-motion treatment and responsive 1440/1024/390/320 geometry are presentation only.

Validation: run frontend typecheck and production build, MPR-06 Playwright, full final-mvp tests, science API/fallback, and all 16 themes. Do not merge before MPR-03/04/05 are merged and live-verified. Reconcile concurrent 3DB merges before release. Only claim live after exact-main GitHub Pages deployment and public Chromium verification.

Next: MPR-07 Active Main Block full-width disclosure below source cards and above the existing three workflow links, preserving the global shared ScientificContextHeader.
