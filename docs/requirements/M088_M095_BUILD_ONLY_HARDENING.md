# M088–M095 — Build-first hardening and deferred release readiness

**Stage A / draft PR only. Never merge or deploy from these tests.**

| Phase | Implemented | Unresolved acceptance |
|---|---|---|
| M088 | Actual browser PerformanceResourceTiming transfer+latency inspection or explicit UNMEASURED | Production bundle/GPU measurements not captured |
| M089 | Source index-only LOD and bounded, copy-safe SHA-addressed cache accepting original verified bytes only | Real-world cache benchmark/integration into all consumers |
| M090 | Abort+generation stale response invalidation and negative tests | Network/Chromium offline scenarios across entire app |
| M091 | Same-origin URL allowlist, file extension/size/media intake policy | Full upload/server endpoint and security threat model |
| M092 | Immutable source/hash and glass theme audit script; rights remain conservative | Detailed npm/pip advisory/attribution + Copernicus licence signoff |
| M093 | Deterministic 41-frame SHA regression, schema test, 18-theme ID registry, read-only exact-source inventory | Reproducible build artifact hash across runners |
| M094 | Check static export, FastAPI, Streamlit and Pages source recovery files exist, not production execution | Live hosted browser and actual fallbacks not certified |
| M095 | Complete committed-source build-first summary, honest unresolved gates, documentation traceability | Exact-HEAD CI green, 108 real screenshots, scientific source acquisition, pre-release approvals |

## The boundaries

- This source branch is cumulative and intentionally mixed UI/science. Existing
  MPR release workflow only permits frontend-only changes and therefore may
  fail its scope job. **Do NOT relax production gates or force merge.**
- M024–M031 competitor historical 98 names and 300 features cannot be
  certified from partial verified evidence. M040–M047 IO-087 real 2024 source
  still needs an authenticated source receipt and new QC-driven residuals.
- The M064/M072 scientific modules preserve native pilot payloads and base
  GLORYS12V1/Argo immutable evidence. Further UI and true 3D browser work
  remain before marking M064–M079 entirely complete.
- 18 theme identifiers and CSS styles now exist, with 108 **targets**, not
  108 verified screenshots. No documented claim of all-responsive perfection.
- Keep PR #202 and #204 as drafts; never publish main until user authorizes
  a separate Stage B release campaign, exact science gates and live Chromium.

## Local verification

```bash
python scripts/certify_build_first.py
python -m pytest -q
cd frontend && npm ci && npm run typecheck && npm run build
# In isolated local preview only, run the relevant draft-only Playwright specs
```

The hourly build continuation is responsible for CI follow-up and honest
unresolved blockers. **This handoff is not an autonomous production approval.**
