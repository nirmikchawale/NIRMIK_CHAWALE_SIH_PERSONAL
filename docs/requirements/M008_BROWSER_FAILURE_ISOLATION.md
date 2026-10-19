# M008 — Actual Chromium failure isolation and modern MPR browser contract

**Status:** IMPLEMENTED ON ISOLATED BUILD BRANCH; DEVELOPMENT TEST EXECUTION PENDING.
**Baseline:** main `75880aa1714b68d92fbd2a652a10ed1d8a85c0d8`; historical public Pages job `39128416408`, failing Chromium verify-public shard #1 (`117679306751`).
**Recovery predecessor:** PR #202 at `9345be45430b88e2969e4066fd9d728301f10bb2`, held in DRAFT; fixes landed on that unmerged branch, not main.
**New build-only acceptance test:** `frontend/e2e/m008-browser-recovery-regression.spec.ts`. Requires `OCEANTWIN_LIVE_URL` targeting actual candidate preview (not mocked UI); attaches machine-readable browser contracts.

## Reproduced failure mapping from actual GitHub Actions log
| Failing original test | Observed failure | Real/current MPR implementation | Source of existing fix |
|---|---|---|---|
| `3db05-geographic-water-column-sync.spec.ts` planned IO-003 | `.planned-main-block-shell` not found after entering Water Column | `[data-testid=mpr-12-water-column-section]`, `data-linked-evidence=planned`, explicit `.mpr-water-column-unavailable` and **no canvas** | PR #202 modernizes assertion, without inventing data |
| `journey.spec.ts` | `.water-column-shell` not found after IO-073 click | MPR-12 section remains mounted; explicit navigation selects it even if planned source lacks a volume | PR #202 modernizes section navigation check |
| `live.spec.ts` judge flow | old assertion expects `data-theme=dark`, actual `light` | fresh `DEFAULT_GLASS_THEME=arctic-mist`; user-selected dark must work separately | PR #202 checks Arctic Mist light, then actual Aurora Borealis dark |
| `live.spec.ts` explorer flow | identical dark-versus-light mismatch | real appearance gallery persists selected named theme; science data and ramps must be invariant | PR #202 uses real dark→light appearance sequence |
| `live.spec.ts` advanced Point opacity | old label potentially ambiguous across inspector/dock | select visible advanced `viewSettings` slider rather than either matching slider | PR #202 scopes locator |

GitHub log explicitly recorded **four** failed cases and **61** passed cases for shard #1 on `main` (25.3 minutes); this is **historical evidence**, not evidence that current PR or new M008 spec passed.

## M008 new executable diagnostic acceptance
1. Run actual browser against candidate dev/staged site; assert initial Arctic Mist/light and interactively switch to Aurora dark then back. Verify active block ID, selected scientific source and computed scientific legend gradient remain unchanged.
2. Visit `#/explore?block=IO-003` as a real deep link; navigate to Water Column using the existing button. Assert current MPR-12 status, planned withheld evidence text and zero scientific canvases; no stale retired shell.
3. Save JSON attachments with URL, rendered DOM contract and actual result. Do not mark TESTED before Playwright executes and passes with a concrete CI run ID.
4. Run existing 3DB, MPR, Argo, and theme suites as regressions. This new spec **supplements** existing tests; it does not delete any scientifically meaningful assertion.

## Environment/rollback and next phase
M008 is a build-stage test only, no production CSS or React component changed and no merge/deploy. Build branch starts from draft PR #202 so its existing source and E2E repairs are not independently repeated. Branch CI acceptance must be recorded at the resulting *exact* commit SHA. M009 is authentic glider provider failure analysis and provider access/QC reporting. 
