# RUI-NAV-07 — Science System Consolidation

Status: **Implementation committed for PR CI; promotion and deployment require exact-SHA evidence.**

## Baseline and workstream isolation

- Repository: `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`
- Start `main` SHA: `2c4050511f0e56ad59ff148773b327b6931ff9fb` (RUI-NAV-06 complete, production live verified).
- Dedicated branch: `rui-nav-07-science-system-consolidation`.
- Open concurrent PR #156 `3db-11-indian-ocean-scale-out` is owned by 3DB and is intentionally not modified.
- Frozen authority: `docs/RUI_NAV_00_FEATURE_INVENTORY_AND_HIERARCHY_FREEZE.md` §11.
- This phase is *navigation/information architecture*, not changes to scientific datasets, API contracts, methods, materialization, source values, QC policy or 3D renderers.

## Canonical Science System homes

| Directory | Production location | Evidence source / boundary |
| --- | --- | --- |
| Overview | `#science-overview` | Existing Science mission, problem, response |
| Scientific Context | `#science-scientific-context` | Existing model→time→observation→explanation evidence ladder |
| Data Provenance | `#science-data-provenance` | Existing catalog / runtime provenance plus selected `deriveMainBlockProvenanceEvidence` contract |
| Quality Control | `#science-quality-control` | Runtime provider QC acceptance, distance cap, no extrapolation, weighting, matching methods; missing metadata remains unavailable |
| Source Integrity | `#science-source-integrity` | Runtime reference checksums and selected-block manifest/validation gate, with withheld or unknown states |
| Architecture | `#science-architecture` | Preserved end-to-end verified-source→FastAPI→static fail-safe→browser pipeline |
| System Health | `#science-system-health` | App-collected degraded warnings, runtime mode/freshness, metadata availability and block eligibility; not a live provider-network uptime claim |
| Capabilities | `#science-capabilities` | Preserved verified MVP capability descriptions |
| Limitations | `#science-limitations` | Canonical catalog disclaimer and scientific boundary |
| Demo / Verification Guide | `#science-demo-guide` | Preserved five-stage evidence walkthrough |

All ten homes have unique `data-science-home` and element IDs, and usable keyboard-operable directory buttons. The route remains `#/about`; `#/about?section=<home>` deep links to its section without breaking historical hashes.

## Scientific preservation and provenance safety

1. **Reference ≠ selected block.** Existing GLORYS/Argo cards are explicitly the verified **reference** bundle. Selected-block evidence is rendered separately from the 3DB-10 evidence contract.
2. Planned blocks and manifest-invalid pilots have `withheld` evidence state, no eligible active payload, no active-block source identity, and no source-integrity/renderer claims.
3. Source-backed pilots expose only canonical SHA-256 records provided by the manifest; no checksums or provider validation are recomputed or invented by this UI phase.
4. QC and comparison statements are projections of `provenance.quality_control` and `provenance.methodology`; absent provenance fails closed.
5. The Science page does not enable single-timestamp GLORYS playback, infer vertical currents, infer missing observations, or label a diagnostic comparison as global validation.
6. Global Sources & QC drawer remains a contextual shortcut to relevant facts for active workflows; Science System is the canonical comprehensive home. NAV-09 and NAV-12 own future deduplication/presentation seam migration.
7. System health is limited to warnings observed within the current application session, not real-time upstream provider health.
8. All old mission, pipeline, capabilities, limitations, demo and scientific disclaimer copy remains available.

## Files changed

- `frontend/src/components/ScienceSystemDirectoryNav.tsx`: ten canonical homes, human-readable navigation and compatible deep links.
- `frontend/src/pages/InfoPage.tsx`: reparent old content; canonical reference and active-block provenance; QC, integrity, warnings/system health.
- `frontend/src/App.tsx`: pass existing `activeBlockProvenanceEvidence` and `degradedWarnings` to Science System.
- `frontend/src/science-system-consolidation.css`: responsive, dark/light and reduced-motion-aware directory and integrity cards.
- `frontend/src/main.tsx`: load scoped CSS.
- `frontend/e2e/rui-nav-07-science-system-consolidation.spec.ts`: ten-home, deep-link, evidence/withheld and mobile checks.

## Required verification before completion

- Exact PR head `tests` and `final-mvp` pass.
- Ten homes + provenance truth tests pass in Chromium.
- Compare `main` and PR head for overlap with 3DB-11; rebase/reconcile if unrelated commits change `main`.
- Merge only green reviewed work.
- Exact resulting main SHA passes `tests`, `final-mvp`, `deploy-oceantwin-pages`, including public HTTPS and complete Chromium tests. Live entry: `https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/about`.
- Persist final SHA, CI run IDs, public verification and known limitations in the phase PR.

Rollback: revert the RUI-NAV-07 merge through normal Git history and let existing Pages deployment run; never force-reset shared production main.
