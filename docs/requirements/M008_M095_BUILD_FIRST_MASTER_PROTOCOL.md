# Ocean Canvas — M008–M095 Build-First Master Execution Protocol

**Created:** 2026-10-18  |  **Mode:** DEVELOPMENT ONLY  |  **Status:** ACTIVE BUILD TRAIN, NOT RELEASED
**Original authority:** Ocean_Canvas_18_Themes_Repository_Cleanup_Complete_Phase_Plan.docx (user Library) and unmodified `docs/requirements/USB140_MASTER_HANDOFF.md` (Parts A–M), plus `M000_TRACEABILITY_REGISTER.md`.
**Live baseline inspected:** `main@75880aa1714b68d92fbd2a652a10ed1d8a85c0d8`. Existing M001–M007 science/browser fixes: PR #202 head `9345be45430b88e2969e4066fd9d728301f10bb2`; deliberately made **DRAFT**, with production work not certified. This build branch starts from that reviewed candidate and **does not merge it into main**.

## 1. Objective and execution boundary
Complete all 88 code-indexed phases M008 through M095 as working, reviewed, tested development changes, *then* start a separately authorized production integration campaign. A signed-off development phase is BUILT / TESTED, never automatically MERGED / DEPLOYED / LIVE. Do not claim later production certification in Phase M015, M047, M071, M087 or M095: write a deferred release checklist instead. Preserve the original roadmap meanings and scientific requirements; reprioritize implementation internally where needed without renumbering IDs.

## 2. Freeze, isolation, automated-merge safety
- **No direct commits to `main`, no merge operations, no production Pages changes.**
- Cumulative build branch: `build/m008-m095-science-ui-train`, initially from PR #202's verified source commit. Keep PR #202 in DRAFT as an immutable recovery reference; do not duplicate its fixes. Any aggregate build PR must also be DRAFT and **must not** contain the `OC-AUTO-RELEASE: approved` marker.
- The existing `release-conductor.yml` on `main` still runs: it excludes drafts and only opt-in eligible PRs. Check enrollment/draft state on every iteration; never make a candidate merge-eligible during the build stage.
- Non-production branch commits and CI are allowed, including pytest, React/TypeScript, local dev/staged Chromium and screenshot testing. No deferred release check may be mislabeled as complete.
- Before any destructive refactor/cleanup, perform per-file dependency and future-science audit. Unknown usage ⇒ KEEP. Preserve unrelated open historical PRs.

## 3. Non-negotiable science invariants
- 140 registered geographical cells ≠ 140 source-backed 3D volumes. Freeze 35 authentic pilots, 70 potentially eligible unmaterialized, 35 ineligible, 41 real source-backed frames, and the independent GLORYS12V1/Argo baseline until new source hashes actually authorize a change.
- Keep original `BASE-GLORYS-001` on 2024-01-02 separate from historical 2004 pilot products. Float `5907092` Cycle 13 (`20240102_indian_ocean_prof:23`), Cycle 12, QC and 99 actual level residuals are immutable diagnostic reference; never copy them to IO-087 or across years.
- Model/observation values require source id, native lat/lon/depth/time/units/QC, rights, authentic data, SHA-256, masks, deterministic lineage. Missing source evidence remains UNAVAILABLE. A 404 with nRows=0 indicates no matching results; do not manufacture a rescue profile. Observations assimilated into the model are not automatically independent validation.
- Native u/v are horizontal; missing w is missing. Satellite chlorophyll is surface only. No synthetic depth/timestamp, inappropriate extrapolation or inflated claims.
- Non-scientific visual themes must not alter real science colour ramps. Provider adapters enforce safe external URLs and licensing.

