export type ScientificTimeKind = "native" | "interpolated" | "unavailable";

export interface ScientificTimeStep {
  index: number;
  timestamp: string;
  dateUtc: string;
  clockUtc: string;
  kind: ScientificTimeKind;
}

export interface ScientificTimeModel {
  steps: ScientificTimeStep[];
  dates: string[];
  selectedIndex: number;
  selectedStep: ScientificTimeStep | null;
  nativeCount: number;
  interpolatedCount: number;
  canPlayback: boolean;
  hasMultipleDates: boolean;
}

export interface ScientificTimeContextSnapshot {
  timestamp: string | null;
  dateUtc: string | null;
  timeIndex: number | null;
  timeKind: ScientificTimeKind;
  updatedAtUtc: string;
}

export const SCIENTIFIC_TIME_CONTEXT_EVENT = "oceancanvas:scientific-time-context";
export const SCIENTIFIC_TIME_CONTEXT_STORAGE_KEY = "oceancanvas-scientific-time-v1";
export const SCIENTIFIC_TIME_QUERY_KEY = "time";

function asIso(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function utcDate(value: string): string {
  const normalized = asIso(value);
  return normalized.includes("T") ? normalized.slice(0, 10) : normalized.slice(0, 10);
}

export function utcClock(value: string): string {
  const normalized = asIso(value);
  if (!normalized.includes("T")) return "UTC";
  return `${normalized.slice(11, 16)} UTC`;
}

export function formatScientificTimestamp(value: string): string {
  const normalized = asIso(value);
  if (!normalized.includes("T")) return normalized;
  return `${normalized.slice(0, 10)} · ${normalized.slice(11, 16)} UTC`;
}

export function buildScientificTimeModel(
  times: readonly string[],
  currentIndex: number,
  kinds?: readonly ScientificTimeKind[]
): ScientificTimeModel {
  const steps = times.map((timestamp, index) => ({
    index,
    timestamp,
    dateUtc: utcDate(timestamp),
    clockUtc: utcClock(timestamp),
    kind: kinds?.[index] ?? "native"
  }));
  const maximum = Math.max(0, steps.length - 1);
  const selectedIndex = Math.min(maximum, Math.max(0, currentIndex));
  const selectedStep = steps[selectedIndex] ?? null;
  const dates = Array.from(new Set(steps.map((step) => step.dateUtc)));
  const nativeCount = steps.filter((step) => step.kind === "native").length;
  const interpolatedCount = steps.filter((step) => step.kind === "interpolated").length;

  return {
    steps,
    dates,
    selectedIndex,
    selectedStep,
    nativeCount,
    interpolatedCount,
    canPlayback: steps.length > 1,
    hasMultipleDates: dates.length > 1
  };
}

export function resolveTimeIndex(times: readonly string[], requestedTimestamp: string | null): number | null {
  if (!requestedTimestamp) return null;
  const requestedIso = asIso(requestedTimestamp);
  const index = times.findIndex((time) => asIso(time) === requestedIso);
  return index >= 0 ? index : null;
}

export function readTimeFromHash(hash = window.location.hash): string | null {
  const query = hash.split("?")[1] ?? "";
  if (!query) return null;
  const params = new URLSearchParams(query);
  return params.get(SCIENTIFIC_TIME_QUERY_KEY);
}

export function writeTimeToHash(timestamp: string | null): void {
  const hash = window.location.hash || "#/explore";
  const [route, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);
  if (timestamp) params.set(SCIENTIFIC_TIME_QUERY_KEY, timestamp);
  else params.delete(SCIENTIFIC_TIME_QUERY_KEY);
  const nextQuery = params.toString();
  const nextHash = `${route || "#/explore"}${nextQuery ? `?${nextQuery}` : ""}`;
  if (nextHash !== window.location.hash) {
    window.history.replaceState(window.history.state, "", nextHash);
  }
}

export function publishScientificTimeContext(step: ScientificTimeStep | null): void {
  const snapshot: ScientificTimeContextSnapshot = {
    timestamp: step?.timestamp ?? null,
    dateUtc: step?.dateUtc ?? null,
    timeIndex: step?.index ?? null,
    timeKind: step?.kind ?? "unavailable",
    updatedAtUtc: new Date().toISOString()
  };

  try {
    window.sessionStorage.setItem(SCIENTIFIC_TIME_CONTEXT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // The live session remains functional when browser storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent<ScientificTimeContextSnapshot>(SCIENTIFIC_TIME_CONTEXT_EVENT, {
    detail: snapshot
  }));
}

export function readScientificTimeContext(): ScientificTimeContextSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(SCIENTIFIC_TIME_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScientificTimeContextSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (!["native", "interpolated", "unavailable"].includes(parsed.timeKind)) return null;
    return parsed;
  } catch {
    return null;
  }
}
