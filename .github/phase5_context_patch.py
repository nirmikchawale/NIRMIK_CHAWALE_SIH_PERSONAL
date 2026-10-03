from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one match in {path}, found {count}: {old[:120]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


runtime = r'''import { activeMainBlockRegion, readActiveMainBlockId, resolveMainBlock } from "./main-block-runtime";
import {
  SCIENTIFIC_TIME_CONTEXT_EVENT,
  readScientificTimeContext,
  type ScientificTimeContextSnapshot,
  type ScientificTimeKind
} from "./time-engine";

export type ScientificSourceMode = "glorys" | "incois" | "chlorophyll";
export type ScientificWorkspaceVariable = "thetao" | "so" | "currents" | "chlorophyll";
export type ScientificContextOrigin = "explorer" | "telemetry" | "anomaly" | "system";

export interface ScientificWorkspaceContext {
  blockId: string;
  blockRegion: string;
  blockMaterialization: "verified-baseline" | "planned";
  sourceMode: ScientificSourceMode;
  variable: ScientificWorkspaceVariable;
  depthIndex: number | null;
  depthM: number | null;
  timestamp: string | null;
  timeIndex: number | null;
  timeKind: ScientificTimeKind;
  selectedProfileId: string | null;
  origin: ScientificContextOrigin;
  updatedAtUtc: string;
}

export type ScientificWorkspaceContextPatch = Partial<Omit<ScientificWorkspaceContext,
  "blockId" | "blockRegion" | "blockMaterialization" | "updatedAtUtc">>;

export const SCIENTIFIC_WORKSPACE_CONTEXT_EVENT = "oceancanvas:scientific-workspace-context";
export const SCIENTIFIC_WORKSPACE_CONTEXT_STORAGE_KEY = "oceancanvas-scientific-workspace-context-v1";

const DEFAULT_CONTEXT: Omit<ScientificWorkspaceContext, "blockId" | "blockRegion" | "blockMaterialization"> = {
  sourceMode: "glorys",
  variable: "thetao",
  depthIndex: null,
  depthM: null,
  timestamp: null,
  timeIndex: null,
  timeKind: "unavailable",
  selectedProfileId: null,
  origin: "system",
  updatedAtUtc: "1970-01-01T00:00:00.000Z"
};

function validSource(value: unknown): value is ScientificSourceMode {
  return value === "glorys" || value === "incois" || value === "chlorophyll";
}

function validVariable(value: unknown): value is ScientificWorkspaceVariable {
  return value === "thetao" || value === "so" || value === "currents" || value === "chlorophyll";
}

function readStoredContext(): Partial<ScientificWorkspaceContext> | null {
  try {
    const raw = window.sessionStorage.getItem(SCIENTIFIC_WORKSPACE_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ScientificWorkspaceContext>;
    if (!value || typeof value !== "object") return null;
    return value;
  } catch {
    return null;
  }
}

function timeIsNewer(time: ScientificTimeContextSnapshot | null, context: Partial<ScientificWorkspaceContext> | null): boolean {
  if (!time) return false;
  const timeUpdated = Date.parse(time.updatedAtUtc);
  const contextUpdated = Date.parse(context?.updatedAtUtc ?? "");
  if (!Number.isFinite(timeUpdated)) return false;
  if (!Number.isFinite(contextUpdated)) return true;
  return timeUpdated > contextUpdated;
}

export function readScientificWorkspaceContext(): ScientificWorkspaceContext {
  const stored = readStoredContext();
  const timeContext = readScientificTimeContext();
  const activeBlock = resolveMainBlock(readActiveMainBlockId());
  const useTimeContext = timeIsNewer(timeContext, stored);

  const sourceMode = validSource(stored?.sourceMode) ? stored.sourceMode : DEFAULT_CONTEXT.sourceMode;
  const variable = validVariable(stored?.variable) ? stored.variable : DEFAULT_CONTEXT.variable;

  return {
    ...DEFAULT_CONTEXT,
    ...stored,
    sourceMode,
    variable,
    blockId: activeBlock.id,
    blockRegion: activeMainBlockRegion(activeBlock),
    blockMaterialization: activeBlock.materialization,
    timestamp: useTimeContext ? timeContext?.timestamp ?? null : stored?.timestamp ?? null,
    timeIndex: useTimeContext ? timeContext?.timeIndex ?? null : stored?.timeIndex ?? null,
    timeKind: useTimeContext ? timeContext?.timeKind ?? "unavailable" : stored?.timeKind ?? "unavailable",
    updatedAtUtc: useTimeContext ? timeContext?.updatedAtUtc ?? new Date().toISOString() : stored?.updatedAtUtc ?? DEFAULT_CONTEXT.updatedAtUtc
  };
}

export function publishScientificWorkspaceContext(patch: ScientificWorkspaceContextPatch): ScientificWorkspaceContext {
  const current = readScientificWorkspaceContext();
  const activeBlock = resolveMainBlock(readActiveMainBlockId());
  const next: ScientificWorkspaceContext = {
    ...current,
    ...patch,
    blockId: activeBlock.id,
    blockRegion: activeMainBlockRegion(activeBlock),
    blockMaterialization: activeBlock.materialization,
    updatedAtUtc: new Date().toISOString()
  };

  try {
    window.sessionStorage.setItem(SCIENTIFIC_WORKSPACE_CONTEXT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The context remains live in-memory through the custom event when storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent<ScientificWorkspaceContext>(SCIENTIFIC_WORKSPACE_CONTEXT_EVENT, {
    detail: next
  }));
  return next;
}

export function subscribeScientificWorkspaceContext(listener: (context: ScientificWorkspaceContext) => void): () => void {
  const emitCurrent = () => listener(readScientificWorkspaceContext());
  const onWorkspaceContext = (event: Event) => {
    const detail = (event as CustomEvent<ScientificWorkspaceContext>).detail;
    listener(detail ?? readScientificWorkspaceContext());
  };

  window.addEventListener(SCIENTIFIC_WORKSPACE_CONTEXT_EVENT, onWorkspaceContext);
  window.addEventListener("oceancanvas:active-main-block", emitCurrent);
  window.addEventListener(SCIENTIFIC_TIME_CONTEXT_EVENT, emitCurrent);
  return () => {
    window.removeEventListener(SCIENTIFIC_WORKSPACE_CONTEXT_EVENT, onWorkspaceContext);
    window.removeEventListener("oceancanvas:active-main-block", emitCurrent);
    window.removeEventListener(SCIENTIFIC_TIME_CONTEXT_EVENT, emitCurrent);
  };
}

export function sourceLabel(source: ScientificSourceMode): string {
  if (source === "incois") return "INCOIS operational";
  if (source === "chlorophyll") return "INCOIS chlorophyll";
  return "GLORYS baseline";
}

export function variableLabel(variable: ScientificWorkspaceVariable): string {
  if (variable === "so") return "Salinity";
  if (variable === "currents") return "Currents";
  if (variable === "chlorophyll") return "Chlorophyll";
  return "Temperature";
}
'''
write("frontend/src/scientific-context-runtime.ts", runtime)

context_bar = r'''import { useEffect, useState } from "react";

import type { PageId } from "../navigation";
import {
  readScientificWorkspaceContext,
  sourceLabel,
  subscribeScientificWorkspaceContext,
  variableLabel,
  type ScientificWorkspaceContext
} from "../scientific-context-runtime";

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

function timeLabel(context: ScientificWorkspaceContext): string {
  if (!context.timestamp) return "Unavailable";
  const date = new Date(context.timestamp);
  if (Number.isNaN(date.getTime())) return context.timestamp;
  return `${date.toISOString().slice(0, 10)} · ${date.toISOString().slice(11, 16)} UTC`;
}

export function ScientificContextBar({ page, onNavigate }: Props) {
  const [context, setContext] = useState(readScientificWorkspaceContext);

  useEffect(() => {
    setContext(readScientificWorkspaceContext());
    return subscribeScientificWorkspaceContext(setContext);
  }, []);

  const planned = context.blockMaterialization === "planned";

  return (
    <section
      className="scientific-context-bar"
      data-testid="scientific-context-bar"
      data-block-id={context.blockId}
      data-block-materialization={context.blockMaterialization}
      data-source-mode={context.sourceMode}
      data-variable={context.variable}
      data-time-kind={context.timeKind}
    >
      <div className="scientific-context-kicker">SHARED SCIENTIFIC CONTEXT</div>
      <details defaultOpen={page !== "explore"}>
        <summary>
          <span>{context.blockId}</span>
          <strong>{planned ? "PLANNED TARGET" : "VERIFIED CONTEXT"}</strong>
        </summary>
        <dl>
          <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
          <div><dt>Source</dt><dd>{sourceLabel(context.sourceMode)}</dd></div>
          <div><dt>Time</dt><dd>{timeLabel(context)}</dd></div>
          <div><dt>Variable</dt><dd>{variableLabel(context.variable)}</dd></div>
          <div><dt>Depth</dt><dd>{context.depthM == null ? (context.variable === "chlorophyll" ? "Surface only" : "Not selected") : `${context.depthM.toFixed(2)} m`}</dd></div>
        </dl>
        <div className={`scientific-context-status ${planned ? "planned" : "verified"}`}>
          <strong>{planned ? "Geographic selection only" : "Source-backed scientific context"}</strong>
          <span>
            {planned
              ? "This block has no materialized scientific volume yet. Analysis workspaces remain anchored to verified source evidence until genuine block data is available."
              : "Block, time, variable and depth can now travel between compatible Ocean Canvas workspaces."}
          </span>
        </div>
        {page !== "explore" && (
          <button type="button" className="scientific-context-return" onClick={() => onNavigate("explore")}>
            Open context in 3D Explorer
          </button>
        )}
      </details>
    </section>
  );
}
'''
write("frontend/src/components/ScientificContextBar.tsx", context_bar)

css = r'''.scientific-context-bar {
  margin: 12px 8px 8px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--glass-border, rgba(255,255,255,.18)) 86%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--glass-bg, rgba(8,22,34,.72)) 84%, transparent);
  box-shadow: 0 12px 30px rgba(0, 0, 0, .14);
  backdrop-filter: blur(14px);
}

.scientific-context-kicker {
  font-size: .61rem;
  letter-spacing: .14em;
  font-weight: 800;
  opacity: .66;
  margin-bottom: 6px;
}

.scientific-context-bar summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  list-style: none;
}

.scientific-context-bar summary::-webkit-details-marker { display: none; }
.scientific-context-bar summary span { font-weight: 850; font-size: .82rem; overflow-wrap: anywhere; }
.scientific-context-bar summary strong { font-size: .57rem; letter-spacing: .08em; opacity: .78; text-align: right; }

.scientific-context-bar dl {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
}

.scientific-context-bar dl > div {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.scientific-context-bar dt {
  font-size: .62rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  opacity: .55;
}

.scientific-context-bar dd {
  margin: 0;
  font-size: .68rem;
  line-height: 1.35;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.scientific-context-status {
  margin-top: 10px;
  padding: 9px;
  border-radius: 10px;
  border: 1px solid rgba(95, 224, 255, .22);
  background: rgba(55, 202, 238, .07);
  display: grid;
  gap: 4px;
}

.scientific-context-status.planned {
  border-color: rgba(255, 190, 80, .28);
  background: rgba(255, 173, 51, .07);
}

.scientific-context-status strong { font-size: .68rem; }
.scientific-context-status span { font-size: .62rem; line-height: 1.4; opacity: .75; }

.scientific-context-return {
  width: 100%;
  margin-top: 9px;
  min-height: 34px;
  border-radius: 9px;
  font-size: .66rem;
  font-weight: 750;
}

@media (max-width: 768px) {
  .scientific-context-bar { margin: 8px 6px; padding: 9px; }
  .scientific-context-bar dl > div { grid-template-columns: 52px minmax(0, 1fr); }
}
'''
write("frontend/src/phase5-context-bridge.css", css)

master_prompt = r'''# Ocean Canvas — Phase 5.0 Shared Scientific Context Bridge

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
'''
write("docs/PHASE_5_0_SHARED_SCIENTIFIC_CONTEXT_MASTER_PROMPT.md", master_prompt)

context_test = r'''import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openExplore(page: import("@playwright/test").Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test("Phase 5.0 keeps block truth visible while analytics use verified evidence", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplore(page);

  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toBeVisible();
  await expect(context).toHaveAttribute("data-block-id", "BASE-GLORYS-001");

  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await hud.getByLabel("Active main block").selectOption("IO-047");
  await expect(context).toHaveAttribute("data-block-id", "IO-047");
  await expect(context).toHaveAttribute("data-block-materialization", "planned");
  await context.locator("details").evaluate((element: HTMLDetailsElement) => { element.open = true; });
  await expect(context).toContainText("Geographic selection only");
  await expect(context).toContainText(/remain anchored to verified source evidence/i);

  await page.getByRole("button", { name: "Telemetry" }).click();
  await expect(page.getByRole("heading", { name: "Depth & telemetry workspace" })).toBeVisible();
  await expect(context).toHaveAttribute("data-source-mode", "glorys");
  await page.getByRole("button", { name: "Salinity telemetry" }).click();
  await expect(context).toHaveAttribute("data-variable", "so");

  await page.getByRole("button", { name: "Anomaly Screening" }).click();
  const anomaly = page.locator('main[data-page="anomaly"]');
  await expect(anomaly).toBeVisible();
  await expect(anomaly).toHaveAttribute("data-time-index", "0");
  const anomalyTime = page.getByRole("slider", { name: "Anomaly time" });
  await expect(anomalyTime).toBeVisible();
  await expect(anomalyTime).toBeDisabled();
});

test("Phase 5.0 shared context stays viewport-safe on mobile", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplore(page);
  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
'''
write("frontend/e2e/scientific-context-bridge.spec.ts", context_test)

replace_once(
    "frontend/src/components/AppNavigation.tsx",
    'import { PAGE_ITEMS } from "../navigation";\n',
    'import { PAGE_ITEMS } from "../navigation";\nimport { ScientificContextBar } from "./ScientificContextBar";\n'
)
replace_once(
    "frontend/src/components/AppNavigation.tsx",
    '      ))}\n    </nav>',
    '      ))}\n      <ScientificContextBar page={page} onNavigate={onNavigate} />\n    </nav>'
)

replace_once(
    "frontend/src/main.tsx",
    'import "./main-block-globe-integration.css";\n',
    'import "./main-block-globe-integration.css";\nimport "./phase5-context-bridge.css";\n'
)

replace_once(
    "frontend/src/components/ControlPanel.tsx",
    'import type { Catalog, ProfileSummary, ViewMode, VisualizationMode } from "../types";\n',
    'import { useEffect } from "react";\n\nimport type { Catalog, ProfileSummary, ViewMode, VisualizationMode } from "../types";\n'
)
replace_once(
    "frontend/src/components/ControlPanel.tsx",
    'import { TimelineScrubber } from "./TimelineScrubber";\n',
    'import { TimelineScrubber } from "./TimelineScrubber";\nimport { publishScientificWorkspaceContext } from "../scientific-context-runtime";\n'
)
replace_once(
    "frontend/src/components/ControlPanel.tsx",
    '  const selectedVariable = catalog.variables.find((item) => item.id === variable);\n\n  const selectDepthFromTrack',
    '''  const selectedVariable = catalog.variables.find((item) => item.id === variable);\n\n  useEffect(() => {\n    const timestamp = catalog.coordinates.time[timeIndex] ?? null;\n    publishScientificWorkspaceContext({\n      sourceMode,\n      variable,\n      depthIndex: surfaceOnly ? null : depthIndex,\n      depthM: surfaceOnly ? null : depth,\n      timestamp,\n      timeIndex: timestamp ? timeIndex : null,\n      timeKind: timestamp ? "native" : "unavailable",\n      selectedProfileId: selectedProfileId || null,\n      origin: "explorer"\n    });\n  }, [catalog.coordinates.time, depth, depthIndex, selectedProfileId, sourceMode, surfaceOnly, timeIndex, variable]);\n\n  const selectDepthFromTrack'''
)

replace_once(
    "frontend/src/pages/TelemetryPage.tsx",
    'import { displayUnits } from "../units";\n',
    'import { displayUnits } from "../units";\nimport { resolveTimeIndex } from "../time-engine";\nimport { publishScientificWorkspaceContext, readScientificWorkspaceContext } from "../scientific-context-runtime";\n'
)
replace_once(
    "frontend/src/pages/TelemetryPage.tsx",
    '''export function TelemetryPage({ catalog, provenance }: Props) {\n  const [variable, setVariable] = useState<"thetao" | "so">("thetao");\n  const [depthIndex, setDepthIndex] = useState(() => Math.min(18, catalog.coordinates.depth.length - 1));\n  const [timeIndex, setTimeIndex] = useState(0);\n  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState("");\n\n  useEffect(() => {''',
    '''export function TelemetryPage({ catalog, provenance }: Props) {\n  const initialContext = useMemo(() => readScientificWorkspaceContext(), []);\n  const initialDepthIndex = Math.min(\n    Math.max(initialContext.depthIndex ?? 18, 0),\n    Math.max(0, catalog.coordinates.depth.length - 1)\n  );\n  const initialTimeIndex = resolveTimeIndex(catalog.coordinates.time, initialContext.timestamp) ?? 0;\n  const [variable, setVariable] = useState<"thetao" | "so">(initialContext.variable === "so" ? "so" : "thetao");\n  const [depthIndex, setDepthIndex] = useState(initialDepthIndex);\n  const [timeIndex, setTimeIndex] = useState(initialTimeIndex);\n  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState("");\n\n  useEffect(() => {\n    const timestamp = catalog.coordinates.time[timeIndex] ?? null;\n    publishScientificWorkspaceContext({\n      sourceMode: "glorys",\n      variable,\n      depthIndex,\n      depthM: catalog.coordinates.depth[depthIndex] ?? null,\n      timestamp,\n      timeIndex: timestamp ? timeIndex : null,\n      timeKind: timestamp ? "native" : "unavailable",\n      origin: "telemetry"\n    });\n  }, [catalog.coordinates.depth, catalog.coordinates.time, depthIndex, timeIndex, variable]);\n\n  useEffect(() => {'''
)

replace_once(
    "frontend/src/pages/AnomalyPage.tsx",
    'import { displayUnits } from "../units";\n',
    'import { displayUnits } from "../units";\nimport { resolveTimeIndex } from "../time-engine";\nimport { publishScientificWorkspaceContext, readScientificWorkspaceContext } from "../scientific-context-runtime";\n'
)
replace_once(
    "frontend/src/pages/AnomalyPage.tsx",
    '''export function AnomalyPage({ catalog }: Props) {\n  const [variable, setVariable] = useState<"thetao" | "so">("thetao");\n  const [depthIndex, setDepthIndex] = useState(Math.min(18, catalog.coordinates.depth.length - 1));\n  const [payload, setPayload] = useState<AnomalyResponse | null>(null);''',
    '''export function AnomalyPage({ catalog }: Props) {\n  const initialContext = useMemo(() => readScientificWorkspaceContext(), []);\n  const initialDepthIndex = Math.min(\n    Math.max(initialContext.depthIndex ?? 18, 0),\n    Math.max(0, catalog.coordinates.depth.length - 1)\n  );\n  const initialTimeIndex = resolveTimeIndex(catalog.coordinates.time, initialContext.timestamp) ?? 0;\n  const [variable, setVariable] = useState<"thetao" | "so">(initialContext.variable === "so" ? "so" : "thetao");\n  const [depthIndex, setDepthIndex] = useState(initialDepthIndex);\n  const [timeIndex, setTimeIndex] = useState(initialTimeIndex);\n  const [payload, setPayload] = useState<AnomalyResponse | null>(null);'''
)
replace_once(
    "frontend/src/pages/AnomalyPage.tsx",
    '''  useEffect(() => {\n    let cancelled = false;\n    setLoading(true);\n    setError("");\n    api.anomalies(variable, 0, depthIndex)''',
    '''  useEffect(() => {\n    const timestamp = catalog.coordinates.time[timeIndex] ?? null;\n    publishScientificWorkspaceContext({\n      sourceMode: "glorys",\n      variable,\n      depthIndex,\n      depthM: catalog.coordinates.depth[depthIndex] ?? null,\n      timestamp,\n      timeIndex: timestamp ? timeIndex : null,\n      timeKind: timestamp ? "native" : "unavailable",\n      origin: "anomaly"\n    });\n  }, [catalog.coordinates.depth, catalog.coordinates.time, depthIndex, timeIndex, variable]);\n\n  useEffect(() => {\n    let cancelled = false;\n    setLoading(true);\n    setError("");\n    api.anomalies(variable, timeIndex, depthIndex)'''
)
replace_once(
    "frontend/src/pages/AnomalyPage.tsx",
    '  }, [variable, depthIndex]);\n',
    '  }, [variable, timeIndex, depthIndex]);\n'
)
replace_once(
    "frontend/src/pages/AnomalyPage.tsx",
    '      data-depth-index={depthIndex} data-residual-flags={payload?.residual_screen.flagged_count ?? 0}>',
    '      data-depth-index={depthIndex} data-time-index={timeIndex} data-residual-flags={payload?.residual_screen.flagged_count ?? 0}>'
)
replace_once(
    "frontend/src/pages/AnomalyPage.tsx",
    '''        <div className="anomaly-time-control"><span>Timestamp</span>\n          <strong>{catalog.coordinates.time[0]?.replace("T00:00:00Z", "") ?? "Unavailable"}</strong>\n          <small>{catalog.coordinates.time.length} genuine timestamp(s)</small>\n        </div>''',
    '''        <label className="anomaly-time-control"><span>Genuine timestamp</span>\n          <strong>{catalog.coordinates.time[timeIndex]?.replace("T00:00:00Z", "") ?? "Unavailable"}</strong>\n          <input aria-label="Anomaly time" type="range" min={0}\n            max={Math.max(0, catalog.coordinates.time.length - 1)} value={timeIndex}\n            disabled={catalog.coordinates.time.length < 2}\n            onChange={(event) => setTimeIndex(Number(event.target.value))} />\n          <small>{catalog.coordinates.time.length} genuine timestamp(s) · native only</small>\n        </label>'''
)

print("Phase 5.0 shared scientific context patch applied successfully.")
