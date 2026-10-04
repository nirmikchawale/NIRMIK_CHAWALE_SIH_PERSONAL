import { activeMainBlockRegion, readActiveMainBlockId, resolveMainBlock } from "./main-block-runtime";
import type { PageId } from "./navigation";
import {
  SCIENTIFIC_TIME_CONTEXT_EVENT,
  readScientificTimeContext,
  type ScientificTimeContextSnapshot,
  type ScientificTimeKind
} from "./time-engine";

export type ScientificSourceMode = "glorys" | "incois" | "chlorophyll";
export type ScientificWorkspaceVariable = "thetao" | "so" | "currents" | "chlorophyll";
export type ScientificContextOrigin = "explorer" | "telemetry" | "compare" | "anomaly" | "data-lab" | "system";
export type ScientificBlockMaterialization = "verified-baseline" | "pilot" | "planned";

export interface ScientificWorkspaceContext {
  blockId: string;
  blockRegion: string;
  blockMaterialization: ScientificBlockMaterialization;
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

const QUERY_KEYS = {
  block: "block",
  source: "source",
  variable: "variable",
  depth: "depth",
  time: "time",
  profile: "profile"
} as const;

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

function hashParams(hash = window.location.hash): URLSearchParams {
  const query = hash.split("?")[1] ?? "";
  return new URLSearchParams(query);
}

function finiteDepth(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readLinkedContext(): Partial<ScientificWorkspaceContext> {
  const params = hashParams();
  const source = params.get(QUERY_KEYS.source);
  const variable = params.get(QUERY_KEYS.variable);
  const timestamp = params.get(QUERY_KEYS.time);
  const profile = params.get(QUERY_KEYS.profile);
  const depthM = finiteDepth(params.get(QUERY_KEYS.depth));

  return {
    ...(validSource(source) ? { sourceMode: source } : {}),
    ...(validVariable(variable) ? { variable } : {}),
    ...(depthM != null ? { depthM } : {}),
    ...(timestamp ? { timestamp, timeKind: "native" as const } : {}),
    ...(profile ? { selectedProfileId: profile } : {})
  };
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

function writeScientificContextToHash(context: ScientificWorkspaceContext): void {
  const hash = window.location.hash || "#/explore";
  const [route, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);

  params.set(QUERY_KEYS.block, context.blockId);
  params.set(QUERY_KEYS.source, context.sourceMode);
  params.set(QUERY_KEYS.variable, context.variable);

  if (context.depthM == null) params.delete(QUERY_KEYS.depth);
  else params.set(QUERY_KEYS.depth, String(context.depthM));

  if (context.timestamp) params.set(QUERY_KEYS.time, context.timestamp);
  else params.delete(QUERY_KEYS.time);

  if (context.selectedProfileId) params.set(QUERY_KEYS.profile, context.selectedProfileId);
  else params.delete(QUERY_KEYS.profile);

  const nextQuery = params.toString();
  const nextHash = `${route || "#/explore"}${nextQuery ? `?${nextQuery}` : ""}`;
  if (nextHash !== window.location.hash) {
    window.history.replaceState(window.history.state, "", nextHash);
  }
}

export function readScientificWorkspaceContext(): ScientificWorkspaceContext {
  const stored = readStoredContext();
  const linked = readLinkedContext();
  const timeContext = readScientificTimeContext();
  const activeBlock = resolveMainBlock(readActiveMainBlockId());
  const useTimeContext = timeIsNewer(timeContext, stored) && !linked.timestamp;

  const linkedOrStoredSource = linked.sourceMode ?? stored?.sourceMode;
  const linkedOrStoredVariable = linked.variable ?? stored?.variable;
  const sourceMode = validSource(linkedOrStoredSource) ? linkedOrStoredSource : DEFAULT_CONTEXT.sourceMode;
  const variable = validVariable(linkedOrStoredVariable) ? linkedOrStoredVariable : DEFAULT_CONTEXT.variable;

  return {
    ...DEFAULT_CONTEXT,
    ...stored,
    ...linked,
    sourceMode,
    variable,
    blockId: activeBlock.id,
    blockRegion: activeMainBlockRegion(activeBlock),
    blockMaterialization: activeBlock.materialization,
    timestamp: linked.timestamp ?? (useTimeContext ? timeContext?.timestamp ?? null : stored?.timestamp ?? null),
    timeIndex: useTimeContext ? timeContext?.timeIndex ?? null : stored?.timeIndex ?? null,
    timeKind: linked.timestamp ? "native" : useTimeContext ? timeContext?.timeKind ?? "unavailable" : stored?.timeKind ?? "unavailable",
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

  // Normal navigation keeps established clean route hashes such as #/explore.
  // Once a scientific query is explicitly active (deep link, block selector or
  // native-time URL), subsequent compatible workspace changes keep that query
  // synchronized instead of silently dropping its context.
  const hashAlreadyCarriesContext = window.location.hash.includes("?");
  if (hashAlreadyCarriesContext) {
    writeScientificContextToHash(next);
  }
  window.dispatchEvent(new CustomEvent<ScientificWorkspaceContext>(SCIENTIFIC_WORKSPACE_CONTEXT_EVENT, {
    detail: next
  }));
  return next;
}

export function buildScientificContextDeepLink(
  page: PageId,
  context: ScientificWorkspaceContext = readScientificWorkspaceContext()
): string {
  const params = new URLSearchParams();
  params.set(QUERY_KEYS.block, context.blockId);
  params.set(QUERY_KEYS.source, context.sourceMode);
  params.set(QUERY_KEYS.variable, context.variable);
  if (context.depthM != null) params.set(QUERY_KEYS.depth, String(context.depthM));
  if (context.timestamp) params.set(QUERY_KEYS.time, context.timestamp);
  if (context.selectedProfileId) params.set(QUERY_KEYS.profile, context.selectedProfileId);

  const base = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `${base}#/${page}?${params.toString()}`;
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

export function sourceLabel(
  source: ScientificSourceMode,
  blockMaterialization?: ScientificBlockMaterialization
): string {
  if (source === "incois") return "INCOIS operational";
  if (source === "chlorophyll") return "INCOIS chlorophyll";
  if (blockMaterialization === "pilot") return "GLORYS12V1 pilot block";
  return "GLORYS baseline";
}

export function variableLabel(variable: ScientificWorkspaceVariable): string {
  if (variable === "so") return "Salinity";
  if (variable === "currents") return "Currents";
  if (variable === "chlorophyll") return "Chlorophyll";
  return "Temperature";
}