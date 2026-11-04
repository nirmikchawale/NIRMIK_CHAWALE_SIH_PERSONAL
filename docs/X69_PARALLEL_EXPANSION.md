# X001–X069 — parallel science acquisition, review-only

## Proven baseline and scope

Base GitHub main: `d1e251cca7a42b7882963f421d2a8c6158e33aca` (2026-10-23 Asia/Kolkata). The canonical 3DB-14 audit reports **140 logical / 35 materialized / 105 planned / 6 multi-date / 41 original frames / zero land pilots**. Among planned, 70 satisfy source-backed ocean-mask *geographic eligibility* (fraction >= 0.20). IO-087 is reserved for its independent workstream. Thus **69 remaining targets = 345 A–E microphases**. 35 ineligible land-dominant targets remain locked.

## Atomic fan-out/fan-in

- X001–X069 ordering comes from deterministic sorted eligible IDs after excluding IO-087. Do not infer ID by arithmetic.
- **A — audit** each existing geographic target and lock its source/native-coordinate contract. A is currently geography-assessed, not independently source-confirmed.
- **B — acquire** 69 actual GLORYS12V1 daily-mean 2004-03-15 source slices via the existing NCAR GDEX DAP2 implementation, split into ten independent GitHub Actions shards. No invented times or interpolated input.
- **C — verify** every original staged payload using the existing 3DB-01 deep source validator (identity, native coordinates, positive-down depth, thetao/so/uo/vo, finite/sparse evidence, SHA256, no invented vertical velocity).
- **D — register** only if all 69 pass, in a single isolated-branch promotion; historical 41 payload digests, IO-087, original multi-date 6 and 2024 verified comparison baseline are preserved. Planned end-state: **104/36/6/110**, not pre-declared as achieved.
- **E — integrate/certify**: existing Cesium and Water Column contracts, production TS build, static fallback, complete Python and genuine Chromium acceptance, exact commit PR checks and guarded public Pages must pass independently. Model/observation validation is not implied; genuinely missing station comparisons must stay unavailable.

## Execution boundary and anti-loop circuit breaker

This branch is **not a release candidate** until successful remote acquisition, all 69 local/native scientific validations, canonical registry parity, full original regressions, typecheck/build, four genuine Chromium shards and any *applicable* separate release gate. The legacy pinned-count tests must be independently updated to preserve strict new 104/36/110 invariants, NOT disabled or silently relaxed. After any failure, inspect the exact shard/block/fingerprint; preserve successful shards; never rerun all ten just to investigate one source failure, and stop after two identical attempts. Do not modify UIX-04C, M-series Stage B, the GLORYS 2024/Argo baseline, or RUI-owned global UX.

## Exact release status

**At branch creation:** X plan/code only, no new scientific payload, no public merge, no live certification. If all acquisition stages finish, the workflow commits actual native data only to this branch. That does not authorize merge/deploy. Complete focused regressions and protected release checks on the exact branch SHA before a distinct release authorization. Avoid claiming per-block actual GPU render or observation matchup from manifest availability alone.

## Verification

`python -m pytest -q tests/test_x69_parallel.py`
`python scripts/materialize_x69_parallel.py --plan`
`python scripts/materialize_x69_parallel.py --verify` (only after authentic promotion)
