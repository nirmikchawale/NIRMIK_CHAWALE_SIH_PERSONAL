# M032–M039 — Scientific provider contracts (isolated build)

**Status:** Code/tests committed for M032–M039; provider-specific raw data acquisition is NOT completed by this work. Each provider needs source-version and rights review before release.

| Phase | Built or checked | Outstanding source gate |
|---|---|---|
| M032 | Versioned typed `ProviderContract` facade over existing 10-connector `source_registry` (8 genuine external/bundled scientific connectors, 2 Ocean Canvas service connectors) | Native source fetch/headers must be checked per request |
| M033 | Copernicus model product **GLOBAL_MULTIYEAR_PHY_001_030**, dataset `cmems_mod_glo_phy_my_0.083deg_P1D-m`; DOI 10.48670/moi-00021, daily reanalysis access via Toolbox | Terms, account/authorisation, native 2024 source download & raw hash unverified |
| M034 | INCOIS `incois_argo_10d_VAM` metadata states 813 times, 24 **uneven** native depth levels, TEMP/SAL/TERR/SERR, ~10-day **analysis** (not individual observations); INCOIS `IRS_chlorophyll_datasets` surface-only | Individual time/space selected source hashes/QA and chlorophyll product notice |
| M035 | Argo adjusted QC1/Argo cycle mode policy in validator, baseline remains 5907092 Cycle 13 + Cycle 12 | Raw/adjusted Argo GDAC semantics, distinct BGC parameter modes and original matching constraints |
| M036 | Glider native QC1/2 assessment and mission/coordinate gates | AOML mission ≠ Indian Ocean; genuine GDAC mission samples and licence unresolved |
| M037 | CCHDO GO-SHIP CTD WOCE QC2 gate and archived I09N metadata confirmed | Instrument/calibration as per cruise docs, raw source SHA and original cast lineage |
| M038 | BGC native S-profile mode R/A/D and per-parameter QC gate | Authentic S-prof raw NetCDF and parameter-specific units still needed; S-prof means scientifically merged/synthetic-profile pressure series, **not** fabricated data |
| M039 | Provider HTTPS allowlist, rights checks; mooring/drifter/ADCP/HF radar/satellite prioritized as assess/defer | Source-specific terms and evidentiary value not established |

## Official metadata checked on 2026-10-18
- Copernicus GLORYS12V1: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/services (dataset, DOI, daily subset/Toolbox).
- INCOIS 10-day VAM: https://erddap.incois.gov.in/erddap/info/incois_argo_10d_VAM/index.html (n=813 uneven source times; 24 depths; license notice).
- INCOIS Indian Argo: https://erddap.incois.gov.in/erddap/tabledap/Indian_ARGO_Floats.html.
- Argo S-prof native science: https://argo.ucsd.edu/data/data-faq/ (GDAC synthetic-profile nomenclature is legitimate and not demo fabrication).
- CCHDO GO-SHIP I09N 2016: https://cchdo.ucsd.edu/cruise/33RR20160321 (cruise DOI **10.7942/C2008W**, Public Domain Mark 1.0; 2016 is **not** a 2024 IO-087 model matchup).

## Adopt/defer catalogue (scientifically conservative)
- INCOIS/VAM: ADOPT only as **model/analysis context**, never present as a direct sensor observation.
- Argo profiles: ADOPT when native QC, platform/cycle, time/depth and locality are valid.
- Gliders/CTD/BGC: ADOPT as real **observation context**, then separately check scientific pairing.
- Surface chlorophyll: ADOPT 2D only; explicitly never stretch into vertical BGC profiles.
- Mooring/drifter/ADCP/HF radar: DEFER model pairing until official access, variable geometry, units, QC, temporal semantics and redistribution terms are verified.
- No external code was copied, no real observations were fabricated, no `main` source hashes or 16 glass themes modified.

**M039 closure:** Code readiness != authentic provider acquisition. These are development-scoped contracts and negative tests, not release gates or an assertion that every live endpoint supports extraction.
