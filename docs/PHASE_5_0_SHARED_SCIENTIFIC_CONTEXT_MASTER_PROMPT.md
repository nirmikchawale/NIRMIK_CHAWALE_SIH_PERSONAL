# Ocean Canvas — Phase 5.0 Shared Scientific Context Bridge

## Role
Act as the scientific-product architect, React/TypeScript engineer, ocean-data integrity engineer, interaction designer, regression owner and deployment engineer for Ocean Canvas (SIH26067).

## Objective
Create the smallest safe cross-workspace context layer that turns the six principal workspaces into compatible views of one scientific question without interfering with the parallel 140-block acquisition/materialization work.

The bridge must connect, when scientifically compatible:

`BLOCK → SOURCE → NATIVE TIME → VARIABLE → DEPTH → PROFILE → WORKSPACE`

The six workspaces are 3D Explorer, Telemetry, Model vs Observation, Anomaly Screening, Data Lab, and Science & System.

## Authoritative existing contracts
1. Phase 3.5A/3.5A-G owns block IDs, geographic bounds, materialization state and Cesium/Water Column selection.
2. Phase 3.5C owns native time semantics, exact timestamp deep links and native/interpolated/unavailable provenance.
3. `BASE-GLORYS-001` is currently the only materialized GLORYS scientific volume.
4. `IO-001`…`IO-140` are valid geographic planning targets but must expose zero scientific values until genuine materialization occurs.

Never create a competing block registry or time engine.

## Scientific integrity firewall
- Never copy the verified baseline into a planned target.
- Never claim a planned target has telemetry, anomalies, observations or model values merely because it is selected geographically.
- Never fabricate timestamp, depth, source, profile or anomaly context.
- When a secondary analysis page uses the verified GLORYS API, publish that actual source context instead of pretending it is analysing an unsupported selected block/source.
- A planned block may remain selected geographically while an analysis workspace truthfully states that its scientific evidence is still anchored to the verified baseline.

## Shared context contract
Maintain a session-scoped context containing at minimum:
- active block ID / region / materialization state;
- source mode;
- variable;
- depth index and metres;
- timestamp / time index / time kind;
- selected profile ID when available;
- context origin and update timestamp.

The block selection must always be read from the authoritative block runtime. Time changes from Phase 3.5C must flow into the bridge when newer than workspace-local state.

## First integration slice
### 3D Explorer
Publish source, variable, depth, timestamp and selected profile whenever the existing Explorer controls change.

### Persistent navigation
Add a compact Shared Scientific Context surface to the existing workspace rail. It must be visible across all six main workspaces and explicitly distinguish verified vs planned block state.

### Telemetry
Hydrate supported variable, exact GLORYS timestamp and depth from compatible shared context. Publish any telemetry control changes back to the bridge. Telemetry remains truthful about using the verified GLORYS scientific API.

### Anomaly Screening
Remove the fixed `timeIndex = 0` assumption. Hydrate a compatible exact timestamp when available, expose an actual genuine-time control, call the anomaly API with the selected genuine time index, and publish anomaly variable/depth/time changes back to the bridge.

### Compare, Data Lab, Science & System
In this foundation phase, make the shared context visible through the persistent rail without inventing deeper interoperability. Their full context-aware behavior belongs to subsequent workspace phases.

## UX requirements
- No new blocking modal.
- Reuse the glass system.
- Compact enough for the existing left rail.
- Keyboard/touch accessible.
- Planned-vs-verified meaning must be conveyed by text, not color alone.
- No application-level horizontal overflow on mobile.

## Verification
Require:
- TypeScript typecheck;
- production build;
- existing block integration tests;
- existing Phase 3.5C time tests;
- new context-bridge browser acceptance;
- scientific/backend/static-export suites unchanged and green;
- GitHub Pages build/deploy/public HTTPS/live browser verification after merge.

## Definition of done
Phase 5.0 is done when:
1. all six pages expose one visible shared context surface;
2. Explorer publishes its real active scientific controls;
3. Telemetry consumes/publishes compatible context;
4. Anomaly no longer hard-codes time index zero and uses a genuine selectable timestamp contract;
5. planned blocks remain explicitly non-materialized and never inherit fake analytics;
6. no block acquisition, payload population or Cesium scientific values are modified;
7. regression and deployment gates pass.
