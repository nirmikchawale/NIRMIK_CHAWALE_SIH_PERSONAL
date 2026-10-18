# CERT-03 — Genuine browser and source-native renderer gate

Exact-source Stage A PR #204 only, never production deployment.

## First actual failure and corrected root cause
The earlier 108-screenshot workflow on SHA `8d6ca466` uploaded failure diagnostics (10 tests passed, 5 failed). It used `python -m http.server` to serve a Vite production build but had **omitted** `VITE_STATIC_SCIENCE=true` during `npm run build`. The React client therefore requested non-existent `/api/*` endpoints from a static server, remained in its boot error state, and could not expose `#mpr-3d-stage` or the ThemePicker. This was a test preview configuration defect, not proof that globe or source science was fabricated.

The corrected workflow now builds the real frontend in **static-science mode** with the original, fully source-backed exported GLORYS12V1 static API. A preflight HTTP step confirms health, actual catalog timestep, and 35 original pilot manifest records before Playwright. It does not mock any measurements or bypass SHA validation.

## Browser acceptance
- CERT-03 two additional real browser tests load Explorer with the actual static data server.
- IO-001 original native GLORYS pilot: both geographic and water-column DOMs must have matching block IDs, native 2004 date, true accepted evidence, and all 31 original depth selection levels. Only one genuine baseline source time is selectable.
- Planned IO-003: no water-column volume, and truthful source-withheld explanation.
- Existing 3DB13 tests independently challenge altered HTTP source bytes and SHA-256 failures, plus real source-backed rendering.
- M064–M079 unit browser specs separately preserve native mask, UTC time, horizontal-only current metadata, source sampling and no independent validation assertions.

**Pending**: actual exact-SHA GitHub development Chromium run, real source-backed screenshots, full GPU performance and responsiveness checks. No claimed pass until corresponding job completes.
