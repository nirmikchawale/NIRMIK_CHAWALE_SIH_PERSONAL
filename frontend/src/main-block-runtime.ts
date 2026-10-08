import {
  CURRENT_VERIFIED_BASELINE,
  INDIAN_OCEAN_MAIN_BLOCKS,
  type OceanMainBlock,
  type VerifiedBaselineBlock
} from "./main-block-engine";
import { deriveMainBlockCapabilities } from "./main-block-capabilities";
import { findGeographicMainBlockAt } from "./main-block-geography";
import { isOceanIntersectingMainBlockId } from "./main-block-ocean-mask";

export const ACTIVE_MAIN_BLOCK_STORAGE_KEY = "oceancanvas-active-main-block-v1";
export const ACTIVE_MAIN_BLOCK_EVENT = "oceancanvas:active-main-block";
export const ACTIVE_MAIN_BLOCK_QUERY_KEY = "block";
export const MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION = "3db-05-v1";

export const PHASE35B_PILOT_IDS = [
  "IO-001", "IO-002", "IO-015", "IO-016", "IO-031", "IO-038",
  "IO-045", "IO-046", "IO-052", "IO-053", "IO-065", "IO-075",
  "IO-089", "IO-091", "IO-096", "IO-103", "IO-105", "IO-110",
  "IO-115", "IO-116", "IO-119", "IO-121", "IO-129", "IO-133",
  "IO-029", "IO-082", "IO-066", "IO-059", "IO-122", "IO-130",
  "IO-030", "IO-124", "IO-067", "IO-060", "IO-123"
] as const;

export const PHASE35B_MULTI_DATE_PILOT_IDS = [
  "IO-001", "IO-016", "IO-045", "IO-053", "IO-115", "IO-119"
] as const;

const PILOT_ID_SET = new Set<string>(PHASE35B_PILOT_IDS);
const MULTI_DATE_PILOT_ID_SET = new Set<string>(PHASE35B_MULTI_DATE_PILOT_IDS);
const PILOT_PRIMARY_DATE = "2004-03-15";
const PILOT_SECONDARY_DATE = "2004-07-28";

export type ActiveMainBlock = OceanMainBlock | VerifiedBaselineBlock;
export type MainBlockWaterColumnMode = "scientific-volume" | "geographic-shell";

export interface MainBlockWaterColumnSyncContext {
  version: typeof MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION;
  blockId: string;
  materialization: ActiveMainBlock["materialization"];
  mode: MainBlockWaterColumnMode;
  geographicReady: boolean;
  waterColumnReady: boolean;
  scientificVolumeAllowed: boolean;
  evidenceClass: ReturnType<typeof deriveMainBlockCapabilities>["provenance"]["evidenceClass"];
  validationLevel: ReturnType<typeof deriveMainBlockCapabilities>["validation"]["level"];
  bounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  availableDates: readonly string[];
  sourceProduct: string | null;
}

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

function resolveSelectableMainBlock(id: string | null | undefined): ActiveMainBlock {
  if (id === CURRENT_VERIFIED_BASELINE.id) return CURRENT_VERIFIED_BASELINE;
  const block = INDIAN_OCEAN_MAIN_BLOCKS.find((candidate) => candidate.id === id);
  if (!block || !isOceanIntersectingMainBlockId(block.id)) return CURRENT_VERIFIED_BASELINE;
  return resolveMainBlock(block.id);
}

export function deriveMainBlockWaterColumnSyncContext(
  id: string | null | undefined
): MainBlockWaterColumnSyncContext {
  const block = resolveMainBlock(id);
  const capability = deriveMainBlockCapabilities(block);
  const scientificVolumeAllowed = capability.waterColumnReady && capability.materialized;
  return {
    version: MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION,
    blockId: block.id,
    materialization: block.materialization,
    mode: scientificVolumeAllowed ? "scientific-volume" : "geographic-shell",
    geographicReady: capability.geographicReady,
    waterColumnReady: capability.waterColumnReady,
    scientificVolumeAllowed,
    evidenceClass: capability.provenance.evidenceClass,
    validationLevel: capability.validation.level,
    bounds: capability.geographicBounds,
    availableDates: capability.availableTimes,
    sourceProduct: capability.provenance.sourceProduct
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
  return exact && isOceanIntersectingMainBlockId(exact.id) ? exact.id : null;
}

export function writeMainBlockToHash(id: string): void {
  const requested = resolveSelectableMainBlock(id);
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
    return resolveSelectableMainBlock(stored).id;
  } catch {
    return CURRENT_VERIFIED_BASELINE.id;
  }
}

export function publishActiveMainBlockId(id: string): string {
  const requested = resolveSelectableMainBlock(id);
  const previous = resolveSelectableMainBlock(readActiveMainBlockId());

  // Keep the full 140-cell geographic workflow selectable. Planned cells remain
  // geographic context only; api.ts deliberately falls back to verified evidence
  // unless the selected cell is one of the source-backed Phase 3.5B pilots.
  try {
    window.localStorage.setItem(ACTIVE_MAIN_BLOCK_STORAGE_KEY, requested.id);
  } catch {
    // Selection remains usable for this browser session when storage is unavailable.
  }
  writeMainBlockToHash(requested.id);

  // 3DB-07 removes the historical full-page source-context reload. Scientific
  // consumers now react to this event and refresh the catalog/payload family in
  // place. This keeps block selection continuous and prevents a block click from
  // unexpectedly replacing the whole application session.
  if (requested.id !== previous.id) {
    window.dispatchEvent(new CustomEvent<string>(ACTIVE_MAIN_BLOCK_EVENT, { detail: requested.id }));
  }
  return requested.id;
}

export function subscribeActiveMainBlock(listener: (id: string) => void): () => void {
  const onSelection = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail;
    listener(resolveSelectableMainBlock(detail).id);
  };
  window.addEventListener(ACTIVE_MAIN_BLOCK_EVENT, onSelection);
  return () => window.removeEventListener(ACTIVE_MAIN_BLOCK_EVENT, onSelection);
}

export function findTargetBlockAt(longitude: number, latitude: number): OceanMainBlock | null {
  const block = findGeographicMainBlockAt(longitude, latitude);
  return block && isOceanIntersectingMainBlockId(block.id) ? block : null;
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
