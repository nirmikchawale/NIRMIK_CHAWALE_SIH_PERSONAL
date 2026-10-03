# Ocean Canvas — Optimus Master Plan: Main Blocks, Time Engine, Integration, Glassmorphism

## Objective
Scale Ocean Canvas from one cached GLORYS main block plus the Phase 3 sub-sector atlas into a reusable Indian Ocean digital-twin workspace built around genuine new geographic main blocks, time-aware data loading, synchronized Cesium + Water Column 3D exploration, and a complete glassmorphism interface.

This plan deliberately separates data acquisition from UI integration so that every deployment is reversible, scientifically honest, and testable.

## Scientific definition of a main block
A **new main block** is a new geographic extract from the parent ocean product, approximately comparable in footprint and depth role to the existing 67–70°E × 12–14°N cached GLORYS block. It is **not** a subdivision of that existing file.

The Phase 3 `AS-01`…`AS-12` atlas remains a set of sub-volumes of the current main block and must never be relabelled as independent model blocks.

## Time definition
- Historical GLORYS daily data: use native daily-mean dates only.
- Operational/forecast products: use only native provider timestamps available for selected 3D variables.
- Arbitrary in-between clock times may be offered only through explicitly labelled temporal interpolation.
- Never manufacture timestamps or imply that interpolation is a provider-native frame.

## Geographic design target
Logical target envelope: approximately 60–100°E and 5–25°N, tiled with main-block-sized cells. This is roughly 140 logical tile positions before land/ocean relevance filtering. The architecture must support all logical blocks but only materialize/use scientifically useful ocean cells.

## Deployment plan

| Phase | Deployment purpose | New main-block work | Date/time work | Cesium / Water Column integration | Glassmorphism / UI work | Acceptance gate |
|---|---|---|---|---|---|---|
| **3.5-HF** | Immediate UI correction | None | None | None | Center Appearance Lab with a viewport-level portal, backdrop, safe-area bounds, and mobile/desktop centering | Gallery is fully visible, horizontally centered, non-clipped at 390×844 through desktop sizes |
| **3.5A — Block Engine** | Build reusable scientific block architecture | Define block manifest schema, IDs, geographic bounds, ocean/land relevance, source provenance, cache paths | Add date/time availability fields to manifest | No major renderer redesign yet; loaders expose one selected block | No major visual redesign; status/loading/error glass states only | One reusable loader can open current block through new manifest without changing science |
| **3.5B — Pilot Acquisition** | Prove genuine new main blocks | Acquire ~20–25 geographically distributed GLORYS blocks across Arabian Sea, west coast, south India, Bay of Bengal, Andaman region | Include multiple genuine historical dates for a controlled subset | Preview selected block through existing renderer adapters | Add compact block/date availability inspector | Every pilot block validates coordinates, depth, variables, provenance and finite values |
| **3.5C — Time Engine** | Make block model time-ready | Reuse pilot block inventory | Historical date selector; native operational time selector; optional clearly labelled interpolation layer | Selected block/date/time becomes a single shared context object | Glass date/time controls, native/interpolated badges, unavailable-state alerts | Changing date/time updates data without changing region identity or scientific meaning |
| **4A — Geographic Block Explorer** | Turn blocks into one geographic system | Expand logical manifest toward full ~140 positions; materialize ocean-relevant blocks progressively | Time context follows block selection | Cesium displays block footprints; click/hover/select; camera focus; active block outline | Glass map controls, block browser, search/filter, availability chips | Cesium block click selects exactly one block and never preloads all blocks |
| **4B — Water Column Synchronization** | Make geographic selection drive 3D | Selected new main block loads as equivalent full Water Column volume | Same selected date/time propagates into 3D | Full Region / selected block mode; temperature/salinity/currents/depth controls synchronized | Glass mode switcher and block breadcrumb | Same block/date/time is visible in Cesium and Water Column with matching provenance |
| **4C — Full Indian Ocean Scale-Out** | Reach practical full coverage | Scale from pilot inventory to ~60–90 useful ocean blocks first, while preserving capacity for ~140 logical blocks | Populate configured date windows; avoid indiscriminate full-history download | Lazy-load one active block with small LRU cache; no simultaneous 140-volume rendering | Progress/loading states for remote/local chunks | Memory/network remain bounded; block switching remains responsive |
| **5 — Context-Aware Workspaces** | Propagate selected context across product | No duplicate block engine | Region/date/time become shared application context | Telemetry, Compare, Anomaly, Data Lab, Science/System consume selected block context | Full glass treatment for secondary pages | Every page clearly shows active region/date/time and source availability |
| **6 — Interaction Completion** | Finish every user control and state | Block actions, downloads, block navigation | Date/time jump, playback controls, interpolation disclosure, missing-frame handling | Keyboard/touch navigation between blocks and time frames | Every button/input/dropdown/modal/tooltip/status follows glass tokens and accessibility states | Full interaction inventory passes desktop/mobile acceptance |
| **7 — Responsive & Performance** | Harden mobile/tablet and large-scale data behavior | Cache policy, chunk compression, prefetch adjacent blocks only | Timeline virtualization; throttled playback | Mobile block picker, bottom sheets, touch-safe Cesium/3D controls | Adaptive blur, reduced GPU cost, safe areas, no clipping/scroll leaks | 390×844, 430×932, tablet and desktop remain usable with bounded memory |
| **8 — Release Candidate** | Final scientific/UI hardening and production release | Final block manifest audit and provenance completeness | Native-vs-interpolated time audit; deterministic timestamp labels | Full judge-flow regression for Cesium ↔ Water Column ↔ workspaces | Accessibility, contrast, reduced motion, glass fallback, final polish | CI, browser suite, scientific regression, public HTTPS verification all green |

