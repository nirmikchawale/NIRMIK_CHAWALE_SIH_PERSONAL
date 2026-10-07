import type { ScientificMainBlock } from "./main-block-capabilities";

export const MAIN_BLOCK_TIME_INTEGRATION_VERSION = "3db-07-v1";

export interface NativeTimeAxisEvidence {
  timestampsUtc: readonly string[];
  availableDates?: readonly string[];
}

export interface ReadyMainBlockTimeIntegration {
  version: typeof MAIN_BLOCK_TIME_INTEGRATION_VERSION;
  blockId: string;
  materialization: ScientificMainBlock["materialization"];
  mode: "native-time";
  ready: true;
  timestampsUtc: readonly string[];
  dateCount: number;
  timeCount: number;
  canPlayback: boolean;
}

export interface LockedMainBlockTimeIntegration {
  version: typeof MAIN_BLOCK_TIME_INTEGRATION_VERSION;
  blockId: string;
  materialization: "planned";
  mode: "locked";
  ready: false;
  timestampsUtc: readonly [];
  dateCount: 0;
  timeCount: 0;
  canPlayback: false;
}

export type MainBlockTimeIntegration =
  | ReadyMainBlockTimeIntegration
  | LockedMainBlockTimeIntegration;

function canonicalUtc(value: string): string {
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) {
    throw new Error(`3DB-07 time contract: invalid native timestamp ${value}.`);
  }
  return new Date(millis).toISOString();
}

export function assertNativeTimeAxis(
  blockId: string,
  timestampsUtc: readonly string[],
  availableDates?: readonly string[]
): readonly string[] {
  if (timestampsUtc.length === 0) {
    throw new Error(`3DB-07 time contract: materialized block ${blockId} requires at least one genuine source timestamp.`);
  }
  if (availableDates && availableDates.length !== timestampsUtc.length) {
    throw new Error(
      `3DB-07 time contract: ${blockId} exposes ${timestampsUtc.length} timestamps but ${availableDates.length} manifest dates.`
    );
  }

  const retained = timestampsUtc.map((timestamp, index) => {
    if (!timestamp.endsWith("Z")) {
      throw new Error(`3DB-07 time contract: ${blockId} timestamp[${index}] must be explicit UTC (Z).`);
    }
    const normalized = canonicalUtc(timestamp);
    const normalizedInput = timestamp.includes(".000Z") ? timestamp : timestamp.replace(/Z$/, ".000Z");
    if (normalized !== normalizedInput) {
      throw new Error(`3DB-07 time contract: ${blockId} timestamp[${index}] is not a canonical native UTC instant.`);
    }
    if (availableDates && normalized.slice(0, 10) !== availableDates[index]) {
      throw new Error(`3DB-07 time contract: ${blockId} timestamp[${index}] does not match its manifest source date.`);
    }
    return timestamp;
  });

  for (let index = 1; index < retained.length; index += 1) {
    const previous = Date.parse(retained[index - 1]);
    const current = Date.parse(retained[index]);
    if (!(current > previous)) {
      throw new Error(`3DB-07 time contract: ${blockId} native timestamps must be strictly increasing and unique.`);
    }
  }
  return retained;
}

export function deriveMainBlockTimeIntegration(
  block: ScientificMainBlock,
  evidence?: NativeTimeAxisEvidence
): MainBlockTimeIntegration {
  if (block.materialization === "planned") {
    if (evidence?.timestampsUtc.length) {
      throw new Error(`3DB-07 time contract: planned block ${block.id} cannot receive scientific timestamps.`);
    }
    return {
      version: MAIN_BLOCK_TIME_INTEGRATION_VERSION,
      blockId: block.id,
      materialization: "planned",
      mode: "locked",
      ready: false,
      timestampsUtc: [],
      dateCount: 0,
      timeCount: 0,
      canPlayback: false
    };
  }

  if (!evidence) {
    throw new Error(`3DB-07 time contract: materialized block ${block.id} requires genuine native-time evidence.`);
  }
  const timestampsUtc = assertNativeTimeAxis(block.id, evidence.timestampsUtc, evidence.availableDates);
  const dateCount = new Set(timestampsUtc.map((timestamp) => timestamp.slice(0, 10))).size;
  return {
    version: MAIN_BLOCK_TIME_INTEGRATION_VERSION,
    blockId: block.id,
    materialization: block.materialization,
    mode: "native-time",
    ready: true,
    timestampsUtc,
    dateCount,
    timeCount: timestampsUtc.length,
    canPlayback: timestampsUtc.length > 1
  };
}

export function resolveNativeTimeSelection(
  blockId: string,
  timestampsUtc: readonly string[],
  timeIndex: number,
  availableDates?: readonly string[]
): { timeIndex: number; timestampUtc: string } {
  const axis = assertNativeTimeAxis(blockId, timestampsUtc, availableDates);
  if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex >= axis.length) {
    throw new Error(`3DB-07 time contract: time index ${timeIndex} is outside ${blockId}'s genuine native-time axis.`);
  }
  return { timeIndex, timestampUtc: axis[timeIndex] };
}
