# OCEAN CANVAS — UNIVERSAL SCIENTIFIC BLOCK STANDARD (USB-140)
## Complete Research, Architecture, Implementation, Scientific Validation, UI/UX Preservation, and Production Release Master Handoff

**Project:** Ocean Canvas — Smart India Hackathon 2026, Problem Statement **SIH26067**  
**Team:** The Optimizers  
**Document status:** **PLANNED / HANDOFF**, not a declaration of implemented or deployed functionality  
**Project repository:** https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL  
**Public application:** https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore  
**Scientific comparison reference:** Argo Float **5907092**, Cycle 13 descending, profile `20240102_indian_ocean_prof:23` versus the immutable `BASE-GLORYS-001` GLORYS12V1 model baseline  
**Evidence snapshot:** repository `main` at `79b51d83aa8db5c86192b68a31cf0d16b5d5afbc` (checked in the originating October 18, 2026 discussion). Recheck all live state on resumption; this is a snapshot, not a claim that it remains current.  
**Primary purpose:** Paste this entire file into a new discussion to solicit additional scientific recommendations, then use the verified and reconciled version as an engineering master plan. Preserve the existing application and its design as non-negotiable constraints.

---

# PART A — MISSION, PRINCIPLES, AND NON-NEGOTIABLE OUTCOMES

## A1. Mission

Evolve Ocean Canvas from its original verified GLORYS12V1–Argo diagnostic demonstration and 35 source-backed pilot geographic blocks into a **repeatable, scientifically defensible, source-verified and fully integrated Indian Ocean block platform**. Replicate the **scientific method, evidence discipline, visualization, statistical diagnostic capability, provenance, and reproducibility** of the Argo 5907092 reference across **every geographically eligible block for which actual source evidence exists**.

Do **not** interpret the mission as copying Float 5907092, its coordinates, profiles, depth counts, statistics, or a visually attractive 3D field into other blocks. Every new block must derive from its **own genuine geographic source data**, actual source timestamps, native depths, verified sensor observations, source-compatible scientific methods, and real statistical results.

## A2. The distinction that governs the entire project

Every block has three **independent** capability tracks:

1. **Model-backed 3D:** Authentic gridded model data for a block, source-verified and rendered in the geographic globe and water column with genuine longitude/latitude/depth/time/variables.
2. **Observation context:** Authentic, QC-traceable Argo, glider, CTD, BGC, mooring or other relevant observations inside or near a block, even if no valid model matchup exists.
3. **Model–observation diagnostic comparison:** A scientifically valid pairing with proven variable compatibility, geographic/temporal/vertical support, processing methodology, residuals, QC, uncertainty and reproducible outputs.

Model availability **never** proves observation availability. Observation location **never** proves a valid matchup. A matchup **never** automatically constitutes statistically independent external validation, especially where the reanalysis may assimilate the observations. Visual rendering **never** proves model skill.

### Target outcome

- All **140** logical geographic blocks receive truthful and correctly versioned geographic, materialization and scientific-evidence statuses.
- All **105 currently eligible ocean/coastal blocks** are evaluated for genuine data and, **only where authoritative data can be acquired and validated**, promoted to scientifically source-backed model blocks. The 35 existing pilots count toward this 105.
- All **35 currently ineligible geographic cells** stay geographically honest and scientifically locked; no artificial ocean volumes. A completely new 140-ocean-block grid is a separate, explicitly approved and versioned geographic redesign, not part of this default plan.
- All eligible materialized blocks share one robust 3D workflow and uniform provenance, QC, navigation and download contracts.
- Every genuine observation candidate is classified and paired whenever scientifically justified; missing comparisons are explained without invented data.
- Every delivered feature works with the **current React/Cesium application, existing glassmorphism styling, all sixteen themes, responsive layout, navigation and scientific UI controls**.
- Public deployment and real-browser scientific certification are demonstrated for the exact released commit before any completion claim.

## A3. Scientific honesty / hard prohibitions

Never:

- Clone Argo 5907092 into a different location or date, or reuse its diagnostics as another block's outputs.
- Produce synthetic measurements, timestamps, depth levels, coordinates, ocean masks, QC marks, checksums, source identifiers or purported observations.
- Re-label interpolation, visual exaggeration or level-of-detail rendering as source-native measurements.
- Compare an observation from 2024 with a 2004 model frame and present it as time-matched.
- Claim independent model validation merely because GLORYS and an in-situ record differ by a measurable amount; examine assimilation dependence.
- Extrapolate above/below valid model depth brackets in the established baseline matchup method.
- Populate land blocks with fabricated ocean volumes or declare planned blocks source-backed without actual payloads.
- Claim true vertical current velocity when only horizontal `uo`/`vo` exist.
- Render satellite ocean-colour chlorophyll as a 3D subsurface concentration without appropriate genuine vertical source data.
- Suppress a truthful **DEGRADED MODE** warning, switch it to healthy by hardcoding, remove error checks, weaken scientific tests, or fabricate a successful browser screenshot.
- Relabel a stale model field when the user switches block, time, variable, source or depth. The visible data must match the displayed selection.
- Alter raw historical evidence to make checks pass; preserve immutable originals, versions and provenance.
- Change existing 16 themes into one style (including Arctic Mist), change scientific color ramps when UI themes change, or replace the approved global glassmorphism system.
- Assume a branch, PR, code build, green unit test, local preview or GitHub merge establishes successful public deployment.

---

# PART B — VERIFIED EXISTING BASELINE AND OPEN LIMITATIONS

## B1. Canonical source-backed inventory (repository snapshot)

Read and independently reverify:

- `frontend/public/main-blocks/manifest.json`
- `frontend/public/main-blocks/capability-audit.json`
- `frontend/src/main-block-runtime.ts`
- `frontend/src/main-block-capabilities.ts`
- `frontend/src/main-block-observations.ts`
- `docs/3DB_14_FULL_BLOCK_CAPABILITY_AUDIT.md`
- `docs/3DB_15_FINAL_3D_BLOCK_ACCEPTANCE.md`

| Classification | Verified repository count | What it means |
|---|---:|---|
| Logical geographic cells | **140** | The complete canonical geographic grid, including some land/ineligible cells |
| Source-backed materialized pilots | **35** | Genuine model source frames exist and passed documented source-contract checks |
| Eligible still-planned blocks | **70** | Geographically suitable for further genuine model acquisition, but **not yet materialized** |
| Ineligible still-planned cells | **35** | Geographic cells failing present ocean/coastal eligibility; do not invent model values |
| Total planned/unmaterialized | **105** | 70 eligible + 35 ineligible |
| Genuine payload frames | **41** | SHA-256-referenced materialized block/date files |
| Pilots with more than one genuine date | **6** | Two real source dates for those pilots; not general continuous animation |
| Source-backed independently compared pilot blocks | **0** | Original GLORYS–Argo baseline is separately represented |
| Separate original baseline | **1** | `BASE-GLORYS-001`, **not part of the 140** |
| Land-dominant source materializations | **0** | Must remain zero under current ocean-only scientific criteria |

Of the 35 pilots, 32 are classified ocean and 3 coastal in the canonical capability-audit snapshot. A geographic status or a source-backed 3D contract is **not** independent production-browser proof for all 35.

### Sources and existing pilot product

- Copernicus Marine / Mercator Ocean **GLORYS12V1**, product `GLOBAL_MULTIYEAR_PHY_001_030`.
- Existing 35 pilots: historical source frames from `2004-03-15`, with second verified frame `2004-07-28` for six blocks, through an approved archive source.
- Native pilot payload semantics: `thetao` (temperature), `so` (salinity), `uo`/`vo` (horizontal currents), real coordinates, real positive-down depth, daily-mean time semantics, NaN/missing land preservation, source details and SHA-256.
- Example: `frontend/public/main-blocks/data/IO-001/2004-03-15.json` has a 31 depth × 13 latitude × 19 longitude source-backed stride-subset; do not generalize those exact horizontal dimensions to every product or region.
- Existing Level-of-Detail (LOD) is **rendering sampling of source tuples**, not creation or validation of new scientific measurements.

## B2. Immutable original GLORYS–Argo reference

