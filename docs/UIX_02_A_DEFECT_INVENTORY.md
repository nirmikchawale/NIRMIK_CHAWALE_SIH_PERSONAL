# UIX-02-A — Defect inventory and acceptance criteria

Baseline: UIX-01 public production commit `2817702d6752a449c33a08dfa94cce94461b907d`. Permanent no-loop policy: issue #220. This document describes candidates; an item is not a verified live defect without an actual browser reproduction.

| ID | Surface | Candidate failure | Acceptance criteria | State |
|---|---|---|---|---|
| UIX02-01 | Non-Explorer nested scroll | A nested auto-scrolling panel at its top/bottom consumes wheel input even when it cannot scroll further, preventing outer document movement | At panel interior, wheel scrolls panel; at its boundary, wheel reaches scrollable document; ctrl/meta zoom unchanged; Explorer unchanged | Bounded patch and genuine one-case 1/1 Chromium PASS with zero retries, run 39413249011; full release checks pending |
| UIX02-02 | Presentation | Clipped or inaccessible content, viewport ownership | Presentation content visible and keyboard/scroll accessible at desktop/tablet/mobile; exit restores Explorer | 320/768/1440 layout + keyboard exit 3/3 Chromium PASS; mobile guide focus defect reproduced and fixed, 1/1 zero-retry Chromium PASS; release still gated |
| UIX02-03 | Analysis Split / Focus 3D | Competing panels or occluded controls | No overlap; toggles preserve scene state and accessible controls | 320/768 Analysis PASS; desktop collapsed analysis 38→720px fixed PASS; mobile 2→368px and desktop 711→1392px Focus fixed PASS; targeted Chromium 3/3 zero-retry PASS; release gated |
| UIX02-04 | Depth and height controls | Control value or display desynchronization | Verified values and linked globe/water-column states stay synchronized | Real Chromium 5/5 zero-retry PASS; GLORYS and IO-001 31 native depths, 1×→100× geometry-only, Geographic↔Water Column sync, surface-only chlorophyll locked. No runtime bug reproduced; release gates pending |
| UIX02-05 | Navigation, Model vs Observation, Telemetry, Anomaly, Data Lab and evidence | Dead controls or broken scroll/route ownership | Each actionable control responds; scientific provenance preserved | 8/8 genuine targeted Chromium PASS (mobile/desktop navigation, controls, QC and local Data Lab), 0 retries; no product defect reproduced; formal release gated |
| UIX02-06 | 16 themes and responsive sizes | Contrast, clipped labels, unexpected theme changes | All 16 presets and 320/390/768/1440 viewports remain usable; no regressions | 4/4 genuine theme-view tests PASS = 64 real preset selections across 320/390/768/1440 px, 0 retries; source/block identity, viewport and gallery boundedness preserved; release gated |

## UIX02-01 evidence and bounded correction

Source `frontend/src/App.tsx`: document-level wheel handler for non-Explorer routes returns immediately when an ancestor has scrollable overflow, without checking whether the ancestor has remaining travel in the wheel direction. Thus a nested panel at a scroll boundary can trap wheel scrolling instead of allowing the document to move. Correction checks remaining directional scroll range before returning. It does not change scientific data, renderer, theme, route or Explorer wheel handling.

## UIX02-02 reproduced defect, bounded correction, real Chromium proof

UIX-02-C first ran four genuine Playwright Chromium cases with zero retries against the exact UIX-02-A/B candidate artifact. [Run 39414361107](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39414361107) proved **three distinct layout/scroll/keyboard exit PASS** at 320, 768, and 1440 pixels. The fourth case reproduced a real mobile accessibility failure at 390x844: entering Present demo by keyboard left focus outside the guide. `Close presentation guide` was visible but `toBeFocused()` failed after 20 seconds; this was not a screenshot timeout or an invalid URL.

One bounded patch, limited to `frontend/src/components/PresentationGuide.tsx`, now remembers the originating focused element, focuses the guide's real close button on entry, and restores focus to the original trigger when the guide closes. No route, source, theme, layout, CSS, backend, observations, GLORYS/INCOIS, or data logic was modified. [Single failing-case retest 39414877284](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39414877284) shows **1/1 genuine Chromium PASS, zero retries**, with TypeScript typecheck and fresh production build PASS and byte-identical source-backed scientific catalog SHA256. The three already-passing responsive cases were **not rerun**.

The stored four-case contract is `frontend/e2e/uix02c-presentation-audit.spec.ts`. Both this additional new test path and existing UIX-02-A doc/test paths still require exact-file release-scope authorization before formal release certification; no wildcard allowance or check bypass is implied.

