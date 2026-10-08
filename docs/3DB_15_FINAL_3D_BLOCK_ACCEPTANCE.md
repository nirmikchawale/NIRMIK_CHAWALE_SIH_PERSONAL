# 3DB-15 — Final 3D Block Acceptance & Production Deployment

## Starting checkpoint
Start from authoritative \`main\` commit \`b68616a3332319c0ec2a79b5f3fc6bef84494e9c\`: 3DB-14 PR #177 and MPR-03–09 integrated in release PR #180. This release commit is not assumed deployed until its exact-SHA Pages deploy and public Chromium workflow finish green. Phase 3DB-15 is isolated to \`3db-15-final-production-acceptance\` and changes only scientific acceptance artifacts.

## Exact scientifically defensible target
- 140 geographically defined logical blocks.
- 35 genuinely materialized GLORYS12V1 pilots, including 6 genuine multi-date pilots.
- 41 immutable original-source JSON frame assets with verified SHA-256 fingerprints.
- 105 geographically defined but scientifically locked unmaterialized targets; 70 are geographically eligible for future acquisition, 35 are not.
- Independent model-observation validation remains available only for the separate immutable \`BASE-GLORYS-001\` baseline, not automatically for any of these 35 pilots.
- Existing 16 color themes, MPR shell/navigation, RUI ownership, backend, timestamps, source coordinates, payload measurements, QC and provenance remain untouched.

## Phase 3DB-15 release evidence
1. **Complete source and science contract audit** — cross-check every one of 140 TS runtime capabilities against the canonical 3DB-14 source audit. The 35 genuine blocks must retain source checksums, actual dates/depth/variables, and Cesium/Water Column eligibility. The 105 planned cells must retain empty native-source selections and disabled renderer gates.
2. **Published scientific assets** — retrieve the exact 140-block audit from the production static origin and SHA-256 verify **each of the 41 unchanged original bytes** on that same origin. No asset may be simulated, rewritten, or silently omitted.
3. **End-to-end live science flow** — on actual Chromium and a production build, select a genuinely materialized block from the Andaman & Nicobar region (\`IO-082\`) and enter Water Column; assert selected block identity, genuine source-backed state, 31 native depth levels, non-empty scientific sample evidence, and truthful independent-validation disclosures. Prior 3DB acceptance separately covers baseline and \`IO-001\` Arabian Sea.
4. **Exact-commit release chain** — required PR workflow and shared \`tests\`/\`final-mvp\` pass on the precise PR head; merge after conflict review; verify the resulting \`main\` SHA, Pages build + deploy, HTTPS, and *public Chromium verification* on that exact \`main\` SHA.

## What this does and does not prove
A passing browser test is concrete evidence for the specific Water Column instance it exercised, not pixel-wise GPU proof for all 35 pilots. Integrity checks cover all 41 published data frames; runtime render contracts cover all 35 pilots; independent per-block WebGL frames are **not claimed for all 35**. No test promotes any of the 105 unavailable blocks or implies all 140 are publicly rendered. Full 140-block materialization requires a separate genuine acquisition and validation milestone beyond 3DB-15.

## Final reporting requirement
Record branch/PR IDs, exact verified merge commit, individual CI checks, exact Pages run with build/deploy/verify-public results, live URL, timestamp and any remaining limitations. Until those are independently observed, status must remain BUILDING, VALIDATING, MERGE READY or DEPLOYING — never LIVE & VERIFIED.

## Live URL
https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore
