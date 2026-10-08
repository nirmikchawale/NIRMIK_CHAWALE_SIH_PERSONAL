# RUI-MPR-08 — Ocean Intelligence Evidence Hub

**Parent:** MPR-07 PR #176. **Phase branch:** rui/mpr-08-ocean-intelligence-evidence-hub

## Changes
- The old bottom `evidence-status-pill` is removed; a clearly labelled Ocean Intelligence evidence action inside the source island now invokes the existing `EvidenceRail` with the same inspector state and onClose behaviour.
- The old Explorer header `Sources & QC` action is relocated into the same evidence hub and continues to open the unmodified `ProvenanceDrawer`. The EvidenceRail's internal Sources & methodology link also remains functional.
- Actual field loading/error/degraded signals are passed as props; no fabricated verification or inference is introduced.
- The existing three workflow quick links, active block disclosure, source choice buttons and globally available scientific context header remain. No new chatbot or unimplemented AI Copilot is presented.
- New CSS is driven exclusively by the 16 existing glass-theme tokens, including keyboard, forced-colours, reduced motion, 1440/1024/390/320 layouts.

## Guardrails
No scientific model/observation values, timestamps, depths, QC, source provider IDs, manifest, provenance values, Cesium/WaterColumn renderer code, backend endpoints or downloads are changed.

## Verification/Release
Run exact-head TypeScript/Vite build, targeted MPR-06/07/08 Playwright, complete Chromium acceptance, Python/science/fallback and all 16 themes; confirm source selection persistence and both real inspector actions. Parent PRs #172→#176 must be independently CI/Pages verified and merged first. Retarget/reconcile against current main before merging. LIVE only after production Pages build/deploy and public Chromium acceptance for the merged SHA.
