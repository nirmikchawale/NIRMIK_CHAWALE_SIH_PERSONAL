import type {
  ImportedObservationProfile,
  ImportedObservationRecord,
  ImportedSensorType
} from "./types";

export const IMPORTED_OBSERVATIONS_KEY = "oceantwin-imported-observations-v1";
export const IMPORTED_OBSERVATIONS_EVENT = "oceantwin-imported-observations-updated";

const SENSOR_TYPES = new Set<ImportedSensorType>(["argo", "glider", "ctd", "bgc", "other"]);

function sensorType(value: unknown): ImportedSensorType {
  const normalized = String(value ?? "").trim().toLowerCase();
  return SENSOR_TYPES.has(normalized as ImportedSensorType)
    ? (normalized as ImportedSensorType)
    : "other";
}

// Never turn missing provider values into fabricated scientific zeros.
const DECIMAL_MEASUREMENT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

function finite(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!DECIMAL_MEASUREMENT.test(trimmed)) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

export function sanitizeImportedObservationRecords(input: unknown): ImportedObservationRecord[] {
  if (!Array.isArray(input)) return [];
  const output: ImportedObservationRecord[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const longitude = finite(row.longitude);
    const latitude = finite(row.latitude);
    const depth = finite(row.depth_m);
    const value = finite(row.value);
    const timestamp = String(row.timestamp ?? "").trim();
    const variable = String(row.variable ?? "").trim();
    const units = String(row.units ?? "").trim();
    const source = String(row.source ?? "").trim();
    const platformId = String(row.platform_id ?? "").trim();
    if (
      longitude == null || latitude == null || depth == null || value == null ||
      longitude < -180 || longitude > 180 ||
      latitude < -90 || latitude > 90 ||
      depth < 0 ||
      !timestamp || !Number.isFinite(Date.parse(timestamp)) ||
      !variable || !units || !source || !platformId
    ) continue;
    output.push({
      longitude,
      latitude,
      depth_m: depth,
      timestamp: new Date(timestamp).toISOString(),
      variable,
      value,
      units,
      source,
      platform_id: platformId,
      sensor_type: sensorType(row.sensor_type),
      qc_flag: row.qc_flag ? String(row.qc_flag) : undefined,
      dataset_id: row.dataset_id ? String(row.dataset_id) : undefined
    });
  }
  return output;
}

export function readImportedObservationRecords(): ImportedObservationRecord[] {
  try {
    const raw = window.sessionStorage.getItem(IMPORTED_OBSERVATIONS_KEY);
    return raw ? sanitizeImportedObservationRecords(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function writeImportedObservationRecords(records: ImportedObservationRecord[]): void {
  const sanitized = sanitizeImportedObservationRecords(records);
  window.sessionStorage.setItem(IMPORTED_OBSERVATIONS_KEY, JSON.stringify(sanitized));
  window.dispatchEvent(new Event(IMPORTED_OBSERVATIONS_EVENT));
}

export function clearImportedObservationRecords(): void {
  window.sessionStorage.removeItem(IMPORTED_OBSERVATIONS_KEY);
  window.dispatchEvent(new Event(IMPORTED_OBSERVATIONS_EVENT));
}

export function groupImportedObservationProfiles(
  records: ImportedObservationRecord[]
): ImportedObservationProfile[] {
  const groups = new Map<string, ImportedObservationRecord[]>();
  for (const row of records) {
    const key = [row.sensor_type, row.platform_id, row.timestamp, row.longitude, row.latitude].join("|");
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([id, group]) => {
    const first = group[0];
    return {
      id,
      platform_id: first.platform_id,
      sensor_type: first.sensor_type,
      longitude: first.longitude,
      latitude: first.latitude,
      timestamp: first.timestamp,
      source: first.source,
      dataset_id: first.dataset_id,
      variables: [...new Set(group.map((row) => row.variable))].sort((a, b) => {
        const priority = (value: string) => {
          const key = value.toLowerCase();
          if (key.includes("temp")) return 0;
          if (key.includes("sal")) return 1;
          if (key.includes("chlor") || key === "chla") return 2;
          if (key.includes("oxygen") || key === "doxy") return 3;
          return 10;
        };
        return priority(a) - priority(b) || a.localeCompare(b);
      }),
      records: [...group].sort((a, b) => a.depth_m - b.depth_m)
    };
  });
}
