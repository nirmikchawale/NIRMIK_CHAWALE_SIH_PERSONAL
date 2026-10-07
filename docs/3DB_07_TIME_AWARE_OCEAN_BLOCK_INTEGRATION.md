# 3DB-07 — Time-Aware Ocean Block Integration

## Objective

3DB-07 makes source-backed pilot block time an explicit native-source contract while applying the user-directed geographic cleanup to the Indian Ocean block field.

The phase starts from verified production main `b626b580dab62ec0820ef239b6b7a90c1ed1d118`, which already contains 3DB-06 and RUI-NAV-02.

## User-directed block-field correction

The canonical source manifest still records the original 140 logical extraction cells for provenance and audit continuity. The live explorable block field now applies a stricter display/selection rule:

- retain every cell with `ocean_fraction > 0`;
- retain mixed ocean+land/coastal cells;
- suppress only cells with `ocean_fraction == 0`;
- result: **112 ocean-intersecting blocks retained** and **28 land-only cells suppressed**.

The immutable verified GLORYS reference footprint (67–70°E, 12–14°N) is no longer drawn as a competing “main block”. It previously crossed IO-073, IO-074, IO-087 and IO-088. The scientific baseline data and its independent model-observation evidence remain intact as reference science.

## Yellow ocean-block field

Retained footprints use a yellow light-to-dark coverage scale:

- lighter yellow = lower ocean fraction / mixed coastal footprint;
- darker yellow = higher ocean fraction / ocean-dominant footprint.

The colour is presentation metadata only. It does not modify model values, block eligibility, validation state or materialization.

## Interaction correction

The historical full-page source-context reload is removed.

Active block changes now:

1. persist the selected block ID;
2. update URL context;
3. emit the canonical active-block event;
4. refresh the scientific catalog/provenance/profile context in-session;
5. reset source-coupled time selection safely to the first genuine timestamp.

A geographic block click selects context only. It does **not** automatically enter Water Column 3D. Water Column remains available through its explicit control/navigation path.

## Native-time contract

`frontend/src/main-block-time.ts` introduces `MAIN_BLOCK_TIME_INTEGRATION_VERSION = "3db-07-v1"`.

For source-backed blocks, timestamps must be:

- genuine payload timestamps;
- explicit UTC;
- valid instants;
- strictly increasing and unique;
- exactly aligned with manifest source dates.

Planned blocks remain time-empty and fail closed.

No timestamps are interpolated, duplicated or invented. Playback is enabled only when more than one genuine timestamp exists.

Current evidence remains:

- 25 source-backed pilots;
- 6 pilots with two genuine dates;
- 19 pilots with one genuine date;
- 31 checksum-addressed pilot payloads.

## Scientific truth firewall

3DB-07 does not:

- delete or mutate the immutable GLORYS reference evidence;
- create synthetic timestamps;
- create synthetic measurements, coordinates or depths;
- claim vertical current velocity;
- promote planned blocks to materialized status;
- treat land-only suppression as scientific data deletion.

## Completion gate

3DB-07 is complete only after exact-head tests/final-mvp pass, the PR is merged onto the latest reconciled `main`, exact-main CI succeeds, GitHub Pages deploys the merge, public HTTPS verification succeeds, and live Chromium judge-flow acceptance succeeds.


## Post-acceptance reconciliation note

After RUI-NAV-03 advanced production main, 3DB-07 was reconciled onto that verified tree. The canonical 140-cell registry remains intact for provenance and lifecycle accounting, while the interactive field exposes only the 112 cells with ocean_fraction > 0. Pilot activation closes the legacy catalog immediately and refreshes source context in-session; no block activation performs a full-page reload or auto-enters Water Column 3D.