| Field | Verified reference |
|---|---|
| Model reference | `BASE-GLORYS-001`, GLORYS12V1 |
| Model day | 2024-01-02 (genuine single verified timestep) |
| Local model region | Approximately 67–70°E, 12–14°N |
| Model cube | **31** native subset depth levels × **25** latitudes × **37** longitudes |
| Model depth range | Approximately **0.494–453.938 m**, positive downward |
| Parent GLORYS12V1 | Parent product may have **50** vertical levels; do not confuse with the exported regional **31** |
| Float | **5907092**, actual source instrument identifier |
| Preferred reference profile | `20240102_indian_ocean_prof:23` |
| Cycle and direction | **13**, descending (`D`) |
| Observation time | **2024-01-02T14:46:00Z** |
| Coordinates | Approx. **67.618648°E, 12.837103°N** |
| Nearest model cell | Approx. **67.583336°E, 12.833333°N** |
| Geographic separation | **3.851 km** |
| Matched observation levels | **50**, QC-screened; not 50 model depths |
| Cycle 13 signed mean bias | Approx. **+0.0233 °C** (model minus observation) |
| Cycle 13 MAE | Approx. **0.2254 °C** |
| Cycle 13 RMSE | Approx. **0.3188 °C** |
| Cycle 13 maximum absolute difference | Approx. **1.076 °C** |
| Offset relative to model daily-mean midpoint | **+2.767 hours** |
| Two-profile demonstration | Cycle 13: 50 levels; Cycle 12: 49 levels; **99 matched observations** total |
| Evidentiary status | **Diagnostic comparison**, NOT demonstrated independent/global validation |

Reproduction must use the documented thermodynamic method, QC and the original source manifest. The original GLORYS field is potential temperature (`thetao`); adjusted Argo sensor temperature is processed using the documented TEOS-10/GSW conventions before comparison. Pressure-to-depth conversion uses source pressure, latitude and validated equations. The original interpolator brackets observation depths with valid model depths and does **not** extrapolate. Document measurement uncertainty, time representativeness, space separation, correlated depth samples and possible reanalysis assimilation.

**Primary reference files:** `docs/SCIENTIFIC_METHOD.md`; `data/comparison/profile_5907092_cycle013_D_summary.json`; `data/comparison/profile_5907092_cycle012_A_summary.json`; `data/comparison/temperature_comparison_engine.py`; `data/comparison/comparison_provenance.json`; `data/comparison/verification_results.json`.

## B3. The first major scientific expansion target: IO-087

- Canonical block: `IO-087`, **Central Arabian Sea**.
- Bounds: **66–69°E**, **11–13°N**.
- Both genuine 5907092 profiles lie **inside** its geographic footprint.
- Currently `materialization: planned`; **zero materialized IO-087 model frames** in the canonical inventory.
- Existing relationship is **spatial context only**, not a validated IO-087 scientific matchup.
- Existing pilots mainly use **2004**, original Argo reference is **2024**: a new **genuine, temporally appropriate** 2024 IO-087 model source frame is needed for a model–observation comparison.
- Do not copy the `BASE-GLORYS-001` field into IO-087 and call it new original native IO-087 evidence unless the overlap and source relationship are explicitly modeled and provenance is transparent.
- First complete the source/license/access feasibility, then acquire and verify independent source-backed IO-087 output; reuse the *real* Argo observation, recompute the matching in IO-087's own scientific coordinate/data contract, and report all limitations.
- The first milestone is a **reproducible geographic-block reference**, not an unsupported claim of improved model skill.

## B4. PR #200 and deployment truth

- Open **draft** PR: https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/pull/200
- Purpose: prefer verified Argo **5907092 Cycle 13** as initial *observation* while retaining genuine `BASE-GLORYS-001` as the *model*; preserve explicit selections and fail-closed science status.
- Snapshot of checked PR: **not merged** and **not certified publicly deployed**.
- Some repository tests, source contracts, UI scope tests and 3D acceptance suites passed during the originating work, but full `final-mvp` and MPR release certification had failures; no final public browser certification was established.
- Failures included acquisition of genuine Glider/CTD/BGC source packs and parts of live-browser acceptance. A bounded retry did not establish an overall green release.
- `main` was checked at `79b51d83aa8db5c86192b68a31cf0d16b5d5afbc`; latest `main` full-MVP and Pages workflows were not green at that snapshot.

**Mandatory resume rule:** Re-fetch branch/PR/main/workflows/deployment live at the start of any future execution, do not assume the above has stayed unchanged. Diagnose and repair genuine source/network/CI failures; never replace source evidence with synthetic content or weaken fail-closed tests to force green.

## B5. Evidence hierarchy

Highest authority, in descending order:

1. Current provider raw scientific products/metadata, explicit licensing/usage rules and validated data files.
2. Canonical repository scientific manifests, immutably checksummed payloads, baseline verified comparison evidence and scientific methods.
3. Current authoritative source code, dependency declarations and passing automated tests at an exact SHA.
4. Actual running production/static API assets and Chromium session evidence against an exact deployed SHA.
5. Current project documentation reconciled to the above.
6. Old roadmaps, prior assistant replies, screenshots, model-generated estimates and competitor marketing — **context only**, never evidence that a science capability is implemented.

Do not silently resolve contradictions. Report the discrepancy, source precedence, proposed correction and gate for confirmation. Record historical claims separately from current status.

---

# PART C — FULL SCIENTIFIC PRODUCT REQUIREMENTS

## C1. Geographic and block identity

Each logical block needs immutable (or explicitly versioned) ID, geographic bounds, overlap policy, coordinates, ocean fraction, coastline/land-mask provenance, geographic region, resolution, original source set, materialization state, accepted native frames, and observation and matchup inventory. Preserve the source grid rather than inferring arbitrary depth grids from a pretty visual.

Define block geometry deterministically; account for longitude conventions, coordinate wrapping, edge and ownership rules, coastal subcells, out-of-domain sensors and empty wet-cell regions. Preserve existing 140-ID meanings unless a reviewed **versioned grid migration** explicitly authorizes changes.

## C2. Core ocean fields

For each model product and block, ingest genuine source-backed variables when present:

- Temperature (correct in-situ/potential/conservative conventions and units).
- Salinity (practical/absolute definitions and units, appropriately labeled).
- Horizontal velocities (`uo`, `vo`) and derived horizontal vector magnitude/direction with calculation provenance.
- Native depth coordinate, thickness/vertical grid interpretation, true bathymetry or wet masks, geographic coordinates and time coordinates.
- Optional genuinely present sea-level, mixed-layer depth, density, oxygen, chlorophyll, biogeochemistry, waves or other scientifically comparable products **only after separate source and schema review**.

A variable unavailable in a source is shown as **not provided**, not fabricated or silently substituted. Satellite chlorophyll remains surface-only unless an actual vertical product exists. Do not claim `wo` or full 3-component currents from `uo`/`vo` alone.

## C3. Native temporal evidence

- Preserve provider/model version and valid timestamp semantics (instantaneous, daily mean, forecast valid time, etc.).
- Preserve time bounds and midpoint where available. Surface the offset between observation instant and model temporal support.
- Do not invent intermediate frames; temporal interpolation, if scientifically permitted, must be explicitly marked as a derived product and separately audited.
- Display actual available dates, coverage gaps, source changes and product incompatibility.
- Support smooth UI playback only over actual verified source frames; visual animation between them must not masquerade as additional measured/model valid times.

## C4. Observations — source discovery and ingest

Design a multi-provider source registry that captures provider, dataset DOI or stable accession, licence/attribution, instrument/platform/cycle/cast identifiers, source file/URI, position/time/depth, adjusted/raw measurement selection, quality flags, variable semantics, uncertainties and provenance.

Candidate sources:

- Argo GDAC (profiling floats; carefully distinguish delayed-mode adjusted from real-time values).
- Gliders (operator/mission/ERDDAP/provider-specific QC; real depth, temperature, salinity and supported sensors).
- CTD and GO-SHIP/CCHDO ship stations (cruise, station, cast, pressure and documented calibrations).
- BGC Argo and authenticated biogeochemical networks (oxygen, chlorophyll, nitrate, pH, irradiance, etc., **only when actually measured**).
- Moorings and fixed time series for appropriate time/depth comparisons.
- Drifters for applicable surface current/trajectory contexts, not generic vertical profiles.
- Satellite products, including ocean colour, SST and altimetry, with their own cloud masking, collocation and uncertainty methods.
- INCOIS fields, original source metadata, operational multi-time data where actually available.

Provider discovery may return **zero** eligible observations. Report that honestly and still support source-verified model rendering.

## C5. Model–observation matchup science

Define a versioned universal matchup engine that accepts an eligible model block/frame and observation profile/point/track. Pipeline:

