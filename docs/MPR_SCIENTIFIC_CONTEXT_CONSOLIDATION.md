# MPR post-integration — Scientific Context consolidation

## Regression identified
The deployed RUI-02 workspace header still exposed all five scientific selection
fields in a permanent full-width row even after MPR-07 had introduced the
source-backed **Active Main Block** inside Ocean Intelligence and MPR-15 had
integrated **Sources & QC**. This was an incomplete layout consolidation,
not missing scientific data or a rendering fault.

## Implementation
- Keep exactly one authoritative `ScientificContextHeader` owned by
  `WorkspaceContextHost` across all six existing workspace routes.
- Present only active block identity, truthful verified/pilot/planned badge,
  and a compact source/variable hint in the desktop header. Do not display
  the former five-column permanent metadata strip.
- Place **Source, Variable, Time, Depth and Profile** inside the accessible
  **Context & Info** disclosure. Keep Region, Origin, Time kind,
  materialized-block selection/stepper, context deep-link copy, scientific
  disclaimer and evidence degradation reporting inside the same panel.
- Continue using the existing Explorer **Active Main Block** for block-level
  context and **Sources & QC** for provenance; do not duplicate these tools,
  fabricate science, replace data, or move a scientific state store.
- Reduce occupied shell height to 44px desktop and 54px mobile while honoring
  the existing responsive shell and global appearance tokens for all 16 themes.
- Allow native keyboard interaction plus Escape closing/focus restoration.
  Full metadata remains visible inside the disclosure even at 320px.

## Invariants
No changes to the scientific-context runtime, GLORYS/INCOIS payloads,
native timestamps/depths, variables/units, 3D renderers, source selection,
block status semantics, Argo QC, provenance, Main Block records, or routing.
No additional science requests are introduced by opening Context & Info.

## Production gate
Only label this patch LIVE VERIFIED after the new branch is integrated into
`main`, exact-head TypeScript/Vite/Python/scientific validation passes,
RUI-02 and MPR-07 UI regression tests pass, Pages deploys the new SHA,
live HTTPS Chromium judge-flow acceptance succeeds and all sixteen themes
retain usable contrast/layout. Preserve the original MPR-10–17 release
certification watch; an in-progress browser run is not a successful run.
