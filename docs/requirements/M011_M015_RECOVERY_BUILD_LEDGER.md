# M011–M015 — Recovery work on the draft-only development train

**Release boundary:** No merge to main, no Pages publication, no live-production certification.
Branch: `build/m008-m095-science-ui-train`. PR #202 and PR #204 must remain Draft.

## M011 — BGC authenticity and native QC

Implemented `src/bgc_provider_qc.py` and `tests/test_m011_bgc_evidence.py`.
Accept only provider-reported variables with matching native units and QC 1/2,
real UTC timestamps/coordinates/depth and identifiable sensor provenance.
An AOML optode profile in the Atlantic remains observation context; it is NOT
automatically a geographic/time-compatible Indian Ocean GLORYS matchup.
Real GDAC S-profile ingestion requires a separate later scientific adapter.

## M012 — Bounded provider retry

The existing `scripts/fetch_verified_observation_breadth.py` request implementation
is guarded by an exact NOAA provider allowlist, strict HTTPS, bounded response,
1–8 attempts, 429/5xx transient retry and immediate 400/401/403/404/422
failure. CCHDO ERDDAP 404 nRows=0 is still handled scientifically by the
existing older-window/official-archive logic. No values are invented,
and failed responses are never cached as successful source data.

## M013 — Static inventory and MPR scope

Existing `tests/test_m001_m007_scientific_baseline.py` checks original 41 source
frame SHA-256 files, 140 cells and frozen Argo residuals. New M013 tests
verify mixed provider/science changes CANNOT pass `verify_mpr_release_scope.py`
by pretending to be UI-only. The cumulative draft PR's MPR-only job is expected
to fail; this is **NOT** clearance for a later production release. Maintain
separate release PR scopes/authorization after Stage A.

## M014 — PR #200 audit

PR #200 remains a separate draft and adds the default authentic Float
5907092 Cycle 13 selection only when the corresponding GLORYS reference and
QC profile genuinely exist. It also changes visible globe attribution and
health warning recovery. These improvements must be reconciled with the
current App and MPR Presentation layouts before integration; do not cherry-pick
unreviewed UI code or misattribute a 2004 pilot's source to a 2024 Argo profile.
At this checkpoint, M014 **AUDITED; integration NOT DONE**.

## M015 — Unmerged recovery candidate

The cumulative PR #204 is intentionally draft/non-enrolled and builds from
the scientific recovery PR #202. Local/dev CI results must be attached to an
exact commit before declaring M011–M013 TESTED. The prior MPR-only scope job
does not certify a mixed science/UI development branch. Any M014 layout/UI
integration and PR #200 reconciliation remain follow-ups, not release.