## UIX02-03 Analysis Split / Focus 3D audited and corrected

An isolated [five-case original Chromium audit, run 39415838120](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39415838120), used genuine source-backed production artifacts with one worker and zero retries. Analysis Split interactions, full panel visibility and source-preserving mode exit passed at **320 px** and **768 px**. At **1440 px**, the Analysis inspector measured **506.75 px wide but only 38 px tall**: this compression was visible in the browser geometry even though the initial test's superficial visibility check passed. The geometric acceptance was tightened to require a usable inspector height greater than 300 px.

At **390 px** the actual Focus 3D stage collapsed to **2 px width**, and at **1440 px** it occupied only **711.36 px** of the viewport. These two authentic zero-retry assertions failed. Root cause: older named CSS grid areas still generated implicit tracks while Focus mode relied on a one-column grid, shrinking the native Geographic stage. In Analysis, the desktop inspector retained a `contain:size` and `height:100%` combination within an auto-size grid row.

A bounded **CSS-only** correction in the previously existing `frontend/src/mpr-presentation-block-placement-v2.css` sets Focus-mode scene ownership to a full-width flex column without disturbing native 3D components and restores intrinsic, scrollable Analysis inspector height. No source-time-depth, Cesium renderer code, QC/provenance, GLORYS/INCOIS/Argo inputs, theme tokens or data values were changed.

The [three-case genuine Chromium retest, run 39416587167](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39416587167), selected **exactly 3 tests**, one worker and **0 retries**:
- Desktop Analysis 1440 px: inspector **720 px height** and native globe stage did not overlap; keyboard mode entry/exit and scientific source/block unchanged, PASS.
- Focus 390 px: stage **368 × 675 px** and Escape restored the workspace, PASS.
- Focus 1440 px: stage **1392 × 675 px** and Escape restored the workspace, PASS.

TypeScript typecheck, rebuilt production candidate, and unchanged static scientific catalog SHA256 succeeded. Previously passing **320/768 Analysis cases were not rerun**. This is **targeted UIX-02-D verification only**, not full PR release certification or live-site deployment.

## UIX02-04 — Native depth, vertical display and two-way 3D synchronization audit

UIX-02-E required a root-cause-first **read-only science contract audit**. Both 3D presentations share the exact React `depthIndex` and `verticalExaggeration` state and receive `activeExploreCatalog.coordinates.depth[depthIndex]` (source-native coordinate) directly. The native depth axis is immutable within each catalog, and exaggerated values are applied to **display geometry only**, not observational/model depths or measurement arrays. Source inspection alone did not constitute a PASS: genuine Chromium interaction was required.

[Four-case browser run 39423563510](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39423563510), on diagnostic SHA `082cc0e979c4f21e6a87584920ffa3d80874dbb2`, successfully executed **four real Chromium cases, one worker, zero retries**:
1. GLORYS 31 strictly increasing native depths: Water Column native depth selector levels 0, 18 and 30 update native section depth, Water Column selected-depth label and Geographic selected-depth label to the **same** source metres; scientific source/block identities unchanged. Axis spans approximately **0.49–453.94 m**.
2. Vertical exaggeration at mobile **390 px** changed from **1× to 100×**, updating the actual Water Column renderer's display-geometry readout while preserving original native depth **55.76428985595703 m**, native selector index and source.
3. Verified `IO-001` pilot's **31 genuine depth levels** remain present and truthful across the pilot 3D volume and both depth controls. Level 30 is **453.94 m**, no interpolation or invented depth.
4. INCOIS chlorophyll is scientifically **surface-only**; native depth control and Water Column launch are disabled, and no subsurface 3D canvas is created.

[One additional reverse-direction run 39424083247](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39424083247), diagnostic SHA `9f402c9aa7d748c477f760716c2f2803f78692a5`: exactly **1 Chromium case**, one worker and **0 retries**, proved Geographic depth slider moving **453.94 m → 0.49 m** updates Water Column native selector and renderer-selected readout. Geographic exaggeration to **100×** synchronizes the Water Column rendering geometry while preserving the source and block. The four earlier passing cases were NOT rerun.

Both runs passed TypeScript typecheck and a fresh Vite build, using the **preexisting static science artifact from run 39400125238**, and preserved the original `science-static/catalog.json` SHA256. The first attempt at this audit stopped at the **test selection/parse stage** with an invalid async callback and ran **0** tests; it was corrected in the test file without any runtime/source changes before the genuine 4/4 PASS. No runtime depth, renderers, data/QC, scientific source or glassmorphism CSS was changed. **No product defect was reproduced; no application fix was warranted.**

