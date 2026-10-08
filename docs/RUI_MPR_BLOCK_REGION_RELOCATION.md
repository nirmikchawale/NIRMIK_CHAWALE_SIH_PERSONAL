# MPR post-release — Geographic Block & Region dock relocation

## User-visible defect
The real **INDIAN OCEAN BLOCK FIELD** interactive panel was rendered as
`.main-block-globe-hud` over the top-right of Cesium despite NAV-02
reserving a dedicated **Block System** home and MPR-10/11 reserving a
separate Geographic 3D control dock. At desktop and mobile viewports it
covered geographic visualization and overlapped other scene controls.

## Final ownership (one capability, one canonical home)
1. **3D Explorer → Block System** owns the full Indian Ocean Block Engine,
   Arabian Sea Atlas, source manifests, geometry/cell browsing and pilot
   materialization.
2. **Geographic 3D → right dock → Block & Region** is the FIRST real
   progressive group. It owns the existing `OceanGlobe` main-block
   selector, materialization summary, 112 ocean-intersecting targets,
   region camera-fit actions, block legend, evidence/observation warning
   and original Water Column 3D entry action.
3. **Ocean Intelligence → Active Main Block**, **Context & Info** and
   **Sources & QC** retain the existing native science/provenance context.
4. The **globe** shows actual geography, block footprints and observation
   markers without a floating block-field control card.

## Design
`ControlPanel` provides a stable `data-mpr-block-region-slot` inside a
native keyboard-operable `details` section. `OceanGlobe` uses a real
React portal to place its ORIGINAL control elements in this slot. The
camera/selection/Water Column callbacks remain in the same component;
there is no cloned React state or duplicated selector implementation.
The small observer watches the existing workstation for slot mount /
replacement, not external data or the full document.

`mpr-block-region-relocation.css` uses the 16 existing MPR theme
tokens to present controls in the normal-flow dock. The original global
absolute-positioned globe overlay styles continue to exist for
historical use, but scoped dock styles reset position, width, blur,
background and responsive constraints for this real relocated element.
The original full scene remains interactive. On mobile the existing
Explorer Controls sheet is the discoverable entry point; it opens on
request, so there is no permanent HUD over the globe. The
**Block & region** geographic shortcut opens and focuses the native dock
rather than incorrectly targeting the full Block System.

## Science and UX invariants
No changes to Cesium primitives, imagery, camera maths, globe block
footprints, GLORYS/INCOIS arrays, native time/depth, block manifests,
materialization count, Argo QC, actual observation validation, verified
comparison math, Water Column renderer, source data or scientific context
runtime. Planned blocks still cannot impersonate source-backed ocean
values. Existing `integrated-main-block-hud` and
`active-block-observation-context` selectors are retained in exactly
one mounted location for regression compatibility.

## Certification
- TypeScript/Vite React/Cesium build and source protection/pytest checks.
- Existing 3DB-07/09/13, MPR-10/11, main block globe tests and new
  `mpr-block-region-relocation.spec.ts` across 1440/1024/390/320.
- Both real 3D views, camera/fit/selector semantics and scientific
  warnings; no viewport overlap and no horizontal overflow.
- 16 glass themes, 96 original MPR screenshots and independent public
  Chromium (not a synthetic image or a mere merged-PR claim).
- Exact branch → main merge → GitHub Pages deployment → live production
  browser acceptance before declaring completion.
