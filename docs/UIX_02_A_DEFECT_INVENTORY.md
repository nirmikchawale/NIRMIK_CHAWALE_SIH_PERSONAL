# UIX-02-A — Defect inventory and acceptance criteria

Baseline: UIX-01 public production commit `2817702d6752a449c33a08dfa94cce94461b907d`. Permanent no-loop policy: issue #220. This document describes candidates; an item is not a verified live defect without an actual browser reproduction.

| ID | Surface | Candidate failure | Acceptance criteria | State |
|---|---|---|---|---|
| UIX02-01 | Non-Explorer nested scroll | A nested auto-scrolling panel at its top/bottom consumes wheel input even when it cannot scroll further, preventing outer document movement | At panel interior, wheel scrolls panel; at its boundary, wheel reaches scrollable document; ctrl/meta zoom unchanged; Explorer unchanged | Bounded patch and genuine one-case 1/1 Chromium PASS with zero retries, run 39413249011; full release checks pending |
| UIX02-02 | Presentation | Clipped or inaccessible content, viewport ownership | Presentation content visible and keyboard/scroll accessible at desktop/tablet/mobile; exit restores Explorer | 320/768/1440 layout + keyboard exit 3/3 Chromium PASS; mobile guide focus defect reproduced and fixed, 1/1 zero-retry Chromium PASS; release still gated |
| UIX02-03 | Analysis Split / Focus 3D | Competing panels or occluded controls | No overlap; toggles preserve scene state and accessible controls | Audit pending |
| UIX02-04 | Depth and height controls | Control value or display desynchronization | Verified values and linked globe/water-column states stay synchronized | Audit pending |
| UIX02-05 | Navigation, Model vs Observation, Telemetry, Anomaly, Data Lab and evidence | Dead controls or broken scroll/route ownership | Each actionable control responds; scientific provenance preserved | Audit pending |
| UIX02-06 | 16 themes and responsive sizes | Contrast, clipped labels, unexpected theme changes | All 16 presets and 320/390/768/1440 viewports remain usable; no regressions | Audit pending |

## UIX02-01 evidence and bounded correction

Source `frontend/src/App.tsx`: document-level wheel handler for non-Explorer routes returns immediately when an ancestor has scrollable overflow, without checking whether the ancestor has remaining travel in the wheel direction. Thus a nested panel at a scroll boundary can trap wheel scrolling instead of allowing the document to move. Correction checks remaining directional scroll range before returning. It does not change scientific data, renderer, theme, route or Explorer wheel handling.

## UIX02-02 reproduced defect, bounded correction, real Chromium proof

UIX-02-C first ran four genuine Playwright Chromium cases with zero retries against the exact UIX-02-A/B candidate artifact. [Run 39414361107](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39414361107) proved **three distinct layout/scroll/keyboard exit PASS** at 320, 768, and 1440 pixels. The fourth case reproduced a real mobile accessibility failure at 390x844: entering Present demo by keyboard left focus outside the guide. `Close presentation guide` was visible but `toBeFocused()` failed after 20 seconds; this was not a screenshot timeout or an invalid URL.

One bounded patch, limited to `frontend/src/components/PresentationGuide.tsx`, now remembers the originating focused element, focuses the guide's real close button on entry, and restores focus to the original trigger when the guide closes. No route, source, theme, layout, CSS, backend, observations, GLORYS/INCOIS, or data logic was modified. [Single failing-case retest 39414877284](https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/actions/runs/39414877284) shows **1/1 genuine Chromium PASS, zero retries**, with TypeScript typecheck and fresh production build PASS and byte-identical source-backed scientific catalog SHA256. The three already-passing responsive cases were **not rerun**.

The stored four-case contract is `frontend/e2e/uix02c-presentation-audit.spec.ts`. Both this additional new test path and existing UIX-02-A doc/test paths still require exact-file release-scope authorization before formal release certification; no wildcard allowance or check bypass is implied.

## Required verification before approval

1. Focused genuine Chromium test: non-Explorer page with nested scrollable panel, wheel inside panel mid-range and at both boundaries; assert correct panel/document scroll owner. Also check ctrl/meta wheel remains untouched.
2. Adjacent non-Explorer routes and Explorer regressions; keyboard accessibility, 320/390/768/1440 viewports, 16 themes where relevant.
3. Record exact commit, failing fingerprint, targeted test logs, regression results, and required science/MPR gates. Do not infer PASS from source inspection. No merge or deploy without separate release authorization.

Status: UIX-02-B and UIX-02-C targeted browser gates PASS; UIX-02-D/E/F not audited. No exact-commit premerge certification, merge, deployment or public release has occurred. Historical full Chromium and 96-image UIX-01 certificates remain untouched.
