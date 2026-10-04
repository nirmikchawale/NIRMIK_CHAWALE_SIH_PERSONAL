import type { CurrentsResponse, CurrentsVolumeResponse, FieldResponse, VolumeResponse } from "./types";

export type PilotOceanRelevance = "ocean" | "coastal" | "land";

export interface PilotBlockManifestEntry {
  id: string;
  row: number;
  column: number;
  west: number;
  east: number;
  south: number;
  north: number;
  region: string;
  ocean_fraction: number;
  ocean_relevance: PilotOceanRelevance;
  materialization: "pilot" | "planned";
  available_dates: string[];
  payloads: Array<{ date: string; path: string; sha256: string }>;
}

export interface PilotBlockManifest {
  schema: "oceancanvas-main-block-manifest-v1";
  phase: "3.5B";
  target_domain: {
    west: number;
    east: number;
    south: number;
    north: number;
    columns: number;
    rows: number;
    logical_block_count: number;
  };
  source: {
    origin_product: string;
    product_id: string;
    dataset_id: string;
    archive_provider: string;
    dates: string[];
    files: string[];
    time_semantics: "daily_mean";
    horizontal_stride: number;
    maximum_depth_m: number;
  };
  integrity: {
    logical_block_count: number;
    pilot_block_count: number;
    multi_date_pilot_count: number;
    land_blocks_materialized: number;
    synthetic_measurements: false;
    synthetic_timestamps: false;
    synthetic_coordinates: false;
    synthetic_depths: false;
    vertical_component_available: false;
  };
  pilot_ids: string[];
  multi_date_pilot_ids: string[];
  blocks: PilotBlockManifestEntry[];
}

interface PilotVariable {
  units: string;
  values: Array<number | null>;
  finite_count: number;
  minimum: number | null;
  maximum: number | null;
}

export interface PilotBlockPayload {
  schema: "oceancanvas-main-block-pilot-v1";
  block_id: string;
  region: string;
  bounds: { west: number; east: number; south: number; north: number };
  ocean_fraction: number;
  ocean_relevance: PilotOceanRelevance;
  time: string;
  time_semantics: "daily_mean";
  coordinates: {
    longitude: number[];
    latitude: number[];
    depth_m: number[];
    depth_positive: "down";
  };
  shape: { depth: number; latitude: number; longitude: number };
  variables: {
    thetao: PilotVariable;
    so: PilotVariable;
    uo: PilotVariable;
    vo: PilotVariable;
  };
  source: {
    origin_product: string;
    product_id: string;
    dataset_id: string;
    archive_provider: string;
    archive_file: string;
    service_url: string;
    horizontal_stride: number;
  };
  integrity: {
    source_values_modified: false;
    synthetic_measurements: false;
    synthetic_timestamps: false;
    synthetic_coordinates: false;
    synthetic_depths: false;
    vertical_component_available: false;
    land_fill_preserved_as_missing: true;
  };
}

