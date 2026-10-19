# Stage A exact-commit certification failure triage

Examined failed GitHub Actions jobs on build-train SHA `323b0618d503d7ae36c941f2033f8c6900cba397`.

## Actual logs
- `tests/pytest` job 117704984825: 7 failures. One deliberately retained old M001 test required exactly 16 appearance IDs; M087 added two. Fixed by enforcing all 16 exact original IDs/order and exactly two new neutral IDs (18 total), retaining Arctic Mist default.
- Six `tests/test_m040_m047_io087_source_wave.py` failures were `ModuleNotFoundError: netCDF4` on the lightweight Streamlit `requirements.txt` workflow. Test workflow now installs source inspector's optional `netCDF4>=1.7,<2`, without modifying runtime Streamlit requirements or scientific values. Inspect method checks absent/unsafe original raw bytes before optional imports.
- `ocean-canvas-build-train-development` job 117703507805 failed in the original theme-count assertion before ever reaching TypeScript/Chromium. This is not browser evidence; update to run exact SHA after fix.
- `mpr-10-17-release-certification/frontend-only-release-scope` remains intentionally failing for a mixed UI/science cumulative Draft PR. DO NOT remove/bypass this production gate.

## Re-certification
1. Verify latest SHA and Draft PR#204 unchanged/no competing writer.
2. Require green full Python tests, scientific source hashes/Argo, React/Cesium TypeScript, static API/fallback, and development Chromium for exact new commit SHA.
3. Run independent 18 x 3 x 2 actual screenshot pipeline only in draft branch, count real artifact attachments, never count targets as screenshots.
4. Record unresolved provider rights/raw IO-087 2024 source, M014 UI integration, incomplete 98/300 research, and true full UI rendering as non-accepted until complete.
5. Preserve PR#205 and its seven disjoint files to the Integration Testing & Merge chat. PR#200 overlaps PR#205 `App.tsx` and `OceanGlobe.tsx`; no automatic cherry-pick/merge.

Nothing here is public-live certification or approval to merge.
