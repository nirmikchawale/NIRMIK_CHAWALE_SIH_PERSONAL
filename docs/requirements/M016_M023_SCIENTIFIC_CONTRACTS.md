# M016–M023 — Build-first scientific integrity implementation

**Stage A only.** This library provides conservative validation helpers and
unit tests; it does not automatically integrate into all source adapters,
make unavailable new data available or certify a production browser.

| Phase | Implementation in src/science_evidence_pipeline.py | Test evidence required |
|---|---|---|
| M016 | Six independent typed evidence facets | Blocked science source survives renderer status changes |
| M017 | Targeted positive scientific claims linter | Reject unsupported 'independently validated' / real-time / forecast copy |
| M018 | Portable provenance export | Drop token/query/private path while retaining source SHA and provider |
| M019 | Versioned native chronological source frame | Block 2004 pilot from inheriting 2024 Argo baseline |
| M020 | Explicit rights metadata decision | Mere accessible URL is NOT a public redistribution licence |
| M021 | Space/time/depth/variable initial eligibility | Reject 2004 vs 2024, outside bounds, invalid QC and extrapolation |
| M022 | Authentic S-profile classifier | Require original SHA, parameter modes/QC; synthetic demo rejected |
| M023 | Content-addressed staged source and atomic pointer | Mismatched SHA/mask/date fail before publication; no silent overwrites |

### Integration guardrails

- M021 is only a **necessary** eligibility gate: it does not by itself check
  native grid wet-cell masks, TEOS definitions, assimilation independence,
  instrument accuracy or uncertainty. M056–M063 must implement those.
- M022 does **not** download or create any Argo S-profile. Provider-native bytes
  and rights must be verified independently.
- M023 promotes only an already-received SHA-verified byte string into an
  isolated store; it does not modify the original 41 pilot frames or public
  manifests. Atomicity refers to final pointer visibility, not a multi-object
  filesystem transaction. Orphaned content objects are not visible as frames.
- M017 is a targeted copy linter and does not replace human scientific review.
- Verify all development tests on exact branch commit before labeling TESTED.

Source status remains independent of UI status; no phase is MERGED/DEPLOYED/LIVE.
