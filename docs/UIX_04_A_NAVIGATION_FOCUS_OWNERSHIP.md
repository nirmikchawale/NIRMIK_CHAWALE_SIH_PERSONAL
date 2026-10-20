# UIX-04A — Integration readiness against certified Ocean Canvas production

**State: INTEGRATION CANDIDATE / focused regression pending. NOT premerge-certified, merged, deployed or publicly certified.**

## Exact source lineage
- Certified new production base: `04d5a585d0c940ea1c5b1bbb6dea4c2f7d452b0e` (UIX-03 merged, publicly certified); scientific/UI tree `902f6be29021f0fe2c2711afb1b8789397ebb81a`.
- Frozen original UIX-04A source: branch `build/uix04a-navigation-focus-audit-20261021`, SHA `72fd2dfae01048b104e66ca7773eff7655512aa2`, genuine six-case Chromium focused run #39495638834 PASS zero retries at 390px/1440px. Historical evidence, not a replacement for testing the new integration tree.
- Integration branch: `integration/uix04a-focus-certified-main-20261021`, newly branched from certified main; no unrelated old development commits transplanted.
- EXACT changed paths: `frontend/src/components/AppNavigation.tsx`, `frontend/e2e/uix04a-navigation-focus-ownership.spec.ts`, `.github/workflows/uix04a-focused-chromium.yml`, and this document.
- Original frozen test and AppNavigation correction are unchanged. Only the new integration branch's workflow trigger and current-state documentation are refreshed.
- New certified main and UIX-04A original base have identical pre-fix `AppNavigation.tsx` blob `ba1d17718bef8854d800ea5b5d5ffce2dbbb6c1a`. UIX-03's 8 changed paths do not overlap. Stage A PR #204 and ITM queue #211 do not change this component.

## Focused verification
- The branch-only workflow genuinely rebuilds the React/Cesium production artifact with original science exports and retains native GLORYS/INCOIS/Argo/QC/time/depth invariants.
- Run EXACTLY six real Chromium tests, 390px and 1440px: opening/selected-focus, inert and aria-hidden, Tab/Shift+Tab containment, Escape focus restoration, native Telemetry route and focus recovery, workers=1 and retries=0.
- Once six tests PASS on this specific integration commit, freeze this candidate; do not repeat old suite diagnostics or run 96 theme PNGs solely to diagnose focus behavior.

## Explicit narrow scope-policy review barrier
- Current certified main `scripts/verify_mpr_release_scope.py` has an EXACT allowlist. Its policy does NOT yet include these 4 integration paths, and PR `pull_request` would run `mpr-10-17-release-certification` and predictably fail the release-scope gate.
- Historic ITM PR #218 owns changes to this policy file; Stage A #204 has an overlapping MPR workflow. Do NOT silently loosen the policy or create a conflict via ad-hoc amendments.
- BEFORE opening a draft release PR, seek distinct owner review/approval of exactly these 4 file paths (no wildcard) or wait for canonical scope policy update, and reconcile policy owners.
- Only after narrow authorization and source-collision recheck, open one DRAFT review PR against current main and require full exact-head science/build/4-shard Chromium/96-physical-PNG evidence once for that final candidate, separate merge approval, single deployment and independent public certificate.
- This integration-readiness branch itself is **NOT** authorized to merge or deploy. UIX-03 prior release approval does not transfer to UIX-04A.

## Permanent handoff
- UIX-03 PUBLIC CERTIFIED, main 04d5a585. Do not repeat its suite or deploy.
- UIX-04A original 72fd2dfa FROZEN and 6/6 focused PASS. New integration candidate requires its own genuine focused test result plus narrow exact-path scope approval before a PR.
- UIX-04B 6217d83e FROZEN, 4/4 focused PASS, not merged.
- M/ITM lanes retain separate dependency and release gates. Follow issue #220 project anti-loop and every-chat owner-attention handoff.
