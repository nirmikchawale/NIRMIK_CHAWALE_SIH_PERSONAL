# 3DB-08 — Multi-Variable Block Integration

## Objective

3DB-08 makes scientific variable availability a first-class, fail-closed source-evidence contract for the canonical Ocean Canvas main-block system.

The phase starts from verified production main `3d2dce3a1f07ec05d3aa38d07db27a2018d7ac60`, which contains 3DB-07 Time-Aware Ocean Block Integration and the reconciled RUI-NAV production hierarchy.

## Existing genuine variable evidence

No new scientific acquisition is required for this phase.

The current 25 source-backed GLORYS12V1 pilot blocks already contain genuine native source components:

- `thetao` — potential temperature;
- `so` — salinity;
- `uo` — zonal current component;
- `vo` — meridional current component.

Across the existing pilot inventory there are 31 checksum-addressed payloads. Every payload is required to preserve its native source shape, source units, finite-count metadata and source minimum/maximum metadata.

The main-block scientific variables exposed to the product remain exactly:

- `thetao`;
- `so`;
- `currents` — horizontal speed/vectors derived only from colocated native `uo` and `vo`.

## Native multi-variable contract

`frontend/src/main-block-variables.ts` introduces:

`MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION = "3db-08-v1"`

For a source-backed pilot payload, the contract now verifies before scientific use that:

1. the declared depth × latitude × longitude shape is positive and integral;
2. each source component array length exactly matches that native shape;
3. each retained value is either a finite source number or null land fill;
4. `finite_count` matches the retained finite values;
5. source minimum and maximum match the retained finite values;
6. units are present;
7. currents are available only when both `uo` and `vo` exist;
8. `uo` and `vo` units match;
9. at least one colocated finite `uo`/`vo` pair exists before currents are advertised;
10. unsupported source components cannot silently become main-block variables.

A materialized pilot must support every variable declared by the canonical main-block registry. Otherwise the payload fails closed instead of advertising a capability it cannot support.

## Lifecycle behavior

### Verified baseline

The immutable `BASE-GLORYS-001` baseline retains its existing verified-registry variable contract:

- temperature;
- salinity;
- horizontal currents.

No new baseline value or validation claim is introduced.

### Source-backed pilot

Pilot variable readiness is now payload-resolved. Variable validation runs when a pilot payload is loaded and again at the renderer helper boundary before scalar or current scientific surfaces are constructed.

### Planned block

Planned blocks remain variable-empty and scientifically locked. Passing scientific variable evidence to a planned block is a contract violation.

## Chlorophyll boundary

INCOIS chlorophyll remains a genuine external source with its own provenance and surface-only semantics.

3DB-08 does **not** relabel chlorophyll as a GLORYS main-block variable and does not create subsurface chlorophyll. The existing 3DB-04 external-source renderer boundary remains authoritative.

## Current-vector boundary

3DB-08 preserves the existing scientific statement that currents are horizontal only:

- source components: `uo`, `vo`;
- derived speed: `sqrt(uo² + vo²)`;
- no vertical velocity component is claimed or inferred.

## Files

- `frontend/src/main-block-variables.ts`
- `frontend/src/pilot-main-block-loader.ts`
- `frontend/e2e/3db08-multi-variable-block-integration.spec.ts`
- `tests/test_3db08_multi_variable_block_integration.py`
- `docs/3DB_08_MULTI_VARIABLE_BLOCK_INTEGRATION.md`

## Scientific truth firewall

3DB-08 does not:

- acquire or synthesize new measurements;
- add timestamps, coordinates or depths;
- mutate the immutable verified GLORYS baseline;
- promote any planned block;
- invent chlorophyll inside GLORYS block payloads;
- invent a vertical current component;
- attach baseline Argo validation to pilot blocks;
- alter source checksums or payload values.

## Acceptance criteria

The phase is acceptable only if all of the following hold:

- all 25 existing pilot blocks and all 31 checksum-addressed payloads pass the variable-evidence audit;
- all planned blocks remain payload- and variable-empty;
- TypeScript/Playwright contract tests prove valid pilot/baseline readiness and fail-closed invalid cases;
- the live pilot Explorer exposes exactly Temperature, Salinity and Horizontal current speed for the active GLORYS pilot;
- chlorophyll is not exposed as a GLORYS block variable;
- existing depth/time/geographic/Cesium/Water Column behavior remains green;
- exact-head repository tests and `final-mvp` pass;
- the branch is reconciled against the latest authoritative `main` immediately before merge;
- the merge commit passes exact-main tests, `final-mvp`, Pages deployment, public HTTPS verification and live Chromium acceptance.

Only after those gates pass may 3DB-08 be called **LIVE & VERIFIED**.
