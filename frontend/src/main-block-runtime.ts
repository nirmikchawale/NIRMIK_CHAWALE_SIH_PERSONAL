import {
  CURRENT_VERIFIED_BASELINE,
  INDIAN_OCEAN_MAIN_BLOCKS,
  type OceanMainBlock,
  type VerifiedBaselineBlock
} from "./main-block-engine";

export const ACTIVE_MAIN_BLOCK_STORAGE_KEY = "oceancanvas-active-main-block-v1";
export const ACTIVE_MAIN_BLOCK_EVENT = "oceancanvas:active-main-block";
export const ACTIVE_MAIN_BLOCK_QUERY_KEY = "block";

export const PHASE35B_PILOT_IDS = [
  "IO-001", "IO-002", "IO-015", "IO-016", "IO-031", "IO-038",
  "IO-045", "IO-046", "IO-052", "IO-053", "IO-065", "IO-075",
  "IO-089", "IO-091", "IO-096", "IO-103", "IO-105", "IO-110",
  "IO-115", "IO-116", "IO-119", "IO-121", "IO-129", "IO-133"
] as const;

export const PHASE35B_MULTI_DATE_PILOT_IDS = [
  "IO-001", "IO-016", "IO-045", "IO-053", "IO-115", "IO-119"
] as const;

const PILOT_ID_SET = new Set<string>(PHASE35B_PILOT_IDS);
const MULTI_DATE_PILOT_ID_SET = new Set<string>(PHASE35B_MULTI_DATE_PILOT_IDS);
const PILOT_PRIMARY_DATE = "2004-03-15";
const PILOT_SECONDARY_DATE = "2004-07-28";

export type ActiveMainBlock = OceanMainBlock | VerifiedBaselineBlock;

export function isPhase35bPilotId(id: string | null | undefined): id is string {
  return typeof id === "string" && PILOT_ID_SET.has(id);
}

export function pilotAvailableDates(id: string): readonly string[] {
  if (!isPhase35bPilotId(id)) return [];
  return MULTI_DATE_PILOT_ID_SET.has(id)
    ? [PILOT_PRIMARY_DATE, PILOT_SECONDARY_DATE]
    : [PILOT_PRIMARY_DATE];
}

export function resolveMainBlock(id: string | null | undefined): ActiveMainBlock {
  if (id === CURRENT_VERIFIED_BASELINE.id) return CURRENT_VERIFIED_BASELINE;
  const block = INDIAN_OCEAN_MAIN_BLOCKS.find((candidate) => candidate.id === id);
  if (!block) return CURRENT_VERIFIED_BASELINE;
  if (!isPhase35bPilotId(block.id)) return block;

  const dates = pilotAvailableDates(block.id);
  return {
    ...block,
    materialization: "pilot",
    sourceProduct: "Copernicus Marine / Mercator Ocean GLORYS12V1",
    availableDates: dates,
    nativeTimesUtc: dates.map((date) => `${date}T12:00:00Z`)
  };
}

function hashParams(hash = window.location.hash): URLSearchParams {
  const query = hash.split("?")[1] ?? "";
  return new URLSearchParams(query);
}

export function readMainBlockFromHash(hash = window.location.hash): string | null {
  const requested = hashParams(hash).get(ACTIVE_MAIN_BLOCK_QUERY_KEY);
  if (!requested) return null;

  if (requested === CURRENT_VERIFIED_BASELINE.id) return requested;
  const exact = INDIAN_OCEAN_MAIN_BLOCKS.find((candidate) => candidate.id === requested);
  return exact?.id ?? null;
}

export function writeMainBlockToHash(id: string): void {
  const requested = resolveMainBlock(id);
  const hash = window.location.hash || "#/explore";
  const [route, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);
  params.set(ACTIVE_MAIN_BLOCK_QUERY_KEY, requested.id);
  const nextQuery = params.toString();
  const nextHash = `${route || "#/explore"}${nextQuery ? `?${nextQuery}` : ""}`;
  if (nextHash !== window.location.hash) {
    window.history.replaceState(window.history.state, "", nextHash);
  }
}

