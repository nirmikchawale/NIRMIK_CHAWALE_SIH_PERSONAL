# Phase 6 — Interaction Completion / Zero-Dead-Control Pass

## Mission

Turn Ocean Canvas into one synchronized scientific instrument across the six main workspaces:

1. 3D Explorer
2. Telemetry
3. Model vs Observation
4. Anomaly Screening
5. Data Lab
6. Science & System

Every visible control must have a real purpose, a deterministic state/evidence effect, explicit loading/error/unavailable behavior, keyboard/touch-safe interaction and automated acceptance coverage. No placeholder actions, fabricated science, hidden context resets or controls that only change presentation without a declared purpose.

## Starting production baseline

- Main SHA: `6dd83f223aef332e7c2bb7cd8cbca094c0701091`
- Phase 3.5B: 24 genuine GLORYS12V1 pilot main blocks, including 6 multi-date pilots.
- Phase 3.5D: pilot payloads synchronized across Geographic 3D, Water Column 3D, timeline, telemetry, anomaly screening and provenance.
- Phase 5.0: shared scientific context bridge live across all six workspaces.

Scientific values, QC, source files, provenance identities and anomaly method are immutable in Phase 6 unless a separate source-backed data phase explicitly changes them.

## Shared interaction contract

All compatible workspaces operate on one authoritative context:

`block → source → native time → variable → depth → selected profile`

Phase 6 must preserve this context when the user moves between workspaces, reloads a deep link or activates a genuine materialized block.

### Phase 6A — shared interaction spine

Implemented in this branch:

- Active main-block selection is encoded in the route hash with `block=`.
- Shared context continuously encodes `source`, `variable`, exact selected depth, native time and selected profile when available.
- Scientific deep links are self-describing and survive session/local-storage clearing for the encoded block/context.
- The persistent shared-context rail provides a materialized scientific-block selector.
- The selector contains only the verified baseline plus the 24 genuine Phase 3.5B pilots; a planning-only block may be displayed as the current geographic context but cannot be promoted to materialized science.
- Previous/next materialized-block navigation changes the real active scientific source and uses the existing deterministic reload when the payload family changes.
- A copy-context action exposes the current exact context as a shareable link with a browser-safe fallback.
- Mobile layout keeps the controls within the 390 px viewport.

## Workspace completion targets

### 3D Explorer

- Every source/variable/depth/time/palette/range/opacity/exaggeration/isosurface/playback control changes a real renderer or scientific selection state.
- Block selection and Water Column entry remain synchronized.
- Unavailable controls explain why they are disabled.
- Keyboard/touch paths must reach all high-priority actions.

### Telemetry

- Variable, exact native time and exact source depth stay synchronized with shared context.
- Depth ladder, distribution, local vertical context and time telemetry update together.
- One/two-frame sources disclose temporal limitations instead of implying a time series.

### Model vs Observation

- Profile selector, matched-level inspection, bias diagnostics and evidence downloads must be functional.
- Pilot blocks without independently matched observations show an explicit evidence-unavailable state and never inherit baseline validation claims.

### Anomaly Screening

- Variable/depth/native-time controls must update the same selected evidence context.
- Spatial and residual inspectors remain explainable MAD-based diagnostics.
- Temporal screening remains locked until at least three genuine timestamps exist.

### Data Lab

- Inspect → validate → QC → accept-session-layer flow must contain no dead step.
- Rejected data must expose actionable reasons.
- Accepted temporary observation layers must be visible to compatible Explorer/observation workflows without altering canonical source data.

### Science & System

- Active source, block coverage, native-time availability, transformations, provenance and limitations must reflect the live shared context.
- Architecture/source cards must distinguish implemented capability from planned coverage.

## Phase 6 acceptance gates

1. No control is present without a real state/evidence effect or an explicit unavailable explanation.
2. Explorer → Telemetry → Compare → Anomaly → Data Lab → Science/System does not silently reset block/source/time/variable/depth.
3. A generated deep link can reload the encoded materialized block and scientific context without relying on prior local/session storage.
4. Planning-only cells never become scientific renderer sources.
5. Exactly 24 Phase 3.5B pilot IDs remain source-backed; no synthetic block is introduced.
6. Desktop and phone controls are keyboard/touch usable and remain inside the viewport.
7. TypeScript typecheck and production build pass.
8. Existing scientific regressions and Phase 3.5/5 browser acceptance remain green.
9. Phase 6 Playwright acceptance passes in static-hosted/live mode.
10. Merge only through a normal PR; after merge require tests, final-MVP, Pages deployment, public HTTPS and live Chromium judge-flow verification.

## Rollback

Implementation branch: `ui/phase-6-interaction-completion`.

Rollback is a normal revert of the eventual Phase 6 merge commit. Never force-reset public `main`.
