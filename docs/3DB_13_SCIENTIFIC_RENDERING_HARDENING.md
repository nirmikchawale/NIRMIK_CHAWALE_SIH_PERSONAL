# 3DB-13 — Scientific Rendering Hardening

## Verified input checkpoint
Base main: `93f1573c18d024d796d319e1f58913fab67d7b7d`; 3DB-12 PR #161 is merged. Latest main tests, final-mvp and public Pages/Chromium acceptance were green. Parallel RUI/MPR is untouched. 3DB-13 begins on this main SHA.

## Hardening delivered
1. **Source-byte integrity:** before accepting a source-backed pilot JSON payload in the browser, WebCrypto checks SHA-256 over original HTTP response bytes against the existing committed manifest entry. Corrupt/missing bytes and malformed SHA fail closed; insecure contexts without WebCrypto do not claim validation. Promise-cache rejection permits retry.
2. **Source provenance consistency:** require payload product/dataset identity, canonical scientific footprint, native coordinate dimensions and daily-mean semantic identity to match the manifest. Existing native depth and variable validation remains.
3. **Truthful 3D scientific state:** 35 source-backed pilots is derived from the canonical 35-ID runtime inventory rather than a stale “25” string. The Water Column shows the *actual selected* pilot ID, source bounds and native depth count, and says explicitly that pilot independent observation validation is not asserted; the independently validated reference baseline retains its label.
4. **Horizontal currents contract:** prevent a scalar-variable response from being interpreted as a horizontal current renderer frame.

## Invariants and exclusion
No edits to model JSON, source frame SHA digests, GLORYS reference data, LOD scientific input, immutable source timestamps, observations or scientific QC. 140 logical blocks / 35 materialized / 105 planned / six actual multi-date / 41 source frames remain authoritative. No synthetic timestamps, coordinates, measurements, vertical current velocity or independent pilot observation validation. No UI/navigation/theme/mobile shell changes; all 16 RUI/MPR themes are preserved. Previous rare first-start public Cesium retry flakiness remains an explicit independent reliability watch, not a newly claimed fix.

## Acceptance and production
New positive/negative SHA checks, browser corrupted-response failure, truthful selected pilot context, Python source SHA and inventory regression, frontend typecheck/build, scientific Cesium and Water Column acceptance, full existing tests/final-mvp, branch PR checks, clean merge with verified head SHA, post-merge exact-main tests/final-mvp/Pages and public Chromium. Branch or successful test alone is not production proof.

Next: **3DB-14 — Full Block Capability Audit** following confirmed 3DB-13 production acceptance.