## 4. Glass UI non-regression
Maintain all 16 existing named themes and IDs, Arctic Mist default, responsive app shell, glass tokens, Explorer/Geographic and real Water Column sections, Block Details, Presentation, Telemetry, Model vs Observation, Data Lab and navigation. M087/TH-L/TH-D additions introduce two separately selectable **Light** and **Dark** glass designs to reach 18, never overwrite/remove the original IDs or use a global invert. Target development acceptance 18 × 3 viewport classes × 2 genuine renderers = **108 real browser PNGs**, plus contrast, keyboard, touch, focus, reduced-motion, wheel-scroll and no-overlap checks. Code preserves existing UX/CSS ownership; science integrates through current adapters.

## 5. Work-unit loop and test gate
Every microphase: (1) identify original requirement and its dependency; (2) inspect real files/live base; (3) implement only necessary, reversible, reviewable additions; (4) unit/science/typecheck/integration/development-browser test; (5) record exact branch SHA, touched files, input hashes, pass/fail links, honest unknowns and next phase. The original ≤20-minute microphase is a **work-slicing budget**, not a promise of CI/provider completion; split any unfinished work. Source acquisition is never coerced into success.

Development signoff requires: committed code where applicable, relevant passing automated checks, evidence for all affected scientific/data/UI invariants, and a checkpoint. A phase with no authentic data may finish its *feasibility assessment* with an evidenced UNAVAILABLE decision, but cannot be declared scientifically materialized.

## 6. Banded route
- **M008–M015 — Recovery and browser/source compatibility:** M008 failing Playwright shards and live selectors; M009 glider; M010 CTD; M011 BGC; M012 retry/QC; M013 static inventory/MPR scope; M014 PR #200 Argo and presentation; M015 build-only recovery candidate.
- **M016–M023 — Scientific integrity contracts:** Separate readiness/observations/matchup/render/deployment; claims linter; portable provenance; versioned historical/current manifests; provider rights; cross-year compatibility; real BGC S-prof vs fabricated data; atomic promotion and negative-hash tests.
- **M024–M031 — Competitor evidence and backlog:** Dated code-search census, fork deduplication, authenticity claims, ingestion/QC/model comparison, real 3D engineering, backend/security/CI, UX/accessibility, A01–Y12 reconciliation.
- **M032–M039 — Provider adapters:** Versioned adapter types; Copernicus; INCOIS; Argo raw/adjusted/QC; genuine glider; CCHDO CTD; authentic BGC S-prof; relevance/rights for moorings, drifters, ADCP, radar, satellite.
- **M040–M047 — IO-087 authentic source and diagnostics:** Canonical 66–69°E 11–13°N; rights/time-specific 2024 source request; resumable acquisition; SHA; native axes; Float 5907092 compatibility; new only source-correct residuals; UI adapters. Any missing data remains unavailable.
- **M048–M055 — Remaining 105-cell feasibility atlas:** Versioned reproducible atlas; seven 15-position evidence batches; every unknown/eligible/ineligible explicitly distinguishable, no cloned payload.
- **M056–M063 — Universal matchup engine:** Sensor QC; coast-safe wet-cell spatial relation; valid time support; adjacent-bracket depth interpolation; CF/TEOS; signed model−observation residual statistics; assimilated-observation caveat; deterministic exports.
- **M064–M071 — 3D source-backed rendering:** Backward-compatible block renderer; stale request race cancellation; native volume coordinates; clipping/transect/isosurface; only measured u/v; bathymetry/masks; benchmark LOD/camera/GPU; geographic↔water/inspector synchronization.
- **M072–M079 — Temporal, variable and physics:** Source-native interval/time semantics; real multi-date selectors; no invented frames; surface-only chlorophyll; sensor-specific units; source-eligible TEOS/stratification; conditional heat content/MLD/thermocline; time-change browser validation.
- **M080–M087 — Glass design and accessibility:** Freeze tokens; theme IDs/persistence; panel scroll/hit targets/keyboard/touch; Presentation/Block Details geometry; science atlas panels; honest QC empty states; WCAG/reduced motion; add separate Light and Dark choices and 18×3×2=108 real rendered screenshot targets.
- **M088–M095 — Performance, security, reproducibility, fallback and docs:** Measure before optimize; source-correct LOD/cache; stale/offline error cases; secure upload/URL handling; vulnerability/licenses; deterministic builds; Pages/static/FastAPI/Streamlit recovery; final documentation, spell-check and traceability.

