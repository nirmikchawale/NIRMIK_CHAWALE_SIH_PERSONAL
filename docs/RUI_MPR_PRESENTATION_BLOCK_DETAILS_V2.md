# MPR presentation and Block Details — Structural correction v2

## Actual failure diagnosed

The MPR-17 release placed `BlockDetailsWorkspace` **inside** the
`ExplorerConsolidationHost` portal's `.explorer-block-system-home` catalog.
This made its information dependent on an ancillary launcher and on the legacy
two-column "block" grid area. The user reasonably could not find a separate
Block Details area.

The old single-scene presentation mode hid much of the modern Explorer and
forced zero-height grid tracks. MPR's first correction still displayed the
judge guide as a bottom-right **fixed overlay**, obscuring the visible globe.
Water Column 3D used a 3:1 side-by-side split even for judging, reducing the
canvas substantially.

## Authoritative locations (one owner each)

- `3D Explorer → Block Details`: permanently visible, full-width, dedicated
  `.station-workspace > .mpr-block-details-workspace`, *immediately after*
  Ocean Intelligence and **before** Block System. Native block/source/variable/
  timestamp/depth come from `scientific-context-runtime`, never mock data.
  Five real navigation actions, including opening the mobile ControlPanel
  sheet before scrolling to its `Block & Region` controls.
- `3D Explorer → Block System`: separate original full catalog, Indian Ocean
  Block Engine and Arabian Sea Atlas through the existing React portal, now
  reserved an independent `catalog` grid row.
- `Geographic 3D → right control dock → Block & Region`: original
  source-preserving block fit/selection, via the existing OceanGlobe portal.
  The actual globe grid and observations never move off Cesium.
- `Presentation workspace`: a viewport-contained scrollable **single column**
  with actual Geographic 3D full-width scene, followed by a separate
  full-width Water Column renderer. Compact native selection identification,
  sticky Exit, readable headings. Controls never squeeze the scene into a
  side-by-side half.
- `Present demo`: six-step guide stays inside its own **top reserved row**;
  it is not `position:fixed` over the current page. Presentation navigation
  routes to the actual source-backed Explorer, Compare and Science pages with
  the guide remaining visibly readable and closeable.

## Certification / regression

`frontend/e2e/mpr-presentation-block-details.spec.ts` at 1440/1024/390
requires:
1. Exactly one Block Details section that is a **direct child** of the
   Explorer workspace, NOT nested under the Block System.
2. Width >90% of workspace with a non-overlapping row before the catalog;
   shared active scientific block identity and five actual buttons.
3. Both full-size Presentation scenes, each >90% of available stage width;
   Water Column canvas >93% section width, and a real vertical scroll owner.
4. The judge guide and routed view have **zero geometric overlap**.
5. Capture real browser PNG attachments for Block Details, Geographic and
   Water Column viewports in CI, beside all existing 16-theme screenshots.
6. No mutation to ocean numerical science, verified native depths/times,
   observations, provenance, Cesium renderer, or 16 user appearance choices.

Do not certify a public deployment until the exact merged SHA succeeds in
GitHub Pages **build + deploy** and independent public Chromium verification.
A successful commit/CI run is not proof that the current browser has refreshed.
