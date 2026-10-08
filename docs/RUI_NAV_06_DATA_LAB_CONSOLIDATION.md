# RUI-NAV-06 — Data Lab Consolidation

Status: **implementation candidate / PR validation pending**.

## Authoritative starting checkpoint

- Repository: `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`.
- Baseline `main`: `7ce2846a8e27420d950ce87edc7a348d2adfeb4d` (3DB-10 merged).
- RUI-NAV-00 through RUI-NAV-05 and RUI-VIS-01 through RUI-VIS-04 are already merged; no completed feature is rebuilt.
- Concurrent `3db-11-indian-ocean-scale-out` PR/branch is independently owned. NAV-06 must not alter its acquisition/science scope.
- Frozen canonical hierarchy comes from `docs/RUI_NAV_00_FEATURE_INVENTORY_AND_HIERARCHY_FREEZE.md`.

## Canonical feature ownership

| Home | Canonical capability | Preserved runtime behavior |
| --- | --- | --- |
| Overview | Guarded local-file context and privacy declaration | No uploaded bytes sent to server |
| Sources | Official provider launchpad, registered adapters, protocol/standard badges, connector links, plugin contracts | Provider claims limited to source metadata; offline services fail closed |
| Datasets | Local file picker, required schema, validation result, counts, clear/reset, import into 3D Explorer | Supported NetCDF / CSV / TSV / ASCII / JSON; same local validation and downstream import gate |
| Variables | Exact validated numeric variable summaries and declared units | No fabricated variables, unit coercion or aggregation over rejected rows |
| Filters | Local variable, source, sensor, genuine timestamp and minimum/maximum positive-down depth scoping | Only accepted local records; no remote queries or synthesized measurements |
| Inspection | CF metadata, fail-closed rules, quality warnings/errors, extent/missingness and scoped preview | Existing scientific field checks and invalid-file warnings retained |
| Downloads | Import schema, complete validation report, gated filtered CSV/JSON | No validated-row export for rejected files; CSV formula injection guarded |
| Provenance | Local filename/format, claimed source/dataset/QC values and validation result | User-supplied source metadata explicitly not independent provider authentication |

The directory exposes **exactly eight** uniquely addressable homes. Files, source catalogs, validation rules, scientific payloads and connector behavior have not been replaced.

## Safety and scope

1. Local upload: NetCDF max 32 MiB; text/JSON max 5 MiB; max 100,000 canonical records.
2. Retain required lon/lat/depth/time/variable/value/units/source, finite numeric fields, timezone-aware timestamps, positive-down depth and missingness/duplicate warnings.
3. Preserve immutable GLORYS/Argo evidence; user-imported files cannot replace verified scientific datasets.
4. Observational source labels are unverified user metadata. No dataset or provider is implied to be authenticated based only on the file's `source` column.
5. No synthetic timestamps, values, coordinates, depths, provider links or server-side filter capability.
6. Rejected datasets permit issue inspection and validation-report export, not filtered scientific-record export or Explorer import.
7. CSV exports prefix potentially formula-triggering text cells and quote/escape CSV values.
8. Existing scientific-context headers, other six workspaces, 3DB-11 acquisition work and global navigation contracts remain out of scope.

## Implementation files

- `frontend/src/components/DataLabDirectoryNav.tsx` — canonical local feature directory.
- `frontend/src/pages/DataLabPage.tsx` — grouped existing controls, local scope/CSV/JSON export and provenance.
- `frontend/src/data-lab-consolidation.css` — responsive/light-and-dark/accessibility-aware section styling.
- `frontend/e2e/rui-nav-06-data-lab-consolidation.spec.ts` — directory, valid/invalid imports, provenance, filter/export and mobile smoke regression.

## Validation gates

- [x] Existing baseline/PR/CI/deploy state inspected before editing.
- [x] Reused in-progress RUI-NAV-06 branch rather than duplicating implementation.
- [x] Eight canonical homes addressable with unique ownership.
- [x] Local filtering and gated scoped downloads implemented without altering validation engine.
- [x] Browser regression coverage authored (including invalid timestamp and mobile).
- [ ] Exact candidate head `tests` and `final-mvp` checks successful.
- [ ] Playwright production build and static scientific fallback checks successful.
- [ ] Fresh-main race check passed; concurrent science changes reconciled if needed.
- [ ] PR merged to `main` with no unresolved checks.
- [ ] Exact merged main `tests`, `final-mvp`, Pages and public HTTPS browser acceptance successful.

**Completion language rule:** do not claim DEPLOYED / LIVE / VERIFIED until the matching exact-head and exact-main results and public Pages Chromium flow are green. RUI-NAV-07 and later phases are deferred.
