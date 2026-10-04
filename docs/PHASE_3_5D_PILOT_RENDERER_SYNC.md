# Phase 3.5D — Source-backed pilot renderer synchronization

## Mission

Activate the genuine Phase 3.5B GLORYS12V1 pilot blocks across Ocean Canvas's scientific workspaces while preserving the established 140-cell geographic planning workflow.

## Scientific contract

- The original `BASE-GLORYS-001` verified demo volume remains available and unchanged.
- Exactly 24 Phase 3.5B pilot IDs are treated as source-backed materialized blocks.
- Six pilots retain two genuine daily GLORYS12V1 source frames; the others retain one genuine daily source frame.
- Planned cells remain selectable as geographic context and can still open the empty Water Column planning shell, but they never load invented scientific values.
- `api.ts` uses pilot payloads only when a source-backed pilot is active. Planning-only cells continue to use verified baseline evidence for compatible analytics while clearly disclosing that their block geometry is not materialized science.
- Switching into or out of a pilot forces one deterministic reload so Geographic 3D, Water Column 3D, time controls, telemetry, anomaly screening and provenance cannot mix two scientific payload families.
- Temperature, salinity and horizontal currents are source-derived. Current speed is derived only from genuine `uo`/`vo`; no vertical current is inferred.
- Pilot anomaly screening is descriptive MAD-based screening. Temporal screening remains locked when fewer than three genuine timestamps exist.
- Pilot Argo residual/validation claims remain empty unless independently matched evidence is available for that pilot.

## UX contract

The Indian Ocean Block Engine distinguishes three states:

1. **Verified demo baseline** — the original source-backed SIH baseline.
2. **Source-backed pilot** — a genuinely materialized Phase 3.5B block that can become the active scientific renderer source.
3. **Planned target** — selectable geographic planning geometry with zero fabricated block-specific values.

A dedicated pilot synchronization bridge appears only when a source-backed pilot is live. It identifies the active block, genuine native dates, geographic bounds and synchronized Geographic / Water Column 3D state, and provides a direct return to the verified baseline.

## Acceptance path

1. Open the Explore route.
2. Open **Indian Ocean Block Engine**.
3. Select `IO-001`; confirm it is a source-backed pilot with genuine dates `2004-03-15` and `2004-07-28`.
4. Activate `IO-001` and allow the deterministic reload.
5. Confirm shared context and Geographic 3D identify `IO-001` as a pilot.
6. Open Water Column 3D and confirm a real source-backed volume is rendered, not the planned empty shell.
7. Return to `BASE-GLORYS-001` and confirm the original verified baseline is restored.
8. Select a planning-only cell such as `IO-047`; confirm the geographic block remains selectable and Water Column 3D shows the zero-value planning shell rather than copied or synthetic data.

## Rollback

Start SHA: `5b8202d7d3d5e2e0ce7f2c69696f29c62c2b2e6f`.

Rollback must use a normal revert of the eventual Phase 3.5D merge commit. Do not force-reset public `main`.