1. Validate source authenticity, time and geographic bounds; persist original source identifiers and checksums.
2. Validate observation data mode, adjusted values, provider QC and variable-specific quality screening.
3. Harmonize coordinates, longitude wrap, latitude, depth-positive convention, pressure-to-depth and units.
4. Verify compatible physical variables and temperature/salinity thermodynamic definitions; handle derived quantities explicitly and reproducibly.
5. Match to correct model wet cell or permit carefully specified horizontal interpolation; account for land/coastal masks and sampling representativeness.
6. Validate temporal support and a justified maximum permissible time difference **per scientific source/use-case**, not a single arbitrary universal window.
7. Interpolate vertically **only between bracketing valid model depth levels** where justified; avoid unsupported extrapolation.
8. Report every accepted and excluded level and exclusion reason; preserve source uncertainty flags.
9. Compute signed bias (`model − observation`), absolute differences, MAE, RMSE, sample count, maximum absolute residual, depth bands and optional salinity/currents-specific metrics when appropriate.
10. Plot model-vs-observation by depth, residual-vs-depth, location/time context, uncertainty intervals when supportable, and source coverage.
11. Record source lineage, code/algorithm version, configuration, interpolation, sensor QC, model assumptions and platform identifiers.
12. Explicitly assess whether the observation may have been assimilated into the reanalysis; **diagnostic comparison is not automatically independent validation**.
13. Produce deterministic machine-readable evidence and optional reproducible notebooks/scripts; preserve original inputs.

Statistics must distinguish descriptive agreement from causal inference, predictiveness, and out-of-sample skill. Correlated vertical levels cannot be treated as independent experiments. Avoid score inflation from multiple profiles belonging to a single float.

## C6. Evidence state and certification vocabulary

Track **separately**:

- geographic registry ready;
- provider source available;
- acquisition attempted/in progress;
- source materialized and SHA-verified;
- native dimensions/coordinates/time/depth/variables verified;
- renderer contract ready;
- independently exercised in actual production browser;
- authentic observation context discovered;
- scientifically justified matchup performed;
- matchup independently validated, *only if true and evidenced*;
- deployed and live-access verified.

Use statuses such as `PLANNED`, `SOURCE_DISCOVERED`, `ACQUIRING`, `MATERIALIZED`, `SOURCE_VERIFIED`, `RENDER_READY`, `LIVE_RENDER_VERIFIED`, `OBSERVATION_CONTEXT_ONLY`, `MATCHUP_DIAGNOSTIC`, `INDEPENDENTLY_VALIDATED` (rare, scientifically supported only), `UNAVAILABLE`, `DEGRADED`, `INELIGIBLE`, `BLOCKED`.

A single `healthy` boolean may summarize operating health but must **never overwrite** these scientific facts. A successful float selection must never clear a health warning originating from a genuinely failed source request.

## C7. Per-block source evidence bundle

Versioned outputs per block/date should include:

- model source metadata (`provider`, `product`, `dataset`, original file/link, source version/DOI where present);
- bounds, wet mask, source-native coordinate arrays, native depth/time axes, original and derived variables;
- raw preserved source checksums and published transformed-payload SHA-256, transformation lineage;
- source schema and validation reports;
- observation index and sensor/QC metadata, original observation source checksums where possible;
- matchup inputs, accepted/excluded level tables, method and output metrics;
- chart data and generated plot provenance;
- source-quality limitations, spatial/time offsets and assimilation caveats;
- UI capability manifest and deployment/build commit SHA;
- repeatable tests and a `PASS/PARTIAL/UNAVAILABLE/FAIL` certificate per gate.

---

# PART D — END-TO-END SYSTEM ARCHITECTURE

```text
Canonical 140-Cell Geographic Registry (versioned; ocean/coastal/land identity)
          │
          ├─────────── Authoritative MODEL SOURCES ────────────┐
          │       Copernicus GLORYS12V1 / compatible providers │
          │       native depth, longitude, latitude, time      │
          │       thetao, so, uo, vo; optionally other fields  │
          │                                                    │
          ├─────────── Authenticated OBSERVATION SOURCES ──────┤
          │       Argo, Glider, CTD, BGC, Moorings, etc.       │
          │       actual instrument/QC/time/depth/provenance   │
          │                                                    │
          └──────► Deterministic Scientific Acquisition Layer ◄┘
                       source access + retries + licence audit
                       immutable source files + SHA-256
                                    │
                       Scientific QC & Harmonization
                     spatial | vertical | temporal | variables
                      source-specific units & uncertainty
                                    │
              ┌─────────────────────┴────────────────────┐
              │                                          │
       Source-backed Model Frames                Observation Inventory
       chunked/versioned native arrays           provider files/profiles
              │                                          │
              └────────► Universal Matchup Engine ◄─────┘
                         only scientifically valid pairs
                                    │
                    Metrics, plots, QC and evidence exports
                                    │
                   Versioned Canonical Block Capability API
                 (static manifests and/or FastAPI query service)
                                    │
                     EXISTING OCEAN CANVAS APP SHELL
             React 19 + TypeScript + CesiumJS + current UI/CSS
             Geographic Globe ↔ Water Column ↔ Evidence Lab
             16 glass themes; source-independent science palettes
                                    │
                   Scientific + Visual + Live Release Gates
                                    │
                Published HTTPS application + certified evidence
```

### Reuse-first engineering

Preserve and extend, rather than replace, the current:

- `frontend/src/App.tsx` source/page/selection state;
- `frontend/src/components/OceanGlobe.tsx` real Cesium globe, camera and observation overlays;
- geographic and water-column visualization code, current source selectors, profile inspectors, comparison panels and downloads;
- `frontend/src/main-block-*` scientific domain/capability/integrity/observation interfaces;
- `frontend/src/pilot-main-block-loader.ts` source-backed load, time, coordinate and integrity contract;
- `frontend/src/api.ts` static-vs-API delivery handling;
- `frontend/src/theme.ts`, all current `mpr-*` theme/CSS files and RUI/MPR navigation/layout components;
- existing static GitHub Pages distribution, local FastAPI reference service and Streamlit/Plotly scientific fallback where applicable.

Generate runtime block inventories from accepted canonical manifests where possible rather than manually updating ever-growing block ID/date constants. But do not alter a frozen baseline contract casually: create a versioned migration with parity, backward compatibility, and regression tests.

### Storage and compute design (subject to profiling)

Use Python and official provider tools/approved archives for acquisition. Retain original NetCDF/HDF5 data and, if warranted by real scale, chunked Zarr or compatible immutable object-storage scientific arrays. Process with xarray/NumPy/netCDF4/GSW and relevant tested libraries; use indexed metadata for spatial/time discovery. Serve lightweight static assets for judge demo plus optional FastAPI endpoints for large queryable data. Introduce PostGIS or a more advanced job system **only when measured workload warrants** it. Do not impose unnecessary distributed architecture on the existing MVP.

Avoid unbounded cache growth; deduplicate in-flight requests, evict failed requests so retry works, budget GPU instance/LOD based on source-exact tuples, progressively load selected blocks and preserve proper time/source/depth invalidation. Separate scientific full-resolution download data from a deliberately sampled rendering view. Preserve automatic offline map fallback, Natural Earth/verified basemap rules and real coastline context.

---

# PART E — CRITICAL UI, UX, CSS AND GLASSMORPHISM NON-REGRESSION CONTRACT

## E1. UI ownership and change-control boundary

**Non-negotiable:** USB-140 adds science to the current app; it **must not rebuild the app shell**, visually replace navigation, break CSS, or regress presentation/workbench functionality. Existing RUI/MPR design ownership remains authoritative for navigation, workspaces, typography, glass components, tokens, theme engine, accessibility and responsive behavior. Scientific/3DB ownership extends model/observation contracts and is implemented through stable UI adapters. If both need change, issue a documented cross-owner interface contract and a staged review. Prefer additive minimal changes in local components, not sweeping refactors.

Do not modify the global design system merely to display a new block field; instead reuse the existing approved component/tokens. Changes to shared styling require visual baselines and explicit proof that all views and themes survive.

## E2. Preserve **all 16** actual glass themes

The canonical names in `frontend/src/theme.ts` / `docs/RUI_MPR_16_THEME_VISUAL_ACCEPTANCE.md` are:

1. Abyss Noir
2. Aurora Borealis
3. Midnight Indigo
4. Deep Sea Emerald
5. Bioluminescent Cyan
6. Coral Dusk
7. Solar Amber
8. Graphite Clear
9. Polar Frost
10. Arctic Mist
11. Pearl Lagoon
12. Glacier Mint
13. Rose Quartz
14. Lavender Haze
15. Sandglass
16. Cloud Prism

- All 16 must remain present, selectable, persistent and readable in both light/dark schemes as designed.
- Preserve current default-theme behavior (**Arctic Mist is an earlier requested default**, but verify current source before claiming or changing it); never hardcode a single theme.
- Preserve exact persisted theme IDs, app storage contract and `html[data-glass-theme]` logic unless a fully tested migration is required.
- Use existing tokens and semantic surfaces, text/focus/border colors, translucency, blur, glass layering, elevations and spacing.
- Honor forced-colors/high-contrast and reduced-motion modes; ensure fallbacks where backdrop filters are unsupported.
- No theme should change scientific data, native time/depth selection, model source or calculated scientific colorbar gradient. **UI theme ≠ scientific color palette.**

## E3. Preserve exact key user journeys and spatial layout

