# M010 — Authentic CTD discovery and CF-netCDF compatibility diagnosis

**State:** IMPLEMENTED tests on isolated development branch; exact-head CI pending.

## Evidence-backed upstream failure
Historic main run `39128416412` (job `117678351017`) and static-hosted job `117678351211` failed because official NOAA PMEL ERDDAP CCHDO `cchdo_ctd` query `2018-01-01…2026-12-31`, lon 40–120, lat −40–30 returned HTTP **404 / nRows = 0**. That response means no matching observation rows within that query; it is not a signal to create observations. Later PR #202 (held in DRAFT) preserves source origin while searching prior genuine dates and separately retrieving the published CCHDO cruise 33RR20160321 CF-netCDF archive with native fields and source SHA.

## M010 regression implementation
`tests/test_m010_ctd_provider_contract.py` now tests genuine **schema contracts** using test-only dictionaries: `profile_id`, `expocode`, time, coordinates, pressure, temperature/salinity and independent WOCE QC. Valid source temperature and salinity require QC `2` and physical-range checks. Invalid profile, time, pressure, QC or nonfinite numbers are never emitted. Branch tests distinguish exact 404 zero-row responses from authentication errors, rate limits, missing datasets and provider faults. Only known empty searches allow the independently published official cruise archive fallback. A non-empty 403/other provider error remains an error.

## Scientific caution
- Every produced observation needs provider-native cruise, station, cast, original time/location/pressure, QC, original source file hash and legitimate rights; a test dictionary is never a science input.
- The official cruise archive URL `https://cchdo.ucsd.edu/data/39637/33RR20160321_ctd.nc` and cruise page `https://cchdo.ucsd.edu/cruise/33RR20160321` are recorded as **source candidates**, not independent current download/rights proof by this document.
- Native pressure→depth is a documented derived coordinate, not a new measured variable. Temperature and salinity must never be copied into a different time or IO cell.
- Need separately verify CCHDO CF-netCDF fields/axes/QC/2016 cast selection and its licence in M020 and M037. If archive unavailable or incompatible, report source acquisition BLOCKED rather than inventing data.

## Development acceptance
Record a GitHub Actions **exact commit** passing unit tests plus source adapter/science CI before assigning TESTED. Do not merge, deploy or mark M010 publicly verified in Stage A.
