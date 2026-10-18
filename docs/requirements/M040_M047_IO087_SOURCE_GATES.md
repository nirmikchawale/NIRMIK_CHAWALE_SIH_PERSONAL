# M040–M047 — IO-087 genuine 2024 source-first build track

**Development code committed; NO genuine 2024 IO-087 raw source was acquired by these tests and NO new scientific model–observation matchup has been computed.** Production `IO-087` remains planned.

## Canonical target and scientific distinction

- `IO-087` Central Arabian Sea bounds: 66–69°E, 11–13°N. Original 140 geographic cells and 41 pilot frames preserved; zero genuine materialized IO-087 frames.
- Its two real Argo 5907092 observation profiles on 2024-01-02 are geographic/spatiotemporal **context**. The old baseline `BASE-GLORYS-001` 31 depths/99 residuals is a separate reference, NOT evidence of a newly acquired IO-087 frame.
- 2004 pilot GLORYS source dates are incompatible with January 2024 Argo for a new matchup.

## Implementation and acceptance states

| Phase | Built on development branch | Remaining scientific proof |
|---|---|---|
| M040 | Exact 66–69E / 11–13N polygon and 140-block/41-frame invariants from original manifest | No physical new model yet |
| M041 | Native 2024-01-02 `copernicusmarine.subset` source request, 0–500m and `thetao/so/uo/vo` | Resolve source data version, direct distribution rights |
| M042 | Explicit authenticated Copernicus Toolbox acquisition path, file-boundary idempotence, local CLI plan/fetch/inspect | Real successful provider download **NOT EXECUTED**; external account/network and optional toolbox required |
| M043 | Streamed original-byte SHA256 and bound source receipt comparison | Actual raw file and receipt **ABSENT** |
| M044 | Native NetCDF 4D axes/units, date, depth, wet values/missing masks inspections | Source file with actual native axes **ABSENT** |
| M045 | Float 5907092 2024-01-02 geographic/time and depth compatibility, maintaining 50/49 legacy separation | True new IO-087 wet-cell collocation, thermo/TEOS, QC and native-time residual computation **NOT DONE** |
| M046 | Explicit no-copied-metrics logic | Fresh unbiased/qualified IO-087 residuals **NOT CALCULATED** |
| M047 | Safe UI readiness descriptor: PLANNED / no fake 3D canvas / no residual charts | Render integration after new verified source + M056–M063 engine; no public browser certification in Stage A |

### Actual source acquisition command (not run by CI)

```bash
python -m scripts.build_io087_candidate plan --output-dir artifacts/io087
# Run only in a private environment with copernicusmarine installed and authenticated:
python -m scripts.build_io087_candidate fetch --output-dir artifacts/io087
python -m scripts.build_io087_candidate inspect --source artifacts/io087/IO-087_GLORYS12V1_20240102.nc --receipt artifacts/io087/receipt.json
```

Official Copernicus Toolbox subset arguments:
https://help.marine.copernicus.eu/en/articles/8283072-copernicus-marine-toolbox-api-subset
Product source:
https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/services

The `fetch` action never silently reuses an old file as a new download; inspect output is structural QC, and rights/source version still require manual/provider checks. No secrets are recorded. No official provider bytes are bundled into the product during this build batch.

Tests create marked synthetic TEST-ONLY NetCDF **solely** inside a temporary test directory to challenge negative and dimensional contracts; they are not public science data. Do not promote test fixture hashes or calculations.

### Immediate blockers

M042–M047 cannot be called scientifically materialized without a separate 2024 Copernicus-native IO-087 source actually acquired and verified, source version/rights, wet-cell/no-extrapolation matchup and scientifically coherent model/observation sample calculations. Keep honest state `BLOCKED_SOURCE_NOT_ACQUIRED` until then; do not merge or overwrite baseline manifest.

**Stage B release merges, exact-main CI, Pages and public Chromium are intentionally deferred.**