- Earth → India → selected genuine ocean region opening transition on fresh entry/refresh, with reduced-motion handling and camera readiness.
- Geographic Cesium 3D stage, correct selected block boundary, authentic coastlines, map imagery/offline Natural Earth fallback and genuine Argo/glider markers.
- Synchronized Water Column 3D stage with real native depths, opacity, zoom/orbit, vertical exaggeration **visual-only**, genuine current vectors and scientific legend.
- Page/feature-rail navigation, file-manager-like workspaces, Explorer scroll behavior and separate in-panel scrolling; no button hitbox or wheel-ownership regressions.
- Model vs Observation, scientific evidence, Depth & Telemetry, Source & QC, Block Details, profile/diagnostic plots, Data Lab and presentation mode.
- Selection sync across block/date/source/variable/depth/profile, including URL/deep-link explicit selections and persistence semantics.
- All existing control-dock positioning and panel width behavior. New panels must not cover the globe, top-right status, baseline source name, timeline, controls, footer, or other panels.
- Existing loading/intro screen, progress/pause/reload/reduced-motion functionality.
- Existing fullscreen/presentation interactions: follow browser user-gesture and permission constraints; **do not promise simulated F11/fullscreen without browser support**.
- Existing 16 themes, typography system, ARGO compass/team branding and source-dependent scientific labels.

## E4. Style requirements for every newly added UI component

1. Obtain current canonical style token, surface and spacing values before authoring a new component.
2. Reuse approved `glass` panel, modal, dropdown, list, card, tag, tooltip, source badge, timeline, table and control styles.
3. Apply the same corner-radius hierarchy, blur/backdrop transparency, borders, shadows, text contrast, input states, z-index stack and typography used by neighboring components.
4. Align to existing grid/panel layouts; no absolute-position overlays that cover the main geographic scene or existing interactive controls.
5. Keep native chart colours/data legends scientifically meaningful and separate from decorative theme palettes.
6. Make all scroll containers/overflow behavior intentional and compatible with pointer, trackpad, keyboard and touch.
7. Every control must work on Windows/desktop Chromium, tablet and mobile; verify hover-only actions have touch/keyboard equivalents.
8. Maintain focus styles, keyboard navigation, screen-reader names, visible labels, escape-to-dismiss, status announcements and reduced-motion options.
9. Avoid oversized icon grids, decorative clutter, emoji placeholders, tiny type, overlapping glass cards and visually inconsistent CSS modules.
10. Use real bundled/embedded images where needed, with explicit asset URLs and integrity checks; no runtime-dependent external image icon links or font glyphs that disappear on transfer.
11. Support loading, error, empty-data and blocked scientific states using the **existing** design language rather than blank panels or misleading green badges.
12. Any new feature must look intentional in **each** of the 16 themes; theme screenshots and contrast tests are release requirements, not optional polish.

## E5. Objective visual and accessibility acceptance matrix

At minimum:

- All 16 themes × three representative viewports **1440×900, 768×900, 390×844** × **two genuine renderers** (Geographic and Water Column) = **96 real screenshots**, as already defined by MPR-16; do **not** claim the matrix exists or passed until workflow artifacts are observed.
- Responsive acceptance at widths **320, 390, 768, 1024, 1366 and 1440 px** with independent navigation/control coverage.
- Verify preserved block ID, source, variable, depth, true time, scientific colourbar, selected profile and evidence lineage **before and after theme switches**.
- Foundation text contrast screen at least **4.5:1** for normal text on canvas; essential muted labels at least **3:1** on canvas as existing MPR-16 criteria; separately inspect translucent overlays, small labels, charts, focus indicators and disabled states (these screen gates alone are not a blanket WCAG certification).
- No horizontal viewport overflow beyond current minimal tolerance, no header/block-card overlap, no clipped content, no text outside panels, no occluded globe/3D scene, no invisible controls, no hover-only essential features.
- Test keyboard tab cycle, ESC/dismiss, focus retention, screen reader labels, reduced motion, forced-colors, touch and trackpad scroll.
- Real Cesium globe, actual data-filled water column and source-backed values must be present: **not mock screenshots**.
- Compare screenshots with **current certified** visual baselines, not a new self-selected snapshot that already contains a regression.
- Human visual review of every flagged diff; machine tests alone are insufficient for scientific chart or layout validity.

## E6. Mandatory “minimal correct change” regression policy

For every new block or UI feature:

- Identify affected interfaces/styles and define exact diff scope first.
- Prefer a new data adapter or small existing-component enhancement over replacing existing screens.
- Write at least one red/green regression test where an existing behavior could break.
- Review changed CSS selectors for accidental global effects, specificity conflicts, nth-child reliance, and reused class names.
- Confirm no regression in menu availability, theme persistence, page transitions, timeline state, panel scroll, docking, cross-view synchronization and presentation mode.
- Require screenshots of affected controls before and after the change across theme and viewport classes.
- Restore previous working behavior on visual regression; do not accept “science functionality improved, but UI broken” as completed work.
- Keep source-science algorithm changes separate from global UI redesign commits when practicable, with explicit compatibility contract tests.

---

# PART F — 16-PHASE MASTER IMPLEMENTATION PROGRAM (00–15)

Each phase has **entry conditions, exact work, artifacts, passing gates and rollback**. Phases may be researched concurrently where safe, but scientific data promotion and production releases are dependency-gated. Never repeat a verified completed phase simply because a new chat starts.

## PHASE 00 — Production recovery and verified checkpoint

**Inputs:** authoritative current `main`, PR #200, latest CI, deployed public Pages assets, source acquisition scripts, MPR/3DB shared ownership.  
**Tasks:**

- Recheck `main`/PR base/head SHAs, existing branches, unmerged changes, CI and published GitHub Pages SHA.
- Inspect failing `final-mvp`, provider Glider/CTD/BGC fetch, static asset builds, release-scope and actual Chromium jobs.
- Diagnose provider 4xx/5xx, URL/schema drift, network rate limits, timeout, licensing, data disappearance or workflow environment failure independently; never bypass checks.
- Correct reproducibly, with retry/backoff/checksum/licence-aware caching **only when real evidence remains authentic**.
- Check PR #200’s verified float vs baseline identity, preserved explicit selections, warning behavior and source compatibility; merge **only after genuine tests, review, authorization and public release plan are satisfied**.
- Establish reproducible a known-good science/status/deployment version. Preserve the old deployment for rollback.

**Gate:** exact candidate scientific, typecheck/build, required E2E, MPR/3DB and publicly rendered workflows pass; a new `main` SHA is deployed and independently verified over public HTTPS. **No subsequent mass expansion promoted before this gate.**

## PHASE 01 — Freeze scientific and geographic contracts

- Compare 140 canonical block entries to manifest, TS runtime, block audit and source assets.
- Preserve 35 source-backed pilots, 41 frames, six multi-date blocks, 105 planned, split 70 eligible/35 ineligible, and one separate immutable verified baseline.
- Version block-ID ownership, grid/geographic coordinates, ocean mask and eligibility; document edge/wrap cases.
- Define stable fields for lifecycle, model scientific integrity, observation inventory, matchup evidence, render readiness and actual live acceptance.
- Separate controlled block-state updates from presentation-only UI status.
- Lock existing source SHA-256 and baseline comparison artifacts; write manifest parity tests.

**Gate:** canonical runtime and scientific-manifest parity passes; zero unverified model promotions or coastal/land corruption; backward compatible API/UI state.

## PHASE 02 — Full observation and temporal feasibility atlas

- Query authentic Argo/GDAC and relevant glider, CTD, BGC, mooring and other provider catalogs for every eligible ocean/coastal block.
- Index instrument IDs, positions/tracks, observations, dates, depths, QC, variables, product/mission metadata and linkable provider records.
- Build per-block/model-date candidate pairing matrix and source availability score **based on evidence**, not artificial metrics.
- Separate `in footprint`, `nearby`, `time-compatible`, `variable-compatible`, `QC-eligible`, `matchable`, `unknown` and `unavailable`.
- Check archive dates and version availability to minimize mismatch between 2004 pilots and 2024 Argo observations.
- Produce honest counts by block, region, sensor type and time range, including empty inventories.

**Gate:** all 105 eligible blocks assessed and backed by logged queries/provenance or explicitly unresolved provider-access blockers. Do **not** claim all have matching Argo observations.

## PHASE 03 — Scientific source/version and data-rights strategy

- Select authoritative model products (start with GLORYS12V1), exact vintage/version, source provider, archival URI, native grid/depth/time and interpolation policies.
- Check Copernicus/INCOIS/provider usage, API limits, citation/attribution and redistribution/licensing for every scientific asset.
- Specify observed variables and uncertainty/QC/thermodynamic compatibility.
- Define acceptable mismatch thresholds and scientific matching policy **by observation/model variable and use case** with documented rationale and researcher review.
- Define spatial/temporal/depth coverage objectives and intentional gaps.

