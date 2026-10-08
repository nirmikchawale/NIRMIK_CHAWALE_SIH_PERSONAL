# 3DB-11 — Indian Ocean Scale-Out

## Authoritative starting point

3DB-10 was merged into main at 7ce2846a8e27420d950ce87edc7a348d2adfeb4d, with successful exact-main tests, final-mvp and public GitHub Pages Chromium acceptance. This phase is isolated to branch 3db-11-indian-ocean-scale-out. Acquisition results, CI, merge and deployment are separate gates; a branch commit never proves public availability.

## Objective

Expand the existing genuine GLORYS12V1 full-water-column pilot inventory from 25 toward 35 ocean-masked, region-diverse scientific blocks, without inventing ocean measurements or modifying the immutable BASE-GLORYS-001 baseline. The 140-cell geographic grid remains unchanged. Planned cells remain scientifically locked.

## Acquisition and validation boundary

- Source: original NCAR GDEX public THREDDS OPeNDAP GLORYS12V1 archive, using the existing 2004-03-15 genuine daily model file, not a fabricated timestamp.
- Selection: exactly ten geographically distinct unmaterialized ocean cells, with existing source-backed mask ocean fraction at least 0.80. Round-robin six eligible Indian Ocean geographic regions, then a second pass for coverage diversity.
- Reuse: Phase 3.5B OPeNDAP extractor, 3DB-01 fail-closed manifest/candidate SHA-256 and deep payload validators.
- Every block must contain source-backed thetao/so/uo/vo and genuine longitude, latitude and depth coordinates. Only horizontal current velocity is asserted.
- The selected ten candidates are acquired to a temporary directory and independently deep validated before **any** production manifest/pilot count is modified.
- A failed or unavailable remote read aborts the batch. There is no synthetic fallback, no reassignment of old blocks, and no false declaration of materialization.
- Promotion adds original-source SHA-256 manifests, genuine payload files, canonical TypeScript registry records and exact scientific regression expectations.
- Historic 3DB-02 IO-029 source digest, preexisting 31 files and six genuine multi-date pilots remain unchanged.
- Geographically selectable remaining planned targets retain empty payload/date arrays and locked Cesium and Water Column readiness.
- Observation proximity does not become independent observation/model validation.

## Planned scientific inventory

Pre-acquisition: 140 logical / 25 pilots / 115 planned / 6 multi-date / 31 source payloads / zero land pilots.

Target only after actual acquisition and all validation gates: 140 logical / 35 pilots / 105 planned / 6 multi-date / 41 checksum-verified source payloads / zero land pilots.

New pilot IDs and each payload SHA-256 are recorded here by the acquisition executor **only after** validating the remote source-backed bytes. No evidence is claimed from the target numbers before successful ingestion.

## Repeatable GitHub acquisition and recovery

Dedicated push-triggered workflow .github/workflows/3db11-scale-out.yml runs only on the isolated 3DB-11 branch and performs source acquisition, offline deep checks, scientific regressions, and an atomic Git commit of the verified assets. CI for tests and final-mvp must then pass on the exact PR head before merge. Re-run is safe after successful promotion: it re-verifies existing evidence rather than rewriting science. A failed acquisition must leave main at its previous verified state.

## Scope and integrations

3DB owns source evidence, block materialization, manifest, runtime pilot identifiers, scientific regressions and provenance. No redesign of RUI shell, global navigation, light/dark theme, controls, provenance styling or Water Column/Cesium renderer internals. Existing API/static routing and source semantics are reused.

## Production acceptance still required

1. Verify new 10 genuine source files and their source SHA-256 checksums.
2. Verify 35/105/6/41 exact counts, six or more distinct geographic regions, original baseline/legacy pilot preservation and fail-closed planned states.
3. Run Python scientific integrity, frontend typecheck/build, full Playwright browser and model/API fallback suites on exact PR head.
4. Recheck concurrency/main changes; merge only a clean fully passing PR by expected head SHA.
5. Verify post-merge tests + final-mvp + Pages build/deploy + live public HTTPS and Chromium against the exact merge commit.
6. Do not declare 3DB-11 live merely because a workflow, acquisition, branch or PR succeeded.

## Next planned phase

3DB-12 — Block Performance & LOD. Optimize genuine block loading without altering verified measurements or creating temporal/spatial science that does not exist.

## Source-acquisition results (generated and deep-validated)

| Region | New block | Actual source date | Payload SHA-256 |
|---|---|---|---|
| Andaman & Nicobar | IO-082 | 2004-03-15 | db62891f16394e6851ab1bc43e94997262a03566b864d221091a65f1ca309f7f |
| Bay of Bengal | IO-066 | 2004-03-15 | e2977687903c90f3eff8af3afbde872005805ad98e072f091dcf0cdef3ce764b |
| Central Arabian Sea | IO-059 | 2004-03-15 | 1cfacdfb94c04239264a6493ad0999b9d199a514f1cc21e580dba0f35b71fbd8 |
| Eastern Indian Ocean | IO-122 | 2004-03-15 | ec20af46c0e3e0d2c64661cfe4ddb15f7d4a0023d5d2bb6fc834192fc6837088 |
| Lakshadweep & Southern Arabian Sea | IO-130 | 2004-03-15 | 77651099bf0e3dc78e835eedafa92f762cf4abdd30104f23f91700a693ac8b13 |
| Western Arabian Sea | IO-030 | 2004-03-15 | 2065f6d08ff9f505877d82ea7cf20d35d7c9b676b5da0732eeb7da4571b285ba |
| Andaman & Nicobar | IO-124 | 2004-03-15 | 231f45d806dcf3a94bc825d2186af807013c153f16396d702d153af58ec8c972 |
| Bay of Bengal | IO-067 | 2004-03-15 | 018494e2598d95fc05ca813c371d784e20a8516e857d4a8b44173b89ba97e0d4 |
| Central Arabian Sea | IO-060 | 2004-03-15 | 9657a6b8c050cc8509ee75c27094d77257bce5da13424cf4545e3ff6e6d59ce9 |
| Eastern Indian Ocean | IO-123 | 2004-03-15 | 9babe948c9e945cbe0802a2254515f052ede6fd451d667bdab918ea202dc3891 |

Validated branch inventory: 140 logical; 35 pilots; 105 planned; 6 multi-date; 41 genuine checksum-referenced payloads; zero land. This does not certify merge/deployment; live gates remain separate.
