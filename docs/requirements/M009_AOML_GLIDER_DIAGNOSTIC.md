# M009 — NOAA AOML authentic glider diagnostics and source-eligibility boundary

**State:** TEST CODE COMMITTED; BRANCH PYTEST PENDING. Not a production publication.

## Evidence observed
- The existing provider code queries NOAA AOML/IOOS ERDDAP `AOML_GLIDERS_2025` using pinned trajectory metadata `SG683-20250910T0000` and numeric profile IDs 1414 down to 1399; it reads genuine native `profile_time`, `profile_lon`, `profile_lat`, depth, temperature/salinity and Aanderaa oxygen with their separate QC fields.
- Old exact-main `final-mvp` run `39128416412` reached `fetch_cchdo_ctd()`, then failed on CCHDO's PMEL ERDDAP zero-result 404. Since `fetch()` calls AOML first, that run is indirect evidence that its AOML threshold completed. It does not guarantee ongoing AOML availability nor define rights.
- Original AOML dataset **is not automatically an Indian Ocean observation**. Ingest authentic glider/BGC measurements with geospatial and temporal metadata, but do not present them as co-located with a GLORYS Indian Ocean cell unless M021 and M056–M063 eligibility tests prove it.
- AOML `temperature_qc`/`salinity_qc` and oxygen optode QC must each independently accept provider flags 1/2; a good physical CTD record must not manufacture a missing BGC variable. The existing implementation attempts bounded provider profiles and raises actionable failures if none pass. Do not silently fill empty results.

## New code and negative tests
`tests/test_m009_glider_provider_contract.py` adds test-only fixtures to verify provider endpoint/field request identity, valid QC retention, rejection of unknown/missing QC, invalid time/coordinates/depth/wrong profile ID, bound retries, retained error diagnostics, and no BGC invention. Test-only numeric fixture dictionaries **never enter the product data layer**.

## Outstanding source-access/licence evidence
The URL `https://erddap.aoml.noaa.gov/hdb/erddap/info/AOML_GLIDERS_2025/index.html` is the code's provider metadata link, not a checked redistribution grant. M020/M036 must verify current provider DOI, terms, provenance, geospatial/time coverage, platform type and access before redistribution or claiming matched Indian Ocean science. If unavailable, mark `UNAVAILABLE` or `OBSERVATION_CONTEXT_ONLY`, not independently validated.

## Gate
M009 is `IMPLEMENTED` when negative tests are committed, `TESTED` only after exact-head test run success. This document does not claim live provider download, licence grant, model matching or public release.
