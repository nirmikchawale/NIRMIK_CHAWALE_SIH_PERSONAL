import { activeMainBlockRegion, readActiveMainBlockId, resolveMainBlock } from "./main-block-runtime";
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