**Gate:** source acquisition plan can demonstrate legal, technical and scientific suitability; incompatible or unavailable sources are rejected.

## PHASE 04 — Resumable source-backed model acquisition

- Refactor/reuse proven Phase 3.5B/3DB OPeNDAP/acquisition code into a source-versioned, deterministic batch engine.
- Fetch real canonical block extents, actual model time slices and permitted variables/depth; preserve source metadata and raw files.
- Support resumable job IDs, idempotency, rate limiting, capped retries, partial staging, checksum verification, structured error reports and safe cancellation.
- Use temporary staging; promote only after complete deep structural/physical validation. Failed batches never partially increase official verified counts.
- Track original source bytes and transformed published science payload separately; no fabricated coordinate or depth repair.

**Gate:** independently acquired source payloads pass source provenance, numerical shape, missing-value, real-time and checksum rules. CI can repeat checks without provider-dependent nondeterministic claims.

## PHASE 05 — Materialize remaining 70 eligible planned blocks

- Prioritize **IO-087** and scientifically valuable observation-rich areas, followed by balanced regions and coastal/hard geometry.
- Materialize in controlled batches of approximately **5–10 blocks**, adjustable based on measurement of provider reliability, dataset size and CI duration.
- Ensure correct ocean mask/land preservation, native variables and native depth/time axis for every block.
- Promote only validated blocks; regenerate canonical capability manifest/runtime from verified inventory.
- Keep 35 ineligible blocks geographically honest and locked.

**Gate:** each new block independently source verified, corresponding TS/JSON parity passes, no old source files or baseline changed, and full scientific/visual regression gate succeeds before publication. **105/105 model-materialization is a conditional target, not a pre-declared result.**

## PHASE 06 — Enrich existing 35 pilots and genuine time coverage

- Preserve 41 immutable existing payload frames and six currently multi-date pilots.
- Select observation-supported model dates; acquire **actual additional** time frames and validate different model vintages/products carefully.
- Support regionally meaningful genuine playback, temporal gaps and source version transitions.
- Ensure full loading/performance of multiple date/variable/depth combinations, stable caching and clear daily-mean semantics.

**Gate:** no synthetic playback frames, no stale source/date legend after switching, preserved original checksums and true temporal coverage recorded.

## PHASE 07 — Multi-sensor observation ingestion

- Generalize real Argo, Glider, CTD, BGC and applicable other source adapters using provider-specific QC.
- Preserve raw/adjusted status, instrument/cast identifiers, lat/lon/date/depth and uncertainty; avoid one generic QC rule that misinterprets instruments.
- Cache real source files with licence/attribution compliance; add deterministic replay from accepted provider snapshots.
- Build block spatial/time indexes; keep observation overlay separate from proof of matched validation.

**Gate:** every observation is traceable to an actual source; no synthetic sensor values or false QC green statuses; unavailable providers yield explicit informative empty/error states.

## PHASE 08 — Harmonization and compatibility layer

- Implement validated units (temperature, salinity, velocity, oxygen etc.), coordinate conventions, pressure/depth, time bounds and CF metadata.
- Provide documented TEOS-10/GSW use where scientifically appropriate, with unit tests against known reference cases.
- Validate wet cell selection, coastline masking, native vertical order, interpolation bounds and source time grids.
- Track transformations as derived outputs distinct from provider originals.

**Gate:** independent standard/reference unit tests pass, all transformations reversible/reproducible where appropriate, no silent dimensional changes or unsupported extrapolation.

## PHASE 09 — Universal model–observation matchup engine

- Generalize original Argo temperature engine for arbitrary authentic source block/frame and compatible observed profiles.
- Perform deterministic spatial, temporal, depth and variable matching with explicit rejection reasons.
- Respect native model time support, daily-mean timing, wet-cell masks, assimilation risk and scientific comparability.
- Support original reference exactly as a regression gold case without copying its output to new blocks.
- Accept no missing-provider fallback masquerading as a successful pair.

**Gate:** baseline regression reproduces documented values within justified numerical tolerances; synthetic-source adversarial tests fail; eligible new matches produce complete independent evidence records.

## PHASE 10 — Statistical diagnostics, uncertainty and exports

- Compute bias/MAE/RMSE and other source-specific diagnostics; expose sample count, coverage, rejected depth levels, distance and time offsets.
- Plot observed/model profiles and bias by depth, genuine current/salinity comparisons and optional uncertainty bounds.
- Avoid treating correlated depths as independent validation, and classify assimilation dependence.
- Build deterministic machine-readable summaries, export CSV/NetCDF where licenced, PNG plots and complete provenance packages.

**Gate:** cross-checked metric computations, reliable sign conventions, exact units, reproducible exports, scientifically appropriate qualifiers.

## PHASE 11 — Universal block integration in current globe and water column

- Use existing Cesium/Water Column components and science data adapter; do not fork 105 independent viewers.
- Synchronize selected block/source/time/variable/depth with genuine globe field, 3D depth plane, profile/diagnostic and scientific source panels.
- Support actual current vectors, camera perspective, LOD, wet masks and source-aware legend.
- Keep user explicit selection and deep links authoritative; load fresh verified defaults only when no higher-priority selection exists.
- Represent observation overlays and model-match links without relabeling observation as model block.
- Guarantee stale async science payload cannot overwrite a newer selected block/time/depth.

**Gate:** source identity and rendering correctness across representative coastal/deep/sparse/observation-rich blocks in production-like browser tests; no 16-theme or panel regressions.

## PHASE 12 — Glass UI/UX, accessibility and scientist-oriented workflows

- Add evidence availability UI, source/instrument search, block-to-block navigation, matchup charts, QC/source drawers, downloaded evidence and honest no-data messages **inside existing component design**.
- Preserve glassmorphism and **all 16 canonical themes**; use existing tokens, typography, borders, translucent surfaces, motion and responsive breakpoints.
- Integrate with existing geographic stage, stacked water column, Data Lab, Model vs Observation, Block Details, presentation flow and main navigation.
- Keep all existing controls fully usable across desktop/mobile/keyboard/touch, preserving nested panel scrolling and responsive dock placement.
- Do not add unnecessary illustrations/stickers or create overlapping new panels. Align new information density to current approved design, avoid tiny footnotes.
- Screenshot and interaction regression certification per Part E.

**Gate:** no UI/CSS regressions (including all themes), actual source/variable/time unchanged under visual theme changes, accessible controls and no layout overlap.

## PHASE 13 — Scalable storage, delivery and rendering performance

- Profile actual input sizes, network traffic, GPU load, memory and browser frame times before architecture changes.
- Add chunked/tiling scientific delivery, source-aware prefetch/cache, invalidation and progressive real data rendering where justified.
- Separate render LOD from downloadable source full data; sampled display must never alter scientific metrics.
- Preserve GitHub Pages static judge demo, reliable offline assets and separate approved FastAPI service path; do not introduce arbitrary network dependencies into public static fallback.
- Verify web/mobile constraints and data-cache error recovery; ensure correct fallback when unavailable rather than using stale model data.

**Gate:** measured performance budgets, representative device tests and no loss of native scientific evidence or UI responsiveness.

## PHASE 14 — Independent scientific/security/regression audit

- Verify every canonical block ID, valid geographic classification, actual materialization and all published source checksums.
- Test source versions, spatial/vertical/time axis, interpolation, QC and statistics with reference known cases, negative cases and invalid inputs.
- Test provider failures, offline mode, source 404/timeouts, invalid hashes, stale caches, missing profiles, land cells, unusable time/depth and long-running acquisition interruption.
- Test security/privacy: no credentials inside frontend or committed files, no unauthorized scraping/bypass, safe provider URLs, licence compliance and import validation.
- Assert 16-theme × viewport × renderer real-screenshot matrix and all existing MPR/3DB tests; review visually.
- Audit user-facing science language: distinguish source-backed, rendered, observationally matched, scientifically independently validated and deployed.

**Gate:** no critical scientific/visual/security issue; full audit reports linked to exact commit and data manifest.

## PHASE 15 — Release, production certification and evidence handoff

- Reconcile feature branch with current main, conflicts, owner boundaries, data snapshots and tests; require explicit approval for irreversible/high-impact changes.
- Require green exact-HEAD scientific/React/FastAPI/source-integrity/visual acceptance checks.
- Merge with SHA evidence and publish with GitHub Pages exact SHA, verify public HTTPS asset hashes and browser functioning.
- Open real public URL in Chromium; confirm native model/time/depth/source, genuine Argo/other marker, Model vs Observation, plots, QC, status warnings, responsive layout and theme persistence.
- Record production URLs/screenshots, CI job links, pass/fail matrix, rollback version, source manifests, limitations and reproducibility instructions.
- Certify each block independently; mark unavailable observation matchups honestly.

