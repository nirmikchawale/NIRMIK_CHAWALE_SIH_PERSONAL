# M024–M031 — Evidence-based competitor investigation (partial)

**Current stage:** BUILD-FIRST RESEARCH IN PROGRESS, NOT 98/98 CERTIFIED.
Verification date: 2026-10-18. No competitor source files are vendored, copied
or installed into the Ocean Canvas application.

## Live GitHub evidence

Eight distinct public repositories were independently checked at their exact
40-character head SHAs; all eight reported `fork=false` at inspection time.
A source-path review was completed on three files, tree-level inspection on
three repositories, and metadata only for two. Inspect raw JSON
`M024_M031_COMPETITOR_CENSUS.json` for complete pinned SHA/file/claim status.

- [BlueNexus validation.py](https://github.com/prasoonkashyap18/BlueNexus-SIH-2026/blob/5f27b743c93e2d6ba03fa040ab81b14e2c79bb13/backend/app/data/ingestion/validation.py):
  post-ingest structural check severity is separate from actual ocean science.
  Potential test pattern: explicit errors/warnings, *not a borrowed codebase*.
- [Fathom match.py](https://github.com/quantumcoder2026/Fathom/blob/363444175e3d83b522818a0d95199ee6e2384eb1/compare/match.py):
  visible calculation uses **observed minus model** differences. Ocean Canvas
  baseline uses **model minus observation**. Never reuse residuals without
  an explicit sign-convention translation and independent tests. Its depth
  interpolation refuses extrapolation; the code also reports offsets.
- [OceanLens volume.js](https://github.com/Rehaan15790/OceanLens-3D/blob/034041bf1112dab77a228918881abe5367ab8600/src/js/volume.js):
  first-crossing algorithm builds a depth surface across horizontal cells,
  specifically labeled **2.5D** by source; do not call it full volumetric
  3D isosurface rendering. Null gaps at land and no-crossing cells preserved.

Source paths for OceanVerity and SIH67 were identified through tree inspection
but their scientific algorithms were NOT executed or independently validated.

## Bounded phase conclusions

- M024: **PARTIAL** — 8 current exact-head snapshots, historic list of 98 not
  recovered; no claim of full 98-repository refresh.
- M025: **PARTIAL** — 8/8 reported non-fork; upstream mirrors/shared code
  ancestry not independently checked across historic 98.
- M026: **PARTIAL** — classifier rejects fabricated source claims in our tests;
  many competitor real/synthetic source claims remain unknown.
- M027: **PARTIAL** — BlueNexus schema/QC separation and Fathom matching
  inspected; more repos/variables needed.
- M028: **PARTIAL** — OceanLens 2.5D distinction inspected; GPU/camera and
  further native volume sources not all checked.
- M029: **PARTIAL** — BlueNexus structural pipeline reviewed; security/cache/CI
  not audited across all 98.
- M030: **QUEUED** — no live UX/mobile/accessibility assessment yet.
- M031: **BLOCKED ON ORIGINAL ITEM TEXTS** — IDs A01–Y12 preserved in M000
  traceability register, but the exact historical descriptions are missing.
  Never manufacture a 300-item feature list or claim to have reconciled it.

All repository `license` values are UNKNOWN from inspected metadata: public
visibility alone is NOT an authorizing reuse licence. Any implementation
based on an observed general engineering principle must be independently
written and tested rather than copied from a competitor.

## Next gates

Recover authoritative 98-repo list and exact historical A01–Y12 item texts;
inspect each actual upstream/default branch/code, license and scientific
provenance. Produce code-anchored decisions, tests and no-duplication mapping
against existing Ocean Canvas functionality before M031 can be certified.
