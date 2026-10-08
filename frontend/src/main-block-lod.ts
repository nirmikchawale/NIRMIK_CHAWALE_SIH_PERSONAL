/**
 * 3DB-12: presentation-only LOD for genuine model samples.
 * Indices always refer to existing payload elements. No interpolation, averaging,
 * fabricated coordinate, timestamp, depth or variable value is permitted.
 */
export const MAIN_BLOCK_LOD_VERSION = "3db-12-v1";

export function globePilotLodBudget(cameraHeightM: number): number {
  if (cameraHeightM > 3_000_000) return 1_200;
  if (cameraHeightM > 900_000) return 2_600;
  return 5_000;
}

export function waterColumnPilotLodBudget(zoom: number): number {
  if (zoom < 0.9) return 1_800;
  if (zoom < 1.3) return 3_200;
  return 5_200;
}

/**
 * Stable, depth-balanced selection from a source-backed full-volume array.
 * Depth is at tuple index 2 for both scalar points and current vectors.
 * Every existing native depth layer receives at least one exact sample.
 * We preserve source order and never mutate either the payload or its metadata.
 */
export function nativeDepthBalancedLodIndices(
  points: readonly (readonly number[])[],
  maximumSamples: number,
  focusDepthM?: number
): number[] {
  if (!Number.isSafeInteger(maximumSamples) || maximumSamples <= 0) {
    throw new Error("3DB-12 LOD: sample budget must be a positive integer.");
  }
  if (points.length <= maximumSamples) return points.map((_point, index) => index);

  const byDepth = new Map<number, number[]>();
  for (let i = 0; i < points.length; i += 1) {
    const depth = points[i][2];
    if (!Number.isFinite(depth) || depth < 0) {
      throw new Error("3DB-12 LOD: every source sample must have a finite positive-down depth.");
    }
    const layer = byDepth.get(depth);
    if (layer) layer.push(i);
    else byDepth.set(depth, [i]);
  }
  const layers = [...byDepth.entries()];
  // A native layer is never dropped merely to satisfy a presentation budget.
  const budget = Math.min(points.length, Math.max(maximumSamples, layers.length));
  const allocated = layers.map(() => 1);
  let available = budget - layers.length;

  // Preserve the entire selected native depth when it fits, without
  // inventing additional vertical samples for the unselected layers.
  const focusIndex = layers.findIndex(([depth]) => depth === focusDepthM);
  if (focusIndex >= 0) {
    const extra = Math.min(available, layers[focusIndex][1].length - 1);
    allocated[focusIndex] += extra;
    available -= extra;
  }

  // Water-fill remaining display capacity to retain coverage over all depths.
  while (available > 0) {
    let progressed = false;
    for (let i = 0; i < layers.length && available > 0; i += 1) {
      if (allocated[i] >= layers[i][1].length) continue;
      allocated[i] += 1;
      available -= 1;
      progressed = true;
    }
    if (!progressed) break;
  }

  const chosen: number[] = [];
  for (let i = 0; i < layers.length; i += 1) {
    const indices = layers[i][1];
    const count = allocated[i];
    if (count === 1) {
      chosen.push(indices[Math.floor((indices.length - 1) / 2)]);
    } else {
      for (let sample = 0; sample < count; sample += 1) {
        chosen.push(indices[Math.floor(sample * (indices.length - 1) / (count - 1))]);
      }
    }
  }
  return chosen.sort((a, b) => a - b);
}
