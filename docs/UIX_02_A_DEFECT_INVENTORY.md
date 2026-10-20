# UIX-02-A — Defect inventory and acceptance criteria

Baseline: UIX-01 public production commit `2817702d6752a449c33a08dfa94cce94461b907d`. Permanent no-loop policy: issue #220. This document describes candidates; an item is not a verified live defect without an actual browser reproduction.

| ID | Surface | Candidate failure | Acceptance criteria | State |
|---|---|---|---|---|
| UIX02-01 | Non-Explorer nested scroll | A nested auto-scrolling panel at its top/bottom consumes wheel input even when it cannot scroll further, preventing outer document movement | At panel interior, wheel scrolls panel; at its boundary, wheel reaches scrollable document; ctrl/meta zoom unchanged; Explorer unchanged | Source-confirmed boundary defect; bounded patch staged, Chromium pending |
| UIX02-02 | Presentation | Clipped or inaccessible content, viewport ownership | Presentation content visible and keyboard/scroll accessible at desktop/tablet/mobile; exit restores Explorer | Audit pending |
| UIX02-03 | Analysis Split / Focus 3D | Competing panels or occluded controls | No overlap; toggles preserve scene state and accessible controls | Audit pending |
| UIX02-04 | Depth and height controls | Control value or display desynchronization | Verified values and linked globe/water-column states stay synchronized | Audit pending |
| UIX02-05 | Navigation, Model vs Observation, Telemetry, Anomaly, Data Lab and evidence | Dead controls or broken scroll/route ownership | Each actionable control responds; scientific provenance preserved | Audit pending |
| UIX02-06 | 16 themes and responsive sizes | Contrast, clipped labels, unexpected theme changes | All 16 presets and 320/390/768/1440 viewports remain usable; no regressions | Audit pending |

## UIX02-01 evidence and bounded correction

Source `frontend/src/App.tsx`: document-level wheel handler for non-Explorer routes returns immediately when an ancestor has scrollable overflow, without checking whether the ancestor has remaining travel in the wheel direction. Thus a nested panel at a scroll boundary can trap wheel scrolling instead of allowing the document to move. Correction checks remaining directional scroll range before returning. It does not change scientific data, renderer, theme, route or Explorer wheel handling.

## Required verification before approval

1. Focused genuine Chromium test: non-Explorer page with nested scrollable panel, wheel inside panel mid-range and at both boundaries; assert correct panel/document scroll owner. Also check ctrl/meta wheel remains untouched.
2. Adjacent non-Explorer routes and Explorer regressions; keyboard accessibility, 320/390/768/1440 viewports, 16 themes where relevant.
3. Record exact commit, failing fingerprint, targeted test logs, regression results, and required science/MPR gates. Do not infer PASS from source inspection. No merge or deploy without separate release authorization.

Status: CODED only; not browser-tested, integrated, certified, merged or deployed.