**Gate:** production science and UI are actually live and verified for the exact release, not merely theoretically ready or locally tested. A program-wide completion claim requires full gated scope coverage.

---

# PART G — FIRST THREE EXECUTABLE RELEASE WAVES

## G1. Wave 0 — unblock current platform

1. Check PR #200 current head/main SHA, exact CI and production status.
2. Reproduce provider Glider/CTD/BGC acquisition problems using authorized real sources.
3. Fix network/schema/timeout/retry/licence problems **without** synthetic fallbacks.
4. Restore MPR/3DB browser science-release gates and visual baseline.
5. Verify default `BASE-GLORYS-001` + Argo `5907092` separately; do not conflate float and block.
6. Merge/publish only with true gates green, then take public Chromium screenshots.

**Deliverable:** stable, publicly certified origin application preserving existing design and scientific trust.

## G2. Wave 1 — IO-087 complete science reference

1. Freeze IO-087 bounds and original Argo evidence.
2. Verify and obtain source-backed **2024** GLORYS model frame for IO-087 compatible with observation time and matched model semantics.
3. Preserve archive/raw model provenance and full SHA-256/source validation.
4. Confirm legitimate geographic wet cells and appropriate source-native vertical/time support.
5. Apply QC-screened Argo observations and actual model–observation colocation.
6. Calculate fresh IO-087 temperature profile diagnostics; do **not** copy original metrics.
7. Build exact-source geographic and water-column rendering, selected profile/model-cell link and source badge.
8. Generate downloadable matchup/source evidence and show uncertainty limitations.
9. Run numerical + 16-theme responsive visual regressions and certify public HTTPS render.

**Deliverable:** first geographic `IO-###` block with reproducibly obtained, temporally appropriate model and observation-linked diagnostic evidence. If genuine data cannot be acquired, do not claim completion; deliver feasibility result and provider blocker instead.

## G3. Wave 2 — atlas and first controlled expansion batches

1. Complete 105-block observation availability atlas.
2. Rank acquisition candidates by genuine available models/observations, geographic diversity, scientific impact and provider cost/reliability.
3. Acquire first **5–10** source-backed blocks in one controlled batch.
4. Run full source/data/3D/UX check, compare against baseline screenshots, release.
5. Repeat with versioned manifest regeneration and artifact-level certification.
6. Begin multi-time enrichment only using source-backed dates and acceptable temporal scientific support.

**Deliverable:** independently verified incremental growth of model blocks with no CSS/UI regressions or inflated observation-validation counts.

---

# PART H — SCIENTIFIC, VISUAL AND RELEASE ACCEPTANCE GATES

## H1. Per-block gate model

| Gate | Required artifact | Objective acceptance |
|---|---|---|
| G1 Geographic | ID, versioned bounds, mask, coordinates | Correct ownership and wet-cell mapping |
| G2 Source | Original provider source, licence, product/version, SHA-256 | Genuine downloadable valid data |
| G3 Native science | Variables, grid dimensions, depth and time axes, missing masks | Valid science, no synthetic values |
| G4 Materialization | Approved immutable block frames + manifest record | Promotion only after full validation |
| G5 Renderer contract | Genuine globe and water-column science mapping | Correct native source samples and state |
| G6 Observation inventory | Source/cycle/cast/time/position/QC index or documented absence | No copied or fabricated profiles |
| G7 Matchup | Valid spatiotemporal/vertical/variable matching and rejects | Only scientifically supportable comparisons |
| G8 Diagnostics | Provenanced error metrics, plots and limitations | Reproducible and correctly interpreted |
| G9 UX/CSS | Existing controls + all sixteen themes + responsive E2E | No overlap, source reset, lost feature or contrast regression |
| G10 Production | Exact deployed build, data asset checksum, public Chromium evidence | Actually published, responsive and inspectable |

G1–G5 = model science readiness; G6 = observation assessment; G7–G8 = justified matchup if available; G9–G10 = integrated public release. A block can pass model science gates while G7/G8 are `UNAVAILABLE` because observations do not exist; that is scientifically honest, not implementation failure.

## H2. Automated tests: minimum requirements

**Python / science**

- 140-ID, 35-source-backed/105-planned starting manifest parity and deterministic updates; 70/35 eligibility classification.
- All published payload raw and transformed source checksums, original source variable arrays, positive-down depth and true time dimensions.
- Exact synthetic-science rejection, ocean/wet mask and NaN preservation.
- Invalid/duplicate blocks, coastal boundaries, longitude wrap, geographic ownership and out-of-domain inputs.
- QC 1 / valid-mode requirements for original Argo; per-provider rules for other sources; reject invalid or missing uncertainty.
- Reference Float 5907092 Cycle 13 reproduction with documented tolerances; Cycle 12/13 actual profile IDs and 99 combined matched levels.
- Geographic model sample and time/vertical matching, no extrapolation; noninterchangeability of 2004 and 2024 without new 2024 data.
- Bias sign, MAE, RMSE, data count, time-offset support, unit compatibility and missing-value handling.
- Observation in a planned footprint **cannot** promote its model validation; explicit IO-087 safety regression.

**TypeScript / React / Cesium**

- Canonical `main-block` and scientific-source manifest consistency.
- User-selected block/source/time/profile/depth must persist and reflect actual loaded frames; fast switching cannot race stale fetches.
- Genuine native depths and variables, correct colorbar and source provenance labels.
- Block-ID deep link, existing route and fallback; model vs float distinct, pilot blocks not inheriting baseline-only matches.
- Source response errors and degraded indicator remain truthful and recover only after actual source success.
- Rendering LOD uses source samples, never new synthetic measurements.

**E2E / UI**

- Earth → India → verified region intro on fresh load/refresh; reduced motion.
- Geographic, Water Column, Model vs Observation, Data Lab, Source & QC, Block Details, presentation, navigation and exports.
- 16 persisted glass themes; screenshot acceptance 96 real images at three sizes and two renderers.
- 320/390/768/1024/1366/1440 px interactions, keyboard/touch/scroll accessibility, no overlap or clipping.
- Local API/static build equivalence where semantically required; production origin public Chromium acceptance.

**Security / integrity**

- No sensitive auth keys committed or leaked to client, valid external source licences, safe external URL use, JSON/schema and imported-file validation.
- Fail closed on invalid source SHA, corrupted scientific frame, incorrectly labeled 3D field and incorrect model/source/time relationships.
- Explicit errors, audit events and recoverable legitimate retries; no hidden bypasses.

## H3. Numeric acceptance targets and constraints

- **100%** of 140 logical IDs classified with a documented truthful status.
- **100%** of actually published source-backed block/date frames pass source/hash/schema validation.
- **100%** of purported observation comparisons include provider/source/cycle/QC/method/accepted level count and reproducible metrics.
- **0** synthetic/relocated ocean measurements, observations, timestamps, model depths or manufactured QC success claims.
- **0** promoted land/ineligible cells under unchanged grid policy.
- **0** unacknowledged source/time/depth label mismatches.
- **16/16** themes preserved and functional; no scientific colourbar shifts due to UI theme changes.
- **96** target glass-themed real globe/water screenshot artifacts per applicable MPR-16 certification cycle, subject to reviewed build/test execution.
- **100%** of validated and released blocks exercised at least via deterministic real-source renderer acceptance; human screenshot sampling and risk-based individual GPU checks where warranted.
- **70** eligible planned blocks targeted for real acquisition, *not* certified in advance. Do not claim 105/105 source-backed until materialization really exists.
- **No guarantee** of valid Argo matches for all 105 eligible blocks; classify genuinely unavailable observations as such.

---

# PART I — ENGINEERING WORKFLOW, FAILURE RECOVERY AND CHANGE MANAGEMENT

## I1. Standard execution loop

For each branch/batch/phase:

1. **BOOTSTRAP:** Verify current main SHA, active PRs, recent CI, source manifest, public deployment. Reuse last verified checkpoint.
2. **INVENTORY:** Extract affected files, current behavior, source evidence, UI ownership and explicit change acceptance criteria.
3. **DESIGN:** Propose minimal safe algorithm/data/UI adapters; state evidence availability, assumptions, unknowns and failure behavior.
4. **TEST FIRST:** Add targeted scientific/UI regression tests that would fail under the original issue or false data.
5. **ACQUIRE / IMPLEMENT:** Make reversible additive changes, stage source data, preserve authoritative original evidence and existing design tokens.
6. **VERIFY:** Unit/scientific/typecheck/build/browser/GPU/source integrity and visual 16-theme matrix as applicable.
7. **AUDIT:** Check original science, source validity, CSS/view regressions, error semantics, privacy/security/licences and real asset state.
8. **RELEASE GATE:** Review PR, check complete exact-head CI, obtain appropriate approval, merge, deploy, verify exact-main production URL in Chromium.
9. **RECORD:** Source/checksum details, matching/missing data, actual pass/fail, commit/PR/CI URLs, screenshots, remaining blockers and rollback route.
10. **CONTINUE:** Select first incomplete phase from the recorded verified ledger. Never manufacture a completion statement.

