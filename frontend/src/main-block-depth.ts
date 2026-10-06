import type { ScientificMainBlock } from "./main-block-capabilities";

export const MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION = "3db-06-v1";
const DEPTH_EPSILON_M = 1e-6;

export interface NativeDepthAxisEvidence {
  depthsM: readonly number[];
  depthPositive: "down";
  declaredLevelCount?: number;
}

export interface ReadyMainBlockDepthIntegration {
  version: typeof MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION;
  blockId: string;
  materialization: ScientificMainBlock["materialization"];
  mode: "native-multi-depth";
  ready: true;
  resolution: "payload-resolved" | "verified-runtime";
  depthPositive: "down";
  depthsM: readonly number[];
  levelCount: number;
  minimumM: number;
  maximumM: number;
}

export interface LockedMainBlockDepthIntegration {
  version: typeof MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION;
  blockId: string;
  materialization: "planned";
  mode: "locked";
  ready: false;
  resolution: "unavailable";
  depthPositive: null;
  depthsM: readonly [];
  levelCount: 0;
  minimumM: null;
  maximumM: null;
}

export type MainBlockDepthIntegration =
  | ReadyMainBlockDepthIntegration
  | LockedMainBlockDepthIntegration;

function assertFiniteNonNegativeDepth(blockId: string, value: number, index: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`3DB-06 depth contract: ${blockId} depth[${index}] must be a finite non-negative source metre.`);
  }
}

/**
 * Validate one native source depth axis without interpolation, resampling or
 * invented layers. The returned array is a defensive copy of the source axis.
 */
export function assertNativeDepthAxis(
  blockId: string,
  depthsM: readonly number[],
  depthPositive: string,
  declaredLevelCount?: number
): readonly number[] {
  if (depthPositive !== "down") {
    throw new Error(`3DB-06 depth contract: ${blockId} must use positive-down source depths.`);
  }
  if (depthsM.length < 2) {
    throw new Error(`3DB-06 depth contract: ${blockId} requires at least two genuine source depth levels.`);
  }
  if (declaredLevelCount != null && declaredLevelCount !== depthsM.length) {
    throw new Error(
      `3DB-06 depth contract: ${blockId} declares ${declaredLevelCount} depth levels but exposes ${depthsM.length}.`
    );
  }

  const retained = [...depthsM];
  retained.forEach((depthM, index) => assertFiniteNonNegativeDepth(blockId, depthM, index));
  for (let index = 1; index < retained.length; index += 1) {
    if (retained[index] <= retained[index - 1]) {
      throw new Error(`3DB-06 depth contract: ${blockId} native depths must be strictly increasing and unique.`);
    }
  }
  return retained;
}

/**
 * Resolve lifecycle-aware block depth capability from genuine runtime source
 * evidence. Planned blocks are deliberately depth-empty and fail closed.
 */
export function deriveMainBlockDepthIntegration(
  block: ScientificMainBlock,
  evidence?: NativeDepthAxisEvidence
): MainBlockDepthIntegration {
  if (block.materialization === "planned") {
    if (evidence?.depthsM.length) {
      throw new Error(`3DB-06 depth contract: planned block ${block.id} cannot receive scientific depth values.`);
    }
    return {
      version: MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION,
      blockId: block.id,
      materialization: "planned",
      mode: "locked",
      ready: false,
      resolution: "unavailable",
      depthPositive: null,
      depthsM: [],
      levelCount: 0,
      minimumM: null,
      maximumM: null
    };
  }

  if (!evidence) {
    throw new Error(`3DB-06 depth contract: materialized block ${block.id} requires genuine native depth evidence.`);
  }

  const depthsM = assertNativeDepthAxis(
    block.id,
    evidence.depthsM,
    evidence.depthPositive,
    evidence.declaredLevelCount
  );

  return {
    version: MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION,
    blockId: block.id,
    materialization: block.materialization,
    mode: "native-multi-depth",
    ready: true,
    resolution: block.materialization === "verified-baseline" ? "verified-runtime" : "payload-resolved",
    depthPositive: "down",
    depthsM,
    levelCount: depthsM.length,
    minimumM: depthsM[0],
    maximumM: depthsM[depthsM.length - 1]
  };
}

export function resolveNativeDepthSelection(
  blockId: string,
  depthsM: readonly number[],
  depthPositive: string,
  depthIndex: number,
  declaredLevelCount?: number
): { depthIndex: number; depthM: number } {
  const axis = assertNativeDepthAxis(blockId, depthsM, depthPositive, declaredLevelCount);
  if (!Number.isInteger(depthIndex) || depthIndex < 0 || depthIndex >= axis.length) {
    throw new Error(`3DB-06 depth contract: depth index ${depthIndex} is outside ${blockId}'s native source axis.`);
  }
  return { depthIndex, depthM: axis[depthIndex] };
}

export function assertExactNativeDepthAxisMatch(
  blockId: string,
  expectedDepthsM: readonly number[],
  actualDepthsM: readonly number[]
): void {
  if (expectedDepthsM.length !== actualDepthsM.length) {
    throw new Error(`3DB-06 depth contract: ${blockId} depth-axis level count changed across scientific surfaces.`);
  }
  for (let index = 0; index < expectedDepthsM.length; index += 1) {
    const expected = expectedDepthsM[index];
    const actual = actualDepthsM[index];
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > DEPTH_EPSILON_M) {
      throw new Error(`3DB-06 depth contract: ${blockId} depth[${index}] diverged from the native source axis.`);
    }
  }
}

export function assertNativeDepthSample(
  blockId: string,
  depthsM: readonly number[],
  depthM: number
): void {
  assertFiniteNonNegativeDepth(blockId, depthM, -1);
  const matched = depthsM.some((nativeDepthM) => Math.abs(nativeDepthM - depthM) <= DEPTH_EPSILON_M);
  if (!matched) {
    throw new Error(`3DB-06 depth contract: ${blockId} scientific sample uses a non-native depth ${depthM} m.`);
  }
}
