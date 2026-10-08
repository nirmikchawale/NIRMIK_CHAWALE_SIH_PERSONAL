import type { CurrentsResponse, CurrentsVolumeResponse, FieldResponse, VolumeResponse } from "./types";

/**
 * MPR-14 read-only UI integrity gate. Payload data is never transformed.
 * Every rendered field must match the exact canonical variable, native
 * timestamp/index and (for geographic slices) native depth coordinate.
 */
export interface LinkedViewSelection {
  sourceId: string;
  mainBlockId: string;
  mainBlockRevision: number;
  variable: string;
  timeIndex: number;
  time: string;
  depthIndex: number;
  depthM: number;
}

export function linkedSelectionKey(s: LinkedViewSelection): string {
  return JSON.stringify([
    s.sourceId, s.mainBlockId, s.mainBlockRevision, s.variable,
    s.timeIndex, s.time, s.depthIndex, s.depthM
  ]);
}

export function sameNativeTimestamp(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;
  if (actual === expected) return true;
  const a = Date.parse(actual);
  const e = Date.parse(expected);
  return Number.isFinite(a) && Number.isFinite(e) && a === e;
}

function matchingTime(payload: { time: string; time_index: number }, selection: LinkedViewSelection): boolean {
  return payload.time_index === selection.timeIndex &&
    sameNativeTimestamp(payload.time, selection.time);
}

export function matchesGeographicPayload(
  payload: FieldResponse | CurrentsResponse | null,
  selection: LinkedViewSelection
): boolean {
  if (!payload || payload.variable !== selection.variable) return false;
  if (!matchingTime(payload, selection) ||
      payload.depth_index !== selection.depthIndex ||
      !Number.isFinite(payload.depth_m) ||
      !Number.isFinite(selection.depthM) ||
      Math.abs(payload.depth_m - selection.depthM) > 0.011) return false;
  if ("provenance" in payload &&
      payload.provenance.dataset_id &&
      payload.provenance.dataset_id !== selection.sourceId) {
    return false;
  }
  return true;
}

export function matchesWaterColumnPayload(
  payload: VolumeResponse | CurrentsVolumeResponse | null,
  selection: LinkedViewSelection
): boolean {
  return payload !== null &&
    payload.variable === selection.variable &&
    matchingTime(payload, selection) &&
    payload.depth_positive === "down" &&
    (("points" in payload && payload.points.length > 0) ||
     ("vectors" in payload && payload.vectors.length > 0));
}