## 7. Exact M008–M095 execution ledger
Each row is the source-plan task and its minimum **development** acceptance. State starts `QUEUED` unless separately evidenced.
| Phase | Build task | Development proof | Initial status |
|---|---|---|---|
| M008 | Reproduce failing Playwright shards and map selectors to actual UI state | Minimal reproductions | QUEUED |
| M009 | Determine authentic glider provider failure cause, endpoint/errors/legal access | Provider failure analysis | QUEUED |
| M010 | Determine authentic CTD failure cause and source-schema compatibility | CTD failure analysis | QUEUED |
| M011 | Determine authentic BGC failure cause and QC semantics | BGC failure analysis | QUEUED |
| M012 | Fix legitimate transient/retry/schema/cache behavior, never substitute fabricated evidence | Source retry/QC tests | QUEUED |
| M013 | Fix static-science inventory and MPR release scope without weakening CI | Green affected checks | QUEUED |
| M014 | Audit PR #200 default Argo, persisted overrides, presentation geometry and science status | Argo/layout acceptance | QUEUED |
| M015 | Stage an unmerged, non-enrolled recovery candidate; defer REL-001 certification | Candidate ledger | QUEUED |
| M016 | Define geographic/model/observation/matchup/render/deployment states separately | Typed status schema | QUEUED |
| M017 | Correct unsupported independent-validation, real-time, ML, operational claims | Terminology linter | QUEUED |
| M018 | Sanitize public provenance paths without losing source hashes/methods | Portable exports | QUEUED |
| M019 | Version historical versus current manifests preserving raw provenance | Chronological lineage | QUEUED |
| M020 | Audit DOI/attribution/licensing/redistribution | Provider rights matrix | QUEUED |
| M021 | Gate cross-source year/time, spatial, depth, variable compatibility | Time-mismatch rejection tests | QUEUED |
| M022 | Differentiate invented demonstrations from authentic BGC S-prof products | Authenticity classifiers | QUEUED |
| M023 | Atomic source-backed materialization, masks and negative-hash tests | No partial promotion | QUEUED |
| M024 | Dated refresh of the 98-candidate GitHub registry and code search | Search census | QUEUED |
| M025 | Deduplicate fork/upstream/mirrored ownership | Upstream map | QUEUED |
| M026 | Classify real/model/climatology/synthetic/unknown source claims | Code-backed authenticity audit | QUEUED |
| M027 | Audit competitor ingestion, QC, provenance and model-observation | Specific comparison | QUEUED |
| M028 | Audit native 3D field/slicing/flow/camera/bathymetry/GPU | Rendering patterns | QUEUED |
| M029 | Audit API/cache/security/tests/CI/failures | Engineering patterns | QUEUED |
| M030 | Audit controls/mobile/accessibility/scientific explanation | UX patterns | QUEUED |
| M031 | Reconcile research findings to A01–Y12 backlog, deduplicate solutions | Decision ledger | QUEUED |
| M032 | Versioned provider adapter interfaces and legal-access labels | Typed interfaces | QUEUED |
| M033 | Check Copernicus source versions/variables/rights/acquisition | Copernicus verification | QUEUED |
| M034 | Check INCOIS physical/chlorophyll/OPeNDAP/WMS native semantics | INCOIS verification | QUEUED |
| M035 | Verify Argo GDAC adjusted/raw and platform/cycle QC | Argo reference tests | QUEUED |
| M036 | Verify glider mission/depth/time/calibration/QC/download | Glider adapter tests | QUEUED |
| M037 | Verify CCHDO CTD instrument/calibration/pressure | CTD adapter tests | QUEUED |
| M038 | Verify BGC oxygen/chlorophyll/nutrients and authentic S-prof QC | BGC tests | QUEUED |
| M039 | Decide mooring/drifter/ADCP/radar/satellite suitability and license | Adopt/defer log | QUEUED |
| M040 | Freeze IO-087 66–69°E 11–13°N polygon/masks/source identity | Canonical state | QUEUED |
| M041 | Design genuine 2024 provider-native acquisition with time rights | Request manifest | QUEUED |
| M042 | Resumable authentic source retrieval or explicit blocked status | Raw data/blocker | QUEUED |
| M043 | Verify IO-087 source SHA and transform lineage | SHA/provenance | QUEUED |
| M044 | Verify native wet grid/depth/time/units/u/v for IO-087 | Science checks | QUEUED |
| M045 | Match Float 5907092 only for scientifically eligible time/physics | Eligibility/QC | QUEUED |
| M046 | Calculate new block residuals/uncertainty only from authentic matches | New metrics or unavailable status | QUEUED |
| M047 | Integrate source-backed views/provenance; hold REL-003 production gate | Development browser evidence | QUEUED |
| M048 | Define 105-cell reproducible observation/temporal atlas schema | Atlas contract | QUEUED |
| M049 | Assess canonical unmaterialized positions 1–15 | Source query audit | QUEUED |
| M050 | Assess positions 16–30 | Source query audit | QUEUED |
| M051 | Assess positions 31–45 | Source query audit | QUEUED |
| M052 | Assess positions 46–60 | Source query audit | QUEUED |
| M053 | Assess positions 61–75 | Source query audit | QUEUED |
| M054 | Assess positions 76–90 | Source query audit | QUEUED |
| M055 | Assess positions 91–105 and reconcile true eligibility | Atlas audit | QUEUED |
| M056 | Define instrument QC and adjusted-mode policies | QC tests | QUEUED |
| M057 | Coastline-aware wet-cell matching and justified interpolation | Spatial tests | QUEUED |
| M058 | Correct valid-time/window/mean/forecast semantics | Negative temporal tests | QUEUED |
| M059 | Bracketed vertical interpolation without extrapolation | Numerical depth tests | QUEUED |
| M060 | CF/TEOS-10 variable harmonization with proper definitions | Reference fixtures | QUEUED |
| M061 | Compute signed bias, MAE, RMSE, exclusions and depth bands | Reference statistics | QUEUED |
| M062 | Record sensor uncertainty and assimilation dependence | Scientific caveats | QUEUED |
| M063 | Reproducible profile charts and source-linked downloads | Deterministic artifact tests | QUEUED |
| M064 | Reusable backward-compatible source-backed block renderer | Manifest/UI parity | QUEUED |
| M065 | Reject stale async results for changed block/source/date/depth | Race tests | QUEUED |
| M066 | Preserve true 3D depth/coordinate semantics | Value probes | QUEUED |
| M067 | Source-eligible clipping/transect/isosurface/transfer functions | Geometry tests | QUEUED |
| M068 | Real u/v currents without absent w | Vector tests | QUEUED |
| M069 | Genuine bathymetry/coast/wet masks | Geographic tests | QUEUED |
| M070 | Profile camera, LOD, GPU memory, fallback and samples | Measurements | QUEUED |
| M071 | Sync globe/column/markers/provenance/comparison | Development Chromium tests | QUEUED |
| M072 | Source-native time, time bounds, origin | Temporal schema | QUEUED |
| M073 | Display genuine available dates; select real frames | Frame tests | QUEUED |
| M074 | Reject interpolated timestamps/stale caches/year mismatches | Negative cases | QUEUED |
| M075 | Keep satellite chlorophyll surface-only; BGC profiles separate | Variable-gating tests | QUEUED |
| M076 | Source-appropriate sensor profiles and units | Profile/units tests | QUEUED |
| M077 | Add eligible TEOS density/T–S/stratification only | Numerical tests | QUEUED |
| M078 | Gate heat content/MLD/thermocline/cyclone derivations by source | Formula/uncertainty decisions | QUEUED |
| M079 | Test actual time/source changes across views/downloads/charts | Browser tests | QUEUED |
| M080 | Freeze approved glass tokens and ownership | Token parity | QUEUED |
| M081 | Preserve stored theme IDs and science-independent palettes | Persistence tests | QUEUED |
| M082 | Fix scroll/hitbox/keyboard/touch integration | Interaction tests | QUEUED |
| M083 | Align Presentation and Block Details without overlap | Geometry screenshots | QUEUED |
| M084 | Add scientific status, atlas, comparison panels reusing glass tokens | Cross-view tests | QUEUED |
| M085 | Show real QC, provenance, degraded/empty states | Source labels | QUEUED |
| M086 | Keyboard/focus/screen reader/contrast/reduced motion review | Accessibility results | QUEUED |
| M087 | Add distinct Light/Dark choices to original 16; 108 genuine screenshots | 18-theme matrix | QUEUED |
| M088 | Benchmark transfer/bundle/GPU/paint/3D latency first | Measured budgets | QUEUED |
| M089 | Source-correct chunk/LOD/cache optimization | Benchmark regressions | QUEUED |
| M090 | Repair stale requests/cache corruption/offline handling | Network-negative tests | QUEUED |
| M091 | Secure uploads/source fetch allowlists/API input | Security negative tests | QUEUED |
| M092 | Audit secrets/dependencies/licenses/attribution | Security/rights report | QUEUED |
| M093 | Reproducible builds/trusted workflows/checksums | Determinism tests | QUEUED |
| M094 | Validate static Pages package and FastAPI/Streamlit fallback WITHOUT publishing | Local fallback tests | QUEUED |
| M095 | Update science docs/spelling/traceability/release-readiness ledger | Final change log | QUEUED |

