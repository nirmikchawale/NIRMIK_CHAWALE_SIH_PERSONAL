# 3DB-10 — Provenance & Scientific Evidence

## Status at implementation start

- Phase: 3DB-10
- Authoritative production base: `ac7346d2b628f0f0cdedba0d10f4654adbfe5c90`
- Previous phase: 3DB-09 Observation & Block Integration — merged, deployed and live-verified.
- Branch: `3db-10-provenance-scientific-evidence`
- Scope owner: CHAT 2 / 3DB scientific evidence.
- RUI shell/navigation/redesign: out of scope.

## Objective

3DB-10 makes provenance an **active-block scientific contract** instead of a generic drawer that can be misread as evidence for whichever geographic block happens to be selected.

The application already had a baseline-oriented provenance response and source/QC drawer. It also already had genuine pilot manifests with SHA-256 records and 3DB-09 observation roles. The missing contract was a conservative, block-scoped answer to:

> What model, checksum, renderer and observation evidence is actually attached to the active block, and which scientific claims must remain withheld?

## Scientific truth boundary

3DB-10 keeps four active evidence states separate:

1. **Immutable verified baseline**
   - canonical GLORYS12V1 baseline;
   - source-integrity and renderer acceptance are valid;
   - independent Argo-to-model evidence is allowed only when the verified comparison profiles are resolved.

2. **Checksum-verified pilot**
   - materialized Phase 3DB-02 pilot;
   - block bounds match the canonical manifest entry;
   - one or more canonical SHA-256 payload records exist;
   - manifest integrity explicitly rejects synthetic measurements, timestamps, coordinates and depths;
   - horizontal `uo`/`vo` only; no vertical current claim;
   - no independent Argo validation.

3. **Pilot evidence withheld**
   - a runtime block is marked pilot but canonical manifest/checksum evidence is missing or inconsistent;
   - provenance fails closed rather than borrowing baseline metadata.

4. **Planned — no scientific payload**
   - geographic identity and bounds exist;
   - no model payload, model checksum, source date/depth inventory, renderer validation or model-observation validation is attached;
   - observation profiles may still be spatial context under 3DB-09;
   - baseline fallback science must not be presented as provenance for the planned block.

## Runtime contract

New module:

- `frontend/src/main-block-provenance.ts`

Version:

- `MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION = "3db-10-v1"`

The contract derives, without duplicating source truth:

- active block ID and materialization;
- evidence class and availability;
- source product, product ID, dataset ID and DOI where scientifically attached;
- archive/provider/runtime context;
- canonical pilot payload SHA-256 records;
- manifest/block footprint consistency;
- source-integrity and renderer-acceptance status;
- 3DB-09 observation evidence class;
- independent comparison count versus spatial-context count;
- permitted scientific claims;
- explicitly withheld claims.

The derivation reuses:

- the canonical 3DB block runtime;
- the existing Phase 3DB-02 pilot manifest;
- the 3DB-09 observation/block integration;
- the existing baseline provenance response;
- the 3DB capability validation contract.

No second provenance database or duplicate payload manifest is created.

## Judge-facing integration

The existing **Sources & QC** drawer now includes an **Active block evidence** section.

It exposes testable DOM truth:

- `data-block-id`
- `data-materialization`
- `data-evidence-class`
- `data-evidence-availability`
- `data-checksum-count`
- `data-observation-evidence`
- `data-observation-count`
- `data-model-observation-validated`

For pilots, the drawer shows abbreviated canonical SHA-256 records from the existing manifest.

For planned blocks, the drawer deliberately withholds the normal runtime model-provenance panel and states that verified baseline fallback metadata is **not** active-block provenance.

This is a scientific-interface addition only. It does not redesign the RUI drawer aesthetics, global shell or navigation.

## Central non-fabrication cases

### IO-001 — genuine pilot

- materialization: pilot;
- source: GLORYS12V1;
- canonical manifest payload checksum evidence: present;
- model evidence: attached;
- renderer/source-integrity validation: attached through the existing contracts;
- independent Argo validation: false.

### IO-087 — planned block with real Argo footprint context

The two verified baseline Argo profiles fall geographically inside IO-087, as established in 3DB-09.

3DB-10 therefore reports:

- observation evidence: spatial context only;
- model payload provenance: withheld;
- checksum count: 0;
- model-observation validation: false;
- baseline fallback provenance: explicitly not presented as active IO-087 evidence.

Observation proximity cannot create model provenance.

## Acceptance tests

### Frontend / Playwright

`frontend/e2e/3db10-provenance-scientific-evidence.spec.ts` verifies:

- baseline evidence is classified as immutable verified;
- a real pilot contract exposes canonical checksum evidence;
- planned IO-087 has no model payload provenance even with spatial Argo context;
- missing pilot manifest evidence fails closed;
- the live drawer follows baseline → IO-001 → IO-087 active-block transitions;
- the live planned-block drawer withholds baseline fallback metadata.

### Python regression

`tests/test_3db10_provenance_scientific_evidence.py` verifies:

- 140 logical blocks remain in the source-backed manifest;
- 25 pilots and 6 multi-date pilots remain unchanged;
- 31 canonical payload checksum records remain valid SHA-256 strings;
- no land block is materialized;
- synthetic measurements/timestamps/coordinates/depths remain false;
- vertical current remains unavailable;
- IO-087 remains planned with no payloads/dates;
- the UI exposes block-scoped provenance truth attributes.

## Intentional non-changes

3DB-10 does not:

- add or modify ocean measurements;
- create new model dates or depths;
- materialize any planned block;
- promote spatial observations into model validation;
- add pilot Argo matchups;
- add vertical current velocity;
- change chlorophyll depth semantics;
- duplicate the canonical pilot manifest;
- redesign the RUI shell/navigation/drawer visual system;
- change existing URLs or block IDs.

## Readiness for 3DB-11

After 3DB-10 is merged and production-verified, 3DB-11 — **Indian Ocean Scale-Out** — can expand materialization while preserving a machine-testable provenance boundary for every new block. A new block can only graduate from planned to source-backed when its payload/checksum/source evidence passes the same fail-closed contract.