## I2. Project boundary protection

- **3DB/science owner:** source discovery, materialization, provenance, genuine timestamps/depths, numerical pipelines, 3D source fidelity, block scientific capability truth.
- **RUI/MPR owner:** navigation, all-theme glass UI, responsive behavior, CSS semantics, accessibility, presentation/explorer layout, control panel UX.
- **Shared interfaces:** source+selection state, new scientific panels, validation status banners, model-observation links, block selectors, source controls. Use typed contracts and coordinated tests.
- Enforce file-scope change guards for scientific data and RUI layout where suitable. Do not bypass existing scope policies; adjust a policy only with an approved justified change, negative tests and clear owner signoff.

## I3. Provider/data acquisition failure policy

- Retry only transient provider/network failures with bounded exponential backoff, jitter if supported and explicit budgets; 4xx schema or authorization errors should be investigated, not blindly retried.
- Preserve original source identifiers, certificates and data bytes; classify schema drift, data deletion, rate limit, outage, licence denial or broken request separately.
- Permit cached genuine provider artifacts only with provenance, hash, licence and validated time/version. A cache is not synthetic data.
- Abort atomic promotion on missing/invalid source; do not partially rewrite counts or scientific capabilities.
- Expose `BLOCKED/UNAVAILABLE` with actionable explanation, not healthy status.
- Roll back to last verified manifest and deployed artifact on source/render/UI regression.

## I4. Browser and CSS failure policy

- Detect regression through before/after screenshots and interaction traces at all required sizes and themes.
- If a new chart/card overlaps controls or shifts/glitches on one theme, repair **local component layout** before expanding scope.
- Do not weaken screenshot assertions or update baseline images simply to disguise new defects.
- Ensure no global CSS overrides, fragile `position:absolute` hacks or hard-coded viewport-dependent transforms on current 3D scene.
- Preserve original, functioning panel layout if a proposed redesign cannot meet tests; feature can remain behind an explicit disabled/unavailable status while fixed.
- Check real browser console, GPU scene readiness, data identity, mouse/scroll, responsive menus, mobile sheet and reduced-motion behavior.

## I5. Approvals and release safety

Safe autonomous work includes research, code/data analysis, draft implementation, tests, non-destructive artifacts and feature branches. Require human approval for destructive irreversible changes, major shared architecture migrations, paid third-party provider commitments, exposing restricted datasets, credential changes, global production data replacement or risky release exceptions. Avoid delaying ordinary reversible engineering with unnecessary approval requests, but **never** forge deployment or bypass actual blocked scientific gates.

## I6. Decision and unknowns log (must be updated)

| Item | Current working decision or open question |
|---|---|
| How many eligible model cells? | 105 currently, inclusive of 35 source-backed + 70 planned; source acquisition may expose blockers |
| How many total logical cells? | 140; 35 geographically ineligible under existing policy |
| Must every block have an Argo float? | **No.** Real observations may be absent; method reusable, measurement locations cannot be fabricated |
| Is Argo 5907092 the base for all statistics? | **No.** It is the QA/science method reference only; new data get their own results |
| Is IO-087 already model-materialized? | No at checked snapshot; source acquisition required |
| Can 2004 pilot fields validate 2024 observations? | Not as if simultaneous; acquire appropriate 2024 model fields |
| Do 50 matched observation levels mean 50 model layers? | No; baseline has 31 model depths |
| Is independent model validation established? | Not generally; GLORYS assimilation risk requires explicit scientific independence analysis |
| Will every eligible block have multi-time data? | Not guaranteed; acquire real available times and disclose gaps |
| Are 35 land/ineligible cells converted? | No, not unless new versioned geographic grid expressly approved |
| Can our current glass UI be replaced? | No; all scientific features integrate into existing sixteen-theme design system |
| Can scientific palettes vary with UI themes? | No; source science gradients stay independent |
| Is PR #200 published? | Not at checked snapshot; verify live before claiming |
| Are provider fetch failures solved? | Not at checked snapshot; provider/source remediation is P0 |
| Are there privacy/licence constraints? | To check for every new source and provider/version |
| Does static GitHub Pages remain? | Yes for the reliable public demo; API enhancements must not break it |
| What scientifically meaningful matching tolerances? | Must be derived from variable/region/product/resolution and documented before numerical processing |
| What is actual total storage/compute cost? | Unknown until source size, temporal scope and workload profiling |
| What if observations have been assimilated? | Label diagnostics and assimilation dependence; do not assert independent skill |

---

# PART J — OBJECTIVE PRIORITIES, EFFORT AND DELIVERY ORDER

## J1. Work order

1. **P0:** Production release and scientific-provider acquisition remediation, PR #200 status and proper startup default.
2. **P1:** Full IO-087 experiment: source-backed 2024 model frame, original actual Argo, fresh matchup and integrated public UI.
3. **P2:** Complete 105-block observation/time availability atlas and source/metadata strategy.
4. **P3:** Batch materialization of 70 eligible cells; multi-time source enrichment of 35 existing pilots.
5. **P4:** Universal comparison/uncertainty/evidence engine and integrated UI/3D experience.
6. **P5:** Scalability and 16-theme visual certification across every relevant release.
7. **P6:** Exact-commit main/Pages publication, production QA, reproducible docs and final scientific evidence certificates.

## J2. Preliminary effort ranges (not commitments)

| Area | Planning estimate / dependency |
|---|---|
| Current provider/CI/release blockers | Several days to 2+ weeks depending on external source failures |
| IO-087 full model-and-observation scientific reference | Roughly 1–3 weeks **after** genuine suitable source access |
| 105-block observation availability atlas | Roughly 1–3 weeks, subject to provider discovery limits |
| Generalized source and matchup pipeline | Roughly 4–8 weeks |
| 70 eligible planned block materializations | Roughly 4–10 weeks in controlled batches, subject to data size/access |
| Multi-time coverage, scale and complete UI scientific integration | Roughly 4–8 weeks, partially parallel |
| Full regression, documented release and public acceptance | Roughly 2–4 weeks |

**Overall planning envelope:** approximately **3–6 months** for a coordinated small team with relevant Python scientific-data and React/Cesium expertise; this is a rough engineering scenario, **not** guaranteed Argo/CTD matchup coverage or production completion. Costs, source restrictions and team capacity can materially change it.

## J3. Quantities and economics to measure early

Before choosing cloud architecture or committing spending, calculate: native region × depth × lat × lon × variables × time frames × output encoding; raw/processed/evidence storage; total published static assets; web transfer cost; peak browser memory/VRAM; query latency; build time; provider access rate; expected concurrent demo users. Do not invent a storage budget or promise smooth rendering at a certain FPS without measurements.

---

# PART K — SINGLE MASTER EXECUTION PROMPT FOR THE NEXT CHAT