export function readActiveMainBlockId(): string {
  const linked = readMainBlockFromHash();
  if (linked) {
    // A valid scientific/geographic deep link becomes the session's active block
    // so normal workspace navigation may clean the URL without silently resetting
    // the selected block. This persists only the existing block identity; planned
    // cells remain planned and never gain scientific payload status.
    try {
      window.localStorage.setItem(ACTIVE_MAIN_BLOCK_STORAGE_KEY, linked);
    } catch {
      // The linked selection remains valid for the current URL when storage is blocked.
    }
    return linked;
  }

  try {
    const stored = window.localStorage.getItem(ACTIVE_MAIN_BLOCK_STORAGE_KEY);
    return resolveMainBlock(stored).id;
  } catch {
    return CURRENT_VERIFIED_BASELINE.id;
  }
}

export function publishActiveMainBlockId(id: string): string {
  const requested = resolveMainBlock(id);
  const previous = resolveMainBlock(readActiveMainBlockId());

  // Keep the full 140-cell geographic workflow selectable. Planned cells remain
  // geographic context only; api.ts deliberately falls back to verified evidence
  // unless the selected cell is one of the source-backed Phase 3.5B pilots.
  try {
    window.localStorage.setItem(ACTIVE_MAIN_BLOCK_STORAGE_KEY, requested.id);
  } catch {
    // Selection remains usable for this browser session when storage is unavailable.
  }
  writeMainBlockToHash(requested.id);

  // Switching into or out of a source-backed pilot changes the actual scientific
  // payload family. App.tsx builds its catalog once at startup, so perform one
  // deterministic reload for those source-context transitions. Do not emit the
  // in-session selection event before that reload: doing so would briefly advertise
  // a new scientific block while the renderer still owns the previous payload family.
  // Non-reloading geographic/baseline changes remain immediate.
  const sourceContextChanged =
    requested.id !== previous.id &&
    (requested.materialization === "pilot" || previous.materialization === "pilot");
  if (sourceContextChanged) {
    window.setTimeout(() => window.location.reload(), 40);
  } else {
    window.dispatchEvent(new CustomEvent<string>(ACTIVE_MAIN_BLOCK_EVENT, { detail: requested.id }));
  }
  return requested.id;
}

export function subscribeActiveMainBlock(listener: (id: string) => void): () => void {
  const onSelection = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail;
    listener(resolveMainBlock(detail).id);
  };
  window.addEventListener(ACTIVE_MAIN_BLOCK_EVENT, onSelection);
  return () => window.removeEventListener(ACTIVE_MAIN_BLOCK_EVENT, onSelection);
}

export function findTargetBlockAt(longitude: number, latitude: number): OceanMainBlock | null {
  return INDIAN_OCEAN_MAIN_BLOCKS.find((block) =>
    longitude >= block.west && longitude <= block.east &&
    latitude >= block.south && latitude <= block.north
  ) ?? null;
}

export function activeMainBlockRegion(block: ActiveMainBlock): string {
  return "region" in block ? block.region : "Verified GLORYS baseline";
}

/**
 * Legacy compatibility guard used by the pre-3.5B WaterColumn/OceanGlobe components.
 * Historically "verified baseline" was the only materialized state, so those renderers
 * used this function as their "may render scientific volume" gate. Phase 3.5D keeps the
 * exported name to avoid a high-risk renderer rewrite, but now returns true for either
 * the original verified baseline or a source-backed pilot. Callers that need to
 * distinguish them must inspect block.materialization directly. The type-guard shape is
 * retained only so the legacy WaterColumn planned-shell branch continues to narrow safely;
 * no pilot-specific logic relies on baseline-only fields after the guard.
 */
export function isVerifiedBaseline(block: ActiveMainBlock): block is VerifiedBaselineBlock {
  return block.materialization === "verified-baseline" || block.materialization === "pilot";
}

export function isMaterializedMainBlock(block: ActiveMainBlock): boolean {
  return block.materialization === "verified-baseline" || block.materialization === "pilot";
}
