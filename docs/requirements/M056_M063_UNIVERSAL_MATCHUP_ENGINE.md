# M056–M063 — Source-backed universal ocean diagnostics (development)

**Status:** Python engine and fixture-based scientific tests committed on draft
build branch. The tests contain **TEST-ONLY numerical arrays**; they are
not provider observations or model results. The engine does NOT magically
create real IO-087 model frames; the entire source-backed 2024 acquisition
chain and UI integration remain blocked until source rights and raw bytes
are verified.

| Phase | Built contract | Mandatory rejection path |
|---|---|---|
| M056 | Per-sensor native QC and Argo adjusted parameter mode | Missing/QC9 positions, time, depth, R-mode adjusted samples |
| M057 | Nearest geometrically eligible native **wet** model grid cell and bounded distance | Land cell, absent/malformed mask, outside native domain |
| M058 | Documented model instantaneous time or daily-mean inclusive/exclusive interval | Wrong 2004 year, outside support, time extrapolation |
| M059 | Strict adjacent bracketing depth interpolation and finite wet values | No below-depth extrapolation, no bridging masked interior |
| M060 | CF basis/units gate: potential temperature at 0 dbar vs in-situ; optional reviewed TEOS GSW transform | Raw in-situ temperature compared to potential temperature without GSW |
| M061 | Signed **model minus observation** bias, MAE, RMSE, maximum absolute, per-band metrics and explicit exclusions | Missing/QC rejects are not zero residuals |
| M062 | Native sensor uncertainty when provided, daily-mean representativeness, assimilation dependence and correlated levels | Missing uncertainty not imputed; no fake independent validation |
| M063 | Exact-hash-linked stable depth chart-series JSON, UTF-8 CSV and provenance JSON exports | No fabricated PNGs, timeline, scientific outcome or source-linked claim |

This is a reusable standalone Python computation contract. It consumes actual
provider-verified model cubes and observation levels **only when supplied**
by a separately validated source path. For the time being the tests use
small synthetic **TEST-ONLY** arrays and no original scientific resources
are modified. In particular: there are no new IO-087 source acquisitions,
native resampling or model–observation metrics.

Reference method preserved:
`data/comparison/temperature_comparison_engine.py`: reference convention
`model – observation`, QC and no-extrapolation, signed diagnostics and
the separate verified Float 5907092 baselines.

`src/universal_ocean_matchup.py` does not integrate new UI rendering or
register new science automatically. The later M064–M071 adapter must deliver
source-backed actual grid arrays, return unavailable states for absent
inputs and preserve all existing 16 glass themes and navigation.

## Run

```bash
python -m pytest -q tests/test_m056_m063_universal_matchup.py
```

No public release, no draft PR promotion, no main branch changes.