## Shared application context
The final architecture should expose one authoritative selection state:

```text
region/block → date → native time/interpolated time → variable → depth
```

All views consume the same state rather than implementing independent selectors.

## Block manifest contract
Each block entry should eventually include at minimum:

- stable block ID
- human-readable region name
- west/east/south/north bounds
- ocean/land relevance flag
- depth coverage
- variables available
- historical dates available
- operational timestamps available
- source product and version
- provenance/checksum
- local/static asset location or remote acquisition reference
- observation availability summary
- validation status

## Performance strategy
- Never preload all ~140 logical blocks.
- Load one active block at a time.
- Maintain only a small LRU cache, for example current + a few recently/adjacent blocks.
- Split payloads by block/date/time/variable where useful.
- Prefer compact browser-ready scientific payloads produced from validated source files.
- Preserve source NetCDF/provenance separately from display-optimized exports.

## Time strategy
### Historical mode
Use daily GLORYS fields for genuine historical date selection.

### Operational mode
Use a provider product that genuinely exposes sub-daily 3D timestamps for the required variables. Surface only timestamps confirmed by the source.

### Interpolated mode
If enabled, interpolate only between two valid bracketing native frames. UI must display `INTERPOLATED`, the two source timestamps, interpolation fraction, and must never label the result as a native provider frame.

## Glassmorphism strategy for phases 4–8
- Preserve the 16-theme token system.
- Use panel-level blur rather than per-control blur.
- Keep scientific colour ramps independent from appearance themes.
- Center all high-priority dialogs/sheets through viewport-level layers/portals.
- No clipping, half-visible overlays or trigger-relative positioning for large galleries/dialogs.
- Every modal/sheet must respect safe-area insets and dynamic viewport height.
- Maintain reduced-motion, high-contrast and backdrop-filter fallbacks.

## Rollback policy
Every phase begins from a verified main SHA and uses a dedicated branch. No experimental phase is developed directly on main. Each merged phase is a clean revert boundary. Never force-reset public main.

## Deployment policy
A phase may merge only after:
1. scientific regression passes;
2. TypeScript typecheck passes;
3. production build passes;
4. relevant Playwright acceptance passes;
5. responsive viewport checks pass;
6. public deployment verification passes for merged phases.

## Current immediate action
The Phase 3.5-HF appearance-gallery centering fix is the first implementation under this plan. Heavy new-block acquisition begins only after this hotfix is validated and merged.