> **Role:** You are the Ocean Canvas SIH26067 lead scientific software architect, geospatial and ocean-data researcher, scientific integrity auditor, React/Cesium application engineer, glassmorphism UI/UX preservation specialist, and exact-commit release/Chromium QA lead.
>
> **Objective:** Expand the existing canonical 140-geographic-cell platform toward fully source-backed models in all 105 geographically eligible ocean/coastal cells, with genuine multi-source observations, scientifically valid variable/time/depth matchups where available, full evidence packages, responsive dual 3D views, and production verification. Use original GLORYS12V1–Argo Float 5907092 Cycle 13 as the **methodological reference**, not a data template to copy into other cells.
>
> **Mandatory starting point:** Inspect live repository main, PR #200, CI, exact published Pages SHA, scientific manifest, current block capability audit, provider-source health, theme/UX specs and last verified checkpoint. The handoff inventory is a dated snapshot. Reconcile any new changes against canonical source evidence; do not repeat verified completed work.
>
> **Science truth:** Every model block requires real gridded source-backed variables/coordinates/native times/depths/masks, QC and checksums. Every in-situ observation requires actual platform/time/position/measurements/QC. Only scientifically collocated compatible pairs receive matchup diagnostics. Distinguish 31 original GLORYS subset model depths, 50 Argo Cycle 13 matched observation samples, original 2024 baseline, historical 2004 pilots, and the currently planned IO-087 geographic block containing the original float positions. Do not fabricate data, validation claims or temporal playback, and account for data assimilation dependence.
>
> **Scope and design lock:** Preserve the current exact React/Cesium app shell, global RUI/MPR navigation, geographical and water-column controls, Theme Gallery, **all 16 named glassmorphism themes**, current design tokens, CSS/layout, focus and reduced-motion, mobile/desktop responsive behavior, source-specific scientific palettes, Earth→India→ocean camera transition, current loader, profile inspectors, evidence panels, Data Lab, Block Details and presentation mode. Every added UI element must use existing glass tokens, transparency, borders, blur, radius, spacing, typography, panel/dock interaction and responsive breakpoints. There is **zero tolerance for CSS/UX regression**. Never rewrite the whole UI for scientific additions.
>
> **Plan:** Follow Phases 00–15 and first waves in this document. Start by fixing release/data-provider blockers; then materialize and certify IO-087 using genuinely time-appropriate source data; build authentic 105-block observation feasibility atlas; expand 70 planned eligible cells in verifiable batches; generalize matchups, provenance and scientific downloads; optimize performance; certify actual globe and water-column scientific behavior and entire theme UI matrix.
>
> **Validation:** Verify source hashes, raw source versions and public scientific integrity; reproducible model and sensor QC, depths/time/units, no fabricated values, correct model-observation interpretation; TypeScript, backend, pytest, source-contract parity, Playwright and 16-theme screenshot acceptance at 1440×900/768×900/390×844 plus responsive checks at six sizes; desktop/mobile/keyboard/pointer/touch/scroll; ensure the final public HTTPS Chromium run is tied to the exact merged deployed SHA. Fail closed on source/provider/UI regression.
>
> **Execution:** Implement safe reversible changes independently on isolated branches. Respect RUI versus 3DB ownership and minimize shared-file diffs. Preserve all existing source bytes and current functioning design. Before promotion, gather original source evidence, objective assertions and rollback. Require relevant human approval for high-impact shared, destructive or privacy/licence-sensitive actions. Do not merge on failing required checks; do not hide degraded mode or assert completion before actual live verification.
>
> **Outputs at every checkpoint:** Current repository/PR/main SHA and status; work already completed; actual source evidence and limitations; files changed; test results with links; affected UI snapshots and all-theme review; data counts and certificate; blockers and recovery step; exact next incomplete action. The final system must distinguish **PLANNED**, **BUILT**, **SOURCE VERIFIED**, **RENDER TESTED**, **MERGED**, **DEPLOYED**, **PUBLICLY VERIFIED**, and **SCIENTIFICALLY MATCHED** statuses.
>
> **Independent scientific review request:** First identify missing physics, QC, uncertainty, source-selection, accessibility, scale or risk considerations that would genuinely improve this plan, with sources and priority. Separate mandatory scientific corrections from optional enhancements. Do not substitute an unrelated architecture, invented capability, fabricated data or another UI design for the existing Ocean Canvas platform.

---

# PART L — FINAL DELIVERABLES AND EXIT CERTIFICATION

## L1. Expected deliverables

1. **Source and scientific design documentation** — catalog of approved models, instruments, QC rules, native grids, temporal windows, transformations, licensing, uncertainties and explicit missing evidence.
2. **Canonical geographic capability inventory** — complete 140-cell map with separate source/model/observation/matchup/live-render readiness, and audited eligible/ineligible classification.
3. **Observation availability atlas** — authentic sensor/time/depth/variable inventory for every eligible block, source-cited and differentiating direct/nearby/matchable/missing.
4. **Reproducible data acquisition pipeline** — cached/licensed provider access, deterministic configuration, source validation, secure retries, raw-data preservation and atomic scientific promotions.
5. **Versioned source-backed data assets and manifest** — validated raw/transformed checksums, model payloads, actual timestamps, depths, variables and provenance.
6. **Universal variable-aware matchup and statistics engine** — including original 5907092 reference regression, documented missing-data and assimilation limitations.
7. **IO-087 end-to-end scientific case study** — genuine appropriate model frames, authentic Argo profiles, independently recomputed diagnostic metrics, charts, QC, provenance and published 3D interface.
8. **Eligible-block scale-out** — new verified payloads, block inventories and per-batch science verification without false claims for unmaterialized/ineligible cells.
9. **Ocean Canvas frontend integration** — working dual Cesium/Water Column views with consistent block/date/depth/source/profile selection, honest errors and original glassmorphism UI design.
10. **All-theme CSS/UX regression evidence** — all 16 theme screenshots, six responsive widths, meaningful contrast/accessibility, correct scroll, controls and scientific legends.
11. **Operational reliability and performance reports** — measured transfer, cache, memory, GPU and CI build workloads, fallback and rollback behavior.
12. **Security/licence/source-integrity reports** — no credential leaks, proper provider attribution and content integrity.
13. **Release/CI and public Chromium certificate** — exact main SHA, workflow IDs, successful Pages deployment, immutable published source hashes, actual public science views and screenshots.
14. **Structured decisions and unresolved-risk log** — known limitations, conditional future capability and realistic subsequent tasks.
15. **Final source-supported demonstrations** — reproducible judge/user workflow, no hidden fabricated source, no false fully validated / operational forecast claims.

## L2. Release classification

**PLANNED:** requirement/architecture specified.  
**IMPLEMENTED:** code exists and has identifiable commit.  
**SOURCE VERIFIED:** source-backed source/QC/integrity tests passed.  
**TESTED:** tests run and artifacts recorded at an exact commit.  
**VISUALLY ACCEPTED:** real UI/renderer/theme captures human-reviewed.  
**MERGED:** reviewed PR integrated into `main`.  
**DEPLOYED:** production Pages/services explicitly published for exact commit.  
**PUBLICLY VERIFIED:** independent live HTTPS Chromium evidence confirms expected user-facing scientific behavior.  
**MATCHUP VERIFIED:** model/observation diagnostic is scientifically reproducible and carefully qualified.  
**INDEPENDENTLY VALIDATED:** only if genuinely independent observations and method support this stronger label.  
**BLOCKED / UNAVAILABLE:** transparently reported; **never** silently relabeled as successful.

## L3. One-sentence acceptance standard

**Every geographic cell remains honest; every materialized model block is supported by its own actual source data; every observation is traceable; every scientifically supportable comparison is reproducible; every unavailable capability is disclosed; and every addition preserves the current Ocean Canvas glass UI across all sixteen themes and passes exact-release public verification.**

---

# PART M — AUTHORITATIVE STARTING RESOURCES

### Current code/documentation

- GitHub repository: https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL
- Public MVP: https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore
- PR #200 (draft default Argo): https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/pull/200
- `frontend/public/main-blocks/manifest.json`
- `frontend/public/main-blocks/capability-audit.json`
- `frontend/src/main-block-runtime.ts`
- `frontend/src/main-block-capabilities.ts`
- `frontend/src/main-block-observations.ts`
- `frontend/src/pilot-main-block-loader.ts`
- `frontend/src/components/OceanGlobe.tsx`
- `frontend/src/App.tsx`
- `frontend/src/theme.ts`
- `docs/3DB_MASTER_PROMPT.md`
- `docs/3DB_09_OBSERVATION_BLOCK_INTEGRATION.md`
- `docs/3DB_11_INDIAN_OCEAN_SCALE_OUT.md`
- `docs/3DB_12_BLOCK_PERFORMANCE_AND_LOD.md`
- `docs/3DB_14_FULL_BLOCK_CAPABILITY_AUDIT.md`
- `docs/3DB_15_FINAL_3D_BLOCK_ACCEPTANCE.md`
- `docs/RUI_MPR_16_THEME_VISUAL_ACCEPTANCE.md`
- `docs/RUI_MPR_17_INTEGRATION_RELEASE_CERTIFICATION.md`
- `docs/SCIENTIFIC_METHOD.md`
- `scripts/fetch_verified_observation_breadth.py`
- `scripts/audit_3db14_capabilities.py`
- `data/comparison/temperature_comparison_engine.py`
- `data/comparison/profile_5907092_cycle013_D_summary.json`
- `data/comparison/profile_5907092_cycle012_A_summary.json`

### External scientific source documentation to verify when researching

- Copernicus Marine GLORYS product: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description
- Copernicus Marine Toolbox: https://help.marine.copernicus.eu/en/articles/8283072-copernicus-marine-toolbox-api-subset
- Argo scientific data guidance: https://argo.ucsd.edu/data/how-to-use-argo-files/
- Argo acknowledgement/attribution: https://argo.ucsd.edu/data/acknowledging-argo/
- Climate and Forecast metadata conventions: https://cfconventions.org/
- TEOS-10 / GSW documentation: https://www.teos-10.org/
- INCOIS official data holdings and rights: https://incois.gov.in/ (verify the actual provider-specific service, licensing and URLs)

**Recheck all external URLs and provider terms before live acquisition. No URL in this document is proof of current provider availability or licensing permission.**

---

**END OF COMPLETE USB-140 MASTER HANDOFF — No science acquisition, PR merge, UI deployment, or production certification is implied by the creation of this planning document.**
