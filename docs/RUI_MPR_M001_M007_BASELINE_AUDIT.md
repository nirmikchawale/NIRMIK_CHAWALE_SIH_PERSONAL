# M001–M007 — Ocean Canvas immutable baseline certification

This report records the science and application baseline for the first seven execution microphases. Phase completion requires exact-main green tests, final MVP, Pages deployment, and public Chromium evidence.

| Code | Scoped checkpoint | Objective acceptance |
|---|---|---|
| M001 | Repository `main`, directory inventory, latest SHA | Snapshot references the exact commit |
| M002 | Open PR inventory | Existing pending changes identified without deleting work |
| M003 | Scientific provider and CI error diagnosis | Valid upstream records and meaningful failure handling |
| M004 | Production Pages build and public Chromium | All four live public verification shards pass |
| M005 | Source-backed geographical registry | 140 IDs, 35 pilots, 70 eligible and 35 ineligible planned; 41 authentic source frames |
| M006 | Original GLORYS12V1 versus Float 5907092 | Exact metrics from 50 Cycle 13 and 49 Cycle 12 residuals |
| M007 | Original glass styling and interfaces | Sixteen original themes, default Arctic Mist and 96 real screenshot targets |

## Source integrity

The 2024-01-02 original GLORYS–Argo reference is separate from all 140 blocks. Source-backed pilot observations use source dates in 2004 and must never be mislabeled as matched to the 2024 float. No measurement, source hash, QC flag, native depth, current velocity or actual date is fabricated.

Full SHA-256 validation of the 41 original pilot source files and numerical replay of original Argo residuals are tested in `tests/test_m001_m007_scientific_baseline.py`.

## Authentic provider recovery

CCHDO/NOAA PMEL can return HTTP 404 for scientifically valid queries with zero matching records. The CTD adapter now searches successively older genuine Indian Ocean source windows, including the published 2016 I09N cruise period. Empty or invalid records never become observations. Successful records still require provider QC and measured temperature/salinity.

## Existing UI preservation

No existing theme, component, glass CSS, baseline numerical dataset, public scientific source manifest or 3D renderer was changed. Addition of Light and Dark remains a separate 18-theme phase and must not be presented as implemented by this scientific freeze.

## Release gate

Do not mark this package complete without a merged code PR, exact-main CI passes, actual Pages deployment and real public browser/visual acceptance. The committed baseline snapshot is not itself a release certificate.