## 8. Development evidence receipts
For each phase maintain: (a) phase ID and USB-140 section/backlog links, (b) exact parent and head SHA, (c) changed filenames and motivations, (d) provider/DOI/rights/raw checksum, native axes/QC and request outcome, (e) exact pytest/build/unit and development Playwright result links, (f) actual screenshots only, (g) regression + rollback path, (h) BLOCKED/PARTIAL/IMPLEMENTED/TESTED state, (i) next unblocked phase. Never use PASS if a test was not executed.

## 9. Stop rules
Stop automatic progression on destructive or permission-sensitive requests; source evidence contradictions; changed immutable hashes; failed exact-head tests; theme/scroll/3D regressions; provider licensing uncertainty; a race where the release conductor might merge a non-draft enrolled PR; or missing source data needed for a scientific result. Fix safely, or record an actionable blocker. Do not clear or dismiss failures by removing the meaningful assertion.

## 10. Stage-B release handoff (DEFERRED)
After M008–M095 development acceptance, audit aggregate diff, reconcile PR #202, adjudicate migration/merge ordering and potential conflicts, then **request user authorization** to begin release. Stage B applies clean reviewed merges, exact-commit PR CI, required scientific and full 18-theme Chromium runs, Pages deployment, public HTTPS + all four live Chromium shards on the identical production SHA, final source-asset checksum checks, and rollback/readiness certification. These activities are explicitly **NOT part of Stage A**, and never happen automatically before authorization.

## 11. Current authoritative checkpoint
- `main`: `75880aa1714b68d92fbd2a652a10ed1d8a85c0d8`, not newly modified for build-first.
- PR #202: open **DRAFT**; includes existing CTD fallback and modern real MPR planned/dual-view/light-default E2E corrections.
- Build branch starts at that PR head; M008 first action is to isolate four failing old public Chromium shard-1 expectations and tie their corrected selectors to the production DOM; no stale test assertion may be silently deleted.
- Branch CI and development screenshot results must be collected before claiming M008 TESTED.