const PILOT_BASE = `${import.meta.env.BASE_URL}main-blocks`.replace(/\/$/, "");

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Pilot main-block asset unavailable: ${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

export function fetchPilotMainBlockManifest(): Promise<PilotBlockManifest> {
  return fetchJson<PilotBlockManifest>(`${PILOT_BASE}/manifest.json`);
}

export async function fetchPilotMainBlock(
  blockId: string,
  date: string,
  manifest?: PilotBlockManifest
): Promise<PilotBlockPayload> {
  const inventory = manifest ?? await fetchPilotMainBlockManifest();
  const block = inventory.blocks.find((item) => item.id === blockId);
  if (!block || block.materialization !== "pilot") {
    throw new Error(`${blockId} is not a materialized Phase 3.5B pilot block.`);
  }
  const record = block.payloads.find((item) => item.date === date);
  if (!record) throw new Error(`${blockId} has no genuine source frame for ${date}.`);
  const payload = await fetchJson<PilotBlockPayload>(`${PILOT_BASE}/${record.path}`);
  if (payload.block_id !== blockId || payload.time.slice(0, 10) !== date) {
    throw new Error(`Pilot payload identity mismatch for ${blockId} ${date}.`);
  }
  if (
    payload.integrity.synthetic_measurements ||
    payload.integrity.synthetic_timestamps ||
    payload.integrity.synthetic_coordinates ||
    payload.integrity.synthetic_depths ||
    payload.integrity.vertical_component_available
  ) {
    throw new Error(`Pilot payload failed scientific-integrity policy for ${blockId} ${date}.`);
  }
  return payload;
}

function flatIndex(payload: PilotBlockPayload, depth: number, latitude: number, longitude: number): number {
  const { latitude: latCount, longitude: lonCount } = payload.shape;
  return depth * latCount * lonCount + latitude * lonCount + longitude;
}

function scalarMetadata(payload: PilotBlockPayload, variable: "thetao" | "so") {
  const source = payload.variables[variable];
  const label = variable === "thetao" ? "Temperature" : "Salinity";
  return {
    source,
    label,
    minimum: source.minimum ?? 0,
    maximum: source.maximum ?? 0
  };
}

export function pilotBlockVolume(payload: PilotBlockPayload, variable: "thetao" | "so"): VolumeResponse {
  const meta = scalarMetadata(payload, variable);
  const points: VolumeResponse["points"] = [];
  const { longitude, latitude, depth_m } = payload.coordinates;
  for (let d = 0; d < depth_m.length; d += 1) {
    for (let y = 0; y < latitude.length; y += 1) {
      for (let x = 0; x < longitude.length; x += 1) {
        const value = meta.source.values[flatIndex(payload, d, y, x)];
        if (typeof value === "number" && Number.isFinite(value)) {
          points.push([longitude[x], latitude[y], depth_m[d], value]);
        }
      }
    }
  }
  return {
    variable,
    label: meta.label,
    units: meta.source.units,
    time_index: 0,
    time: payload.time,
    points,
    minimum: meta.minimum,
    maximum: meta.maximum,
    depth_positive: "down",
    rendering_note: `Phase 3.5B genuine ${payload.source.origin_product} pilot ${payload.block_id}; land fill omitted, source values unchanged.`
  };
}

export function pilotBlockField(
  payload: PilotBlockPayload,
  variable: "thetao" | "so",
  depthIndex: number
): FieldResponse {
  if (depthIndex < 0 || depthIndex >= payload.coordinates.depth_m.length) {
    throw new Error(`Depth index ${depthIndex} is outside ${payload.block_id}.`);
  }
  const meta = scalarMetadata(payload, variable);
  const values: FieldResponse["values"] = [];
  for (let y = 0; y < payload.coordinates.latitude.length; y += 1) {
    const row: Array<number | null> = [];
    for (let x = 0; x < payload.coordinates.longitude.length; x += 1) {
      row.push(meta.source.values[flatIndex(payload, depthIndex, y, x)] ?? null);
    }
    values.push(row);
  }
  return {
    variable,
    label: meta.label,
    units: meta.source.units,
    time_index: 0,
    time: payload.time,
    depth_index: depthIndex,
    depth_m: payload.coordinates.depth_m[depthIndex],
    latitude: payload.coordinates.latitude,
    longitude: payload.coordinates.longitude,
    values,
    minimum: meta.minimum,
    maximum: meta.maximum,
    provenance: {
      product: payload.source.origin_product,
      dataset_id: payload.source.dataset_id,
      freshness_class: "historical_daily_reanalysis_pilot",
      runtime_mode: "static_checksum_verified_pilot"
    }
  };
}

export function pilotBlockCurrentsVolume(payload: PilotBlockPayload): CurrentsVolumeResponse {
  const vectors: CurrentsVolumeResponse["vectors"] = [];
  const { longitude, latitude, depth_m } = payload.coordinates;
  for (let d = 0; d < depth_m.length; d += 1) {
    for (let y = 0; y < latitude.length; y += 1) {
      for (let x = 0; x < longitude.length; x += 1) {
        const index = flatIndex(payload, d, y, x);
        const u = payload.variables.uo.values[index];
        const v = payload.variables.vo.values[index];
        if (typeof u === "number" && typeof v === "number" && Number.isFinite(u) && Number.isFinite(v)) {
          const speed = Math.hypot(u, v);
          vectors.push([longitude[x], latitude[y], depth_m[d], u, v, speed]);
        }
      }
    }
  }
  const speeds = vectors.map((item) => item[5]);
  return {
    variable: "currents",
    units: payload.variables.uo.units,
    time_index: 0,
    time: payload.time,
    vectors,
    minimum: speeds.length ? Math.min(...speeds) : 0,
    maximum: speeds.length ? Math.max(...speeds) : 0,
    depths_m: depth_m,
    depth_positive: "down",
    components: ["uo", "vo"],
    vertical_component_available: false,
    rendering_note: `Horizontal-current speed is derived as sqrt(uo²+vo²) from unchanged Phase 3.5B source components for ${payload.block_id}; no vertical component is available.`
  };
}

export function pilotBlockCurrents(payload: PilotBlockPayload, depthIndex: number): CurrentsResponse {
  if (depthIndex < 0 || depthIndex >= payload.coordinates.depth_m.length) {
    throw new Error(`Depth index ${depthIndex} is outside ${payload.block_id}.`);
  }
  const vectors: CurrentsResponse["vectors"] = [];
  for (let y = 0; y < payload.coordinates.latitude.length; y += 1) {
    for (let x = 0; x < payload.coordinates.longitude.length; x += 1) {
      const index = flatIndex(payload, depthIndex, y, x);
      const u = payload.variables.uo.values[index];
      const v = payload.variables.vo.values[index];
      if (typeof u === "number" && typeof v === "number" && Number.isFinite(u) && Number.isFinite(v)) {
        const speed = Math.hypot(u, v);
        vectors.push([payload.coordinates.longitude[x], payload.coordinates.latitude[y], u, v, speed]);
      }
    }
  }
  const speeds = vectors.map((item) => item[4]);
  return {
    variable: "currents",
    units: payload.variables.uo.units,
    time_index: 0,
    time: payload.time,
    depth_index: depthIndex,
    depth_m: payload.coordinates.depth_m[depthIndex],
    vectors,
    minimum: speeds.length ? Math.min(...speeds) : 0,
    maximum: speeds.length ? Math.max(...speeds) : 0,
    rendering_note: `Horizontal-current slice for genuine Phase 3.5B pilot ${payload.block_id}; speed derived from uo/vo only.`
  };
}