Source-only changes promoted to PR #222: one new exact Playwright E2E test, `frontend/e2e/uix02e-native-depth-exaggeration.spec.ts`, byte-for-byte identical to the code used in the passing reverse-direction run. The extra test path requires an explicit release-scope decision with prior UIX-02 additions, and mandatory new exact-commit premerge/public gates remain pending. No full Chromium shards or 96-PNG matrix were used as diagnostics.

## UIX02-05/06 — Navigation, evidence, responsive accessibility and all 16 themes

A **single bounded Chromium audit** was run against the exact unchanged UIX-02-E application source and certified-source assets, avoiding all unrelated suites. [Run 39425438757](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39425438757), SHA `2d99119c019b52bd41480b2dcfaa6222b4abb9fb`, job `118636690905`: **12/12 genuine Chromium PASS (2.3 minutes), one worker, zero retries**. This was no mock of app functionality and was not a screenshot or image assertion. TypeScript build, Vite production build and scientific catalog SHA256 equality passed in the same job.

The 12 cases cover:
- **Navigation 390 and 1440 px, 2/2 PASS:** keyboard Enter opens the real mobile/desktop workspace directory and navigates sequentially to Telemetry, Model vs Observation, Anomaly Screening, Data Lab and Science System. Each route and content panel is verified; directory closes and no root horizontal overflow is introduced.
- **Telemetry + Model vs Observation 390 and 1440 px, 2/2 PASS:** native **31-depth** telemetry slider responds, salinity selection updates its state, truthful single-timestep time control remains disabled and telemetry CSV download stays enabled. Comparison retains **two verified Argo profiles**, true QC pipeline and evidence download with honest independent-validation caveat.
- **Anomaly + Data Lab 390 and 1440 px, 2/2 PASS:** Argo residual screening changes the genuinely rendered analysis context; flags remain explicitly statistical, not confirmed events. Data Lab starts with disabled export, validates **two user-supplied test rows** from a locally loaded sample CSV, enables filtered JSON export after validation, and preserves the caveat that uploaded data are not independently authenticated. The two-row test fixture is user-input validation only; it is NOT inserted into scientific app catalogs or issued as verified observations.
- **Explorer evidence/QC 320 and 1440 px, 2/2 PASS:** evidence inspector and provenance/QC drawer open and close through genuine clickable controls. Scientific source identity remains unchanged, and the root viewport does not overflow horizontally.
- **All 16 glass themes, 320/390/768/1440 px, 4/4 PASS:** **64 real theme gallery selections**, with gallery viewport containment, root non-overflow, preserved route, unchanged scientific source and block ID, and correct selected `data-glass-theme` for each preset. `Arctic Mist` remains the default theme constant. These are interactive style/identity tests, **not** a replacement for the already-certified UIX-01 96-PNG SHA256 visual matrix and not a fresh pixel-diff/contrast-ratio audit.

**Conclusion:** No UIX-02-F application defect reproduced within this targeted acceptance scope. No code correction is warranted. One new isolated E2E contract `frontend/e2e/uix02f-navigation-evidence-themes.spec.ts` is retained. Existing runtime UI/CSS, scientific data, QC, GLORYS/INCOIS/Argo, volume renderers and 16 themes were unchanged. Certified UIX-01 main remains immutable.

UIX-02-B/C/D/E/F have now completed their **isolated acceptance** gates, but the draft PR #222 is **NOT** premerge/public certified, merged or deployed. Exactly six **new** docs/E2E paths relative to UIX-01 must receive a narrow MPR scope decision; then only mandatory exact-new-SHA science/Chromium/MPR release checks may run. Unchanged full browser shards / 96 images must never be rerun merely because a targeted audit case fails; no wildcard MPR allowlist bypass is authorized. Separate human release integration permission remains required.

## Required verification before approval

1. Focused genuine Chromium test: non-Explorer page with nested scrollable panel, wheel inside panel mid-range and at both boundaries; assert correct panel/document scroll owner. Also check ctrl/meta wheel remains untouched.
2. Adjacent non-Explorer routes and Explorer regressions; keyboard accessibility, 320/390/768/1440 viewports, 16 themes where relevant.
3. Record exact commit, failing fingerprint, targeted test logs, regression results, and required science/MPR gates. Do not infer PASS from source inspection. No merge or deploy without separate release authorization.

Status: UIX-02-B/C/D/E/F targeted browser gates PASS. Release-scope authorization, mandatory exact-SHA premerge gates, separate merge/deployment approval and public acceptance remain outstanding. No exact-commit premerge certification, merge, deployment or public release has occurred. Historical full Chromium and 96-image UIX-01 certificates remain untouched.
