# Ocean Canvas — Phase 3.5C Time Engine Master Prompt

## Mission
Implement Phase 3.5C as the canonical time architecture for Ocean Canvas without acquiring or fabricating new scientific data. Build on the completed Phase 3.5A block manifest and existing genuine GLORYS/INCOIS timestamps. Preserve the existing scientific-integrity contract.

## Non-negotiable scientific rules
- Never duplicate a timestamp to create apparent playback.
- Never label an interpolated timestamp as native/provider time.
- Never invent missing historical dates or sub-daily frames.
- Preserve provider/source values unchanged.
- The immutable one-timestamp GLORYS baseline must remain visibly static until genuinely additional GLORYS timestamps are materialized.
- Multi-time playback is enabled only when the active source actually exposes more than one genuine timestamp.
- Interpolation is optional architecture only; if it is ever used, it must be explicitly labelled `INTERPOLATED` at every relevant UI surface.

## Scope
Create a reusable time layer that supports the future hierarchy:

`block → source → date → timestamp → time-kind → variable → depth`

Phase 3.5C owns the time model and interaction semantics. It does **not** own acquisition of the ~140 block payloads, additional GLORYS dates, or Cesium block-footprint scale-out.

## Required architecture
1. Define a typed scientific time model with:
   - exact timestamp
   - UTC date
   - UTC clock time
   - index
   - provenance kind: `native | interpolated | unavailable`
2. Provide deterministic helpers for:
   - grouping source timestamps by UTC date
   - exact timestamp lookup
   - playback eligibility
   - timestamp formatting
   - deep-link restoration
3. Publish the current time selection into a session-scoped context contract so later Phase 5 workspaces can consume the same time state without inventing a second time model.
4. Persist the exact available timestamp in the URL hash query as `time=<ISO timestamp>`.
5. Restore only exact available timestamps from deep links. If a requested time is absent from the active source, fall back to a genuine available timestamp rather than synthesizing one.

## Required Explorer interaction
Upgrade the existing genuine timeline rather than replacing it.

For multi-time sources show:
- Phase 3.5C status
- selected UTC timestamp
- `NATIVE SOURCE TIME` or `INTERPOLATED` provenance badge
- explicit interpolation status
- native-date selector
- native UTC-time selector
- previous / play-pause / next controls
- timeline range scrubber
- playback speeds
- Argo surfacing markers where genuine dates intersect
- URL context status

For a one-timestamp source:
- keep playback unavailable
- state that only one genuine timestamp exists
- never create a second frame for visual effect

## Deep-link behavior
Examples:

`#/explore?time=2025-07-15T00%3A00%3A00.000Z`

On load/source activation:
- parse the requested timestamp
- match exact ISO time only
- restore the matching source index
- update the scientific time context
- never nearest-neighbour substitute without explicit user action

## UI rules
- Reuse the existing Ocean Canvas glass system.
- Do not create a separate competing time popup.
- Keep native/interpolated semantics visible near the active timestamp.
- Controls must remain usable on desktop, tablet and mobile.
- Disabled playback must look deliberately unavailable, not broken.
- Respect reduced-motion preferences.

## Integration boundary with the 140-block workstream
The block-deployment workstream owns:
- block IDs and bounds
- materialization state
- acquired source payloads
- genuine dates/timestamps per block
- geographic/Cesium scale-out

Phase 3.5C consumes those timestamps through the existing time-ready schema. Do not duplicate or mutate the block manifest to manufacture time coverage.

## Verification gates
Before merge:
1. TypeScript/build must pass.
2. Existing one-timestamp GLORYS behavior remains static and scientifically explicit.
3. Genuine INCOIS multi-time source exposes the Phase 3.5C selector and playback controls.
4. Active multi-time steps are labelled native unless a future explicit interpolation contract marks them otherwise.
5. Moving the scrubber updates the URL `time` query.
6. Reload + reselecting the same source restores the exact available timestamp.
7. Session time context records the exact timestamp and provenance kind.
8. No scientific values, depths, coordinates, block materialization claims or provider timestamps are modified.
9. Main Block Engine continues to state that planned blocks are not yet downloaded.
10. Responsive UI does not clip the new date/time controls.

## Definition of done
Phase 3.5C is complete when Ocean Canvas has one explicit, typed, deep-linkable and provenance-aware time engine that can immediately consume additional genuine block timestamps as the parallel data workstream materializes them, while the current GLORYS baseline remains truthfully static.