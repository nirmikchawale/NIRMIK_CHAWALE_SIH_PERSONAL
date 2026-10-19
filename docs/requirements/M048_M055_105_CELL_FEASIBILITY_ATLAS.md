# M048–M055 — 105-cell reproducible scientific feasibility atlas

Stage: **DEVELOPMENT ONLY**. Source snapshot: original
`frontend/public/main-blocks/manifest.json` and `capability-audit.json`,
validated against 140 geographic cells, 35 authentic pilots, 41 original
pilot frames and 70 geographically eligible + 35 ineligible planned cells.

## Result definition

`src/feasibility_atlas.py` produces an immutable-inference *metadata* atlas
from both authentic existing inventories. `scripts/export_feasibility_atlas.py`
writes a deterministic report to local `artifacts/`, never to
`frontend/public/` or a new public asset. The program does NOT make 105
external scientific source queries and does NOT represent them as conducted.

Each block records exact canonical ID and native geographic bounds, the
original ocean/land classification, whether **geographically eligible** for
source acquisition, whether provider/source discovery has occurred, native
time and observation evidence, original model source frame SHA and true
3D renderer status.

All source discovery/observations for unmaterialized blocks remain
`NOT_QUERIED`; source-data status is `NOT_ACQUIRED`, all new materialized
frames and source-backed independent matchups remain zero.

## Work batch and phase boundaries

- M048: strict metadata-only schema and checksum-anchored input contracts.
- M049: positions 1–15.
- M050: positions 16–30.
- M051: positions 31–45.
- M052: positions 46–60.
- M053: positions 61–75.
- M054: positions 76–90.
- M055: positions 91–105; deterministic 70/35 reconciliation.

Each batch's list of exact IDs is emitted from the source manifest in
original document order. Do not substitute sorted alphabetical IDs or clone
source data. New model data and in-situ eligibility require actual provider
requests + QC/time/space/rights, and separate M056–M063 matching.

## Run locally

```bash
python -m pytest -q tests/test_m048_m055_atlas.py
python -m scripts.export_feasibility_atlas --output artifacts/105-cell-feasibility.json
```

**Status:** Code/tests prepared; real independent observation-source queries
and 105 model materializations have **not** happened. Labels must remain
METADATA-ONLY/NOT-QUERIED until new source and full source provenance exist.
