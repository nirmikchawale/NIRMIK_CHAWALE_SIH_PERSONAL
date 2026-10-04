import type {
  AnomalyResponse,
  Catalog,
  ConnectorRegistryResponse,
  CurrentsResponse,
  CurrentsVolumeResponse,
  FieldResponse,
  IncoisChlorophyllSnapshot,
  IncoisOperationalSnapshot,
  ProfileDetail,
  ProfilesResponse,
  ProvenanceResponse,
  TelemetryDepthStat,
  TelemetryResponse,
  TelemetryTimeStat,
  VerifiedObservationPack,
  VolumeResponse
} from "./types";
import {
  fetchPilotMainBlock,
  fetchPilotMainBlockManifest,
  pilotBlockCurrents,
  pilotBlockCurrentsVolume,
  pilotBlockField,
  pilotBlockVolume,
  type PilotBlockManifest,
  type PilotBlockManifestEntry,
  type PilotBlockPayload
} from "./pilot-main-block-loader";
import { isPhase35bPilotId, readActiveMainBlockId } from "./main-block-runtime";

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8000")
).replace(/\/$/, "");

export const STATIC_SCIENCE = import.meta.env.VITE_STATIC_SCIENCE === "true";
const STATIC_BASE = `${import.meta.env.BASE_URL}science-static`.replace(/\/$/, "");
const PILOT_MODEL_DOI = "10.48670/moi-00021";
const PILOT_ARGO_PROVIDER = "Ifremer Argo GDAC";
const ROBUST_Z_THRESHOLD = 3.5;
const ROBUST_Z_NORMALIZER = 0.67448975;

let pilotManifestPromise: Promise<PilotBlockManifest> | null = null;
const pilotPayloadPromises = new Map<string, Promise<PilotBlockPayload>>();

function safeProfileId(profileId: string): string {
  return profileId.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "profile";
}

async function getJson<T>(path: string, staticPath: string): Promise<T> {
  const target = STATIC_SCIENCE
    ? `${STATIC_BASE}${staticPath}`
    : `${API_BASE}${path}`;

  const response = await fetch(target, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

function activePilotId(): string | null {
  const id = readActiveMainBlockId();
  return isPhase35bPilotId(id) ? id : null;
}

async function pilotManifest(): Promise<PilotBlockManifest> {
  if (!pilotManifestPromise) pilotManifestPromise = fetchPilotMainBlockManifest();
  return pilotManifestPromise;
}

async function pilotEntry(id: string, manifest?: PilotBlockManifest): Promise<PilotBlockManifestEntry> {
  const inventory = manifest ?? await pilotManifest();
  const entry = inventory.blocks.find((block) => block.id === id && block.materialization === "pilot");
  if (!entry) throw new Error(`${id} is not a source-backed Phase 3.5B pilot.`);
  return entry;
}

async function pilotPayload(id: string, timeIndex: number): Promise<PilotBlockPayload> {
  const manifest = await pilotManifest();
  const entry = await pilotEntry(id, manifest);
  const date = entry.available_dates[timeIndex];
  if (!date) throw new Error(`Time index ${timeIndex} is outside ${id}'s genuine source frames.`);
  const key = `${id}:${date}`;
  let promise = pilotPayloadPromises.get(key);
  if (!promise) {
    promise = fetchPilotMainBlock(id, date, manifest);
    pilotPayloadPromises.set(key, promise);
  }
  return promise;
}

async function allPilotPayloads(id: string): Promise<PilotBlockPayload[]> {
  const manifest = await pilotManifest();
  const entry = await pilotEntry(id, manifest);
  return Promise.all(entry.available_dates.map((_date, index) => pilotPayload(id, index)));
}

function finite(values: Array<number | null>): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function scalarStats(values: number[]) {
  if (values.length === 0) {
    return { count: 0, mean: 0, minimum: 0, maximum: 0, std: 0, p10: 0, p50: 0, p90: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    count: values.length,
    mean,
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1],
    std: Math.sqrt(variance),
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9)
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

function payloadDepthValues(payload: PilotBlockPayload, variable: "thetao" | "so", depthIndex: number): number[] {
  if (depthIndex < 0 || depthIndex >= payload.shape.depth) {
    throw new Error(`Depth index ${depthIndex} is outside ${payload.block_id}.`);
  }
  const planeSize = payload.shape.latitude * payload.shape.longitude;
  const start = depthIndex * planeSize;
  return finite(payload.variables[variable].values.slice(start, start + planeSize));
}

function currentSummary(payload: PilotBlockPayload, depthIndex: number): TelemetryResponse["current_summary"] {
  if (depthIndex < 0 || depthIndex >= payload.shape.depth) return null;
  const planeSize = payload.shape.latitude * payload.shape.longitude;
  const start = depthIndex * planeSize;
  const end = start + planeSize;
  const speeds: number[] = [];
  const us: number[] = [];
  const vs: number[] = [];
  for (let index = start; index < end; index += 1) {
    const u = payload.variables.uo.values[index];
    const v = payload.variables.vo.values[index];
    if (typeof u !== "number" || typeof v !== "number" || !Number.isFinite(u) || !Number.isFinite(v)) continue;
    us.push(u);
    vs.push(v);
    speeds.push(Math.hypot(u, v));
  }
  if (speeds.length === 0) return null;
  return {
    count: speeds.length,
    mean_speed: speeds.reduce((sum, value) => sum + value, 0) / speeds.length,
    maximum_speed: Math.max(...speeds),
    mean_u: us.reduce((sum, value) => sum + value, 0) / us.length,
    mean_v: vs.reduce((sum, value) => sum + value, 0) / vs.length,
    units: payload.variables.uo.units
  };
}

async function buildPilotCatalog(id: string): Promise<Catalog> {
  const manifest = await pilotManifest();
  const entry = await pilotEntry(id, manifest);
  const payloads = await allPilotPayloads(id);
  const first = payloads[0];
  if (!first) throw new Error(`${id} has no source-backed payload.`);

  const thetaMin = Math.min(...payloads.map((payload) => payload.variables.thetao.minimum ?? Number.POSITIVE_INFINITY));
  const thetaMax = Math.max(...payloads.map((payload) => payload.variables.thetao.maximum ?? Number.NEGATIVE_INFINITY));
  const saltMin = Math.min(...payloads.map((payload) => payload.variables.so.minimum ?? Number.POSITIVE_INFINITY));
  const saltMax = Math.max(...payloads.map((payload) => payload.variables.so.maximum ?? Number.NEGATIVE_INFINITY));
  const currentSpeeds: number[] = [];
  for (const payload of payloads) {
    for (let index = 0; index < payload.variables.uo.values.length; index += 1) {
      const u = payload.variables.uo.values[index];
      const v = payload.variables.vo.values[index];
      if (typeof u === "number" && typeof v === "number" && Number.isFinite(u) && Number.isFinite(v)) {
        currentSpeeds.push(Math.hypot(u, v));
      }
    }
  }

  return {
    dataset: {
      label: `${id} · ${entry.region}`,
      product: first.source.origin_product,
      dataset_id: first.source.dataset_id,
      doi: PILOT_MODEL_DOI,
      source: `${first.source.archive_provider} · ${first.source.service_url}`,
      title: `Ocean Canvas source-backed pilot main block ${id}`,
      region: `${entry.region} · ${entry.west}–${entry.east}°E · ${entry.south}–${entry.north}°N`,
      demo_date: entry.available_dates[0] ?? first.time.slice(0, 10),
      freshness_class: "historical_daily_reanalysis_pilot",
      runtime_mode: "static_checksum_verified_pilot"
    },
    coordinates: {
      longitude: first.coordinates.longitude,
      latitude: first.coordinates.latitude,
      depth: first.coordinates.depth_m,
      depth_units: "m",
      depth_positive: first.coordinates.depth_positive,
      time: payloads.map((payload) => payload.time)
    },
    variables: [
      {
        id: "thetao",
        label: "Temperature",
        kind: "scalar",
        units: first.variables.thetao.units,
        minimum: Number.isFinite(thetaMin) ? thetaMin : 0,
        maximum: Number.isFinite(thetaMax) ? thetaMax : 0
      },
      {
        id: "so",
        label: "Salinity",
        kind: "scalar",
        units: first.variables.so.units,
        minimum: Number.isFinite(saltMin) ? saltMin : 0,
        maximum: Number.isFinite(saltMax) ? saltMax : 0
      },
      {
        id: "currents",
        label: "Horizontal current speed",
        kind: "vector",
        units: first.variables.uo.units,
        components: ["uo", "vo"],
        minimum: currentSpeeds.length ? Math.min(...currentSpeeds) : 0,
        maximum: currentSpeeds.length ? Math.max(...currentSpeeds) : 0
      }
    ],
    capabilities: {
      scalar_3d: true,
      depth_slice: true,
      current_vectors: true,
      time_steps: payloads.length,
      time_animation: payloads.length > 1,
      argo_profiles: false,
      offline_scientific_data: true,
      streamlit_fallback: true
    },
    scientific_disclaimer: (
      `${id} is a genuine Phase 3.5B GLORYS12V1 pilot main block. Values, source coordinates, ` +
      "depths and native daily timestamps are retained from the accepted source payloads; land fill remains missing, " +
      "horizontal current speed is derived only from source uo/vo, and no synthetic measurements or timestamps are introduced."
    )
  };
}

async function buildPilotTelemetry(
  id: string,
  variable: "thetao" | "so",
  timeIndex: number,
  depthIndex: number
): Promise<TelemetryResponse> {
  const payloads = await allPilotPayloads(id);
  const selected = payloads[timeIndex];
  if (!selected) throw new Error(`Time index ${timeIndex} is outside ${id}.`);
  if (depthIndex < 0 || depthIndex >= selected.coordinates.depth_m.length) {
    throw new Error(`Depth index ${depthIndex} is outside ${id}.`);
  }

  const depthStats: TelemetryDepthStat[] = selected.coordinates.depth_m.map((depthM, index) => ({
    depth_index: index,
    depth_m: depthM,
    ...scalarStats(payloadDepthValues(selected, variable, index))
  }));
  const timeStats: TelemetryTimeStat[] = payloads.map((payload, index) => ({
    time_index: index,
    time: payload.time,
    ...scalarStats(payloadDepthValues(payload, variable, depthIndex))
  }));

  return {
    variable,
    label: variable === "thetao" ? "Temperature" : "Salinity",
    units: selected.variables[variable].units,
    time_index: timeIndex,
    time: selected.time,
    selected_depth_index: depthIndex,
    selected_depth_m: selected.coordinates.depth_m[depthIndex],
    depth_positive: selected.coordinates.depth_positive,
    depth_stats: depthStats,
    time_stats: timeStats,
    time_series_available: payloads.length > 1,
    current_summary: currentSummary(selected, depthIndex),
    spatial_grid: {
      longitude_count: selected.coordinates.longitude.length,
      latitude_count: selected.coordinates.latitude.length,
      finite_cell_statistics: "unweighted finite source model grid cells"
    },
    provenance: {
      product: selected.source.origin_product,
      dataset_id: selected.source.dataset_id,
      freshness_class: "historical_daily_reanalysis_pilot",
      runtime_mode: "static_checksum_verified_pilot"
    },
    statistic_definition: (
      "Depth summaries use unweighted finite source model grid cells at each exact retained depth for the selected genuine source timestamp. " +
      "Time summaries use the same statistic at the selected exact source depth for each genuinely materialized pilot timestamp. " +
      "No temporal, vertical or spatial samples are synthesized."
    )
  };
}

async function buildPilotAnomaly(
  id: string,
  variable: "thetao" | "so",
  timeIndex: number,
  depthIndex: number
): Promise<AnomalyResponse> {
  const payloads = await allPilotPayloads(id);
  const selected = payloads[timeIndex];
  if (!selected) throw new Error(`Time index ${timeIndex} is outside ${id}.`);
  if (depthIndex < 0 || depthIndex >= selected.coordinates.depth_m.length) {
    throw new Error(`Depth index ${depthIndex} is outside ${id}.`);
  }

  const planeSize = selected.shape.latitude * selected.shape.longitude;
  const start = depthIndex * planeSize;
  const raw = selected.variables[variable].values.slice(start, start + planeSize);
  const values = finite(raw);
  if (values.length === 0) throw new Error(`No finite ${variable} values are available at the selected pilot depth.`);
  const spatialMedian = median(values);
  const deviations = values.map((value) => Math.abs(value - spatialMedian));
  const mad = median(deviations);
  const flags: AnomalyResponse["spatial_screen"]["flags"] = [];

  if (mad > 0) {
    for (let y = 0; y < selected.shape.latitude; y += 1) {
      for (let x = 0; x < selected.shape.longitude; x += 1) {
        const value = raw[y * selected.shape.longitude + x];
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        const robustZ = ROBUST_Z_NORMALIZER * (value - spatialMedian) / mad;
        if (Math.abs(robustZ) >= ROBUST_Z_THRESHOLD) {
          flags.push({
            longitude: selected.coordinates.longitude[x],
            latitude: selected.coordinates.latitude[y],
            depth_m: selected.coordinates.depth_m[depthIndex],
            value,
            robust_z: robustZ
          });
        }
      }
    }
  }
  flags.sort((a, b) => Math.abs(b.robust_z) - Math.abs(a.robust_z));

  return {
    variable,
    label: variable === "thetao" ? "Temperature" : "Salinity",
    units: selected.variables[variable].units,
    time_index: timeIndex,
    time: selected.time,
    depth_index: depthIndex,
    depth_m: selected.coordinates.depth_m[depthIndex],
    method: {
      name: "median absolute deviation robust z-score",
      formula: "0.67448975 × (x − median) / MAD",
      absolute_threshold: ROBUST_Z_THRESHOLD,
      two_sided: true,
      zero_mad_policy: "fail closed: no robust score or flag is produced when MAD is zero"
    },
    spatial_screen: {
      scope: "finite source model grid cells at the exact selected retained depth and genuine pilot timestamp",
      sample_count: values.length,
      median: spatialMedian,
      mad,
      screen_available: mad > 0,
      flagged_count: flags.length,
      flags: flags.slice(0, 60)
    },
    residual_screen: {
      scope: `No independently matched Argo residual bundle is attached to Phase 3.5B pilot ${id}.`,
      temperature_only: true,
      profiles_screened: 0,
      sample_count: 0,
      flagged_count: 0,
      profile_statistics: [],
      flags: []
    },
    temporal_screen: {
      available: false,
      genuine_time_count: payloads.length,
      status: "locked",
      reason: (
        `Temporal anomaly screening is disabled for ${id} because this pilot contains ${payloads.length} genuine timestamp(s). ` +
        "At least three genuine timestamps are required before a robust temporal screen is scientifically meaningful."
      )
    },
    provenance: {
      product: selected.source.origin_product,
      dataset_id: selected.source.dataset_id,
      freshness_class: "historical_daily_reanalysis_pilot",
      runtime_mode: "static_checksum_verified_pilot",
      argo_provider: "Not linked for this pilot block"
    },
    interpretation: (
      "Flags are explainable statistical extremes within the selected source-backed pilot field. They are not proof of an ocean event, " +
      "sensor fault, forecast anomaly, or independent validation result."
    )
  };
}

export async function fetchIncoisOperational(): Promise<IncoisOperationalSnapshot> {
  const target = `${import.meta.env.BASE_URL}operational/incois-argo-10d-vam.json`;
  const response = await fetch(target, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`INCOIS operational snapshot unavailable: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<IncoisOperationalSnapshot>;
}

export async function fetchIncoisChlorophyll(): Promise<IncoisChlorophyllSnapshot> {
  const target = `${import.meta.env.BASE_URL}operational/incois-chlorophyll.json`;
  const response = await fetch(target, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`INCOIS chlorophyll snapshot unavailable: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<IncoisChlorophyllSnapshot>;
}

export async function fetchVerifiedObservationPack(): Promise<VerifiedObservationPack> {
  const target = `${import.meta.env.BASE_URL}observations/verified-profiles.json`;
  const response = await fetch(target, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Verified observation pack unavailable: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<VerifiedObservationPack>;
}

export const api = {
  health: () => getJson<Record<string, unknown>>("/api/health", "/health.json"),
  catalog: async () => {
    const id = activePilotId();
    return id ? buildPilotCatalog(id) : getJson<Catalog>("/api/catalog", "/catalog.json");
  },
  connectors: () => getJson<ConnectorRegistryResponse>("/api/connectors", "/connectors.json"),
  profiles: async (): Promise<ProfilesResponse> => {
    if (activePilotId()) return { provider: PILOT_ARGO_PROVIDER, doi: "10.17882/42182", profiles: [] };
    return getJson<ProfilesResponse>("/api/profiles", "/profiles/index.json");
  },
  provenance: async (): Promise<ProvenanceResponse> => {
    const id = activePilotId();
    if (!id) return getJson<ProvenanceResponse>("/api/provenance", "/provenance.json");
    const [base, payload] = await Promise.all([
      getJson<ProvenanceResponse>("/api/provenance", "/provenance.json"),
      pilotPayload(id, 0)
    ]);
    return {
      ...base,
      model: {
        ...base.model,
        label: `${id} source-backed GLORYS12V1 pilot`,
        product: payload.source.origin_product,
        dataset_id: payload.source.dataset_id,
        doi: PILOT_MODEL_DOI,
        file: payload.source.archive_file,
        freshness_class: "historical_daily_reanalysis_pilot",
        runtime_mode: "static_checksum_verified_pilot"
      },
      quality_control: {
        ...base.quality_control,
        matched_profiles: 0
      },
      methodology: {
        ...base.methodology,
        horizontal: "Exact retained source coordinates inside the selected materialized pilot block.",
        depth: "Exact retained source depth levels; no vertical interpolation is added by Phase 3.5D.",
        time: { policy: "Exact genuine source daily timestamp(s) materialized for the selected pilot." }
      },
      integrity: {
        ...base.integrity,
        source_checksums_unchanged: true,
        no_synthetic_measurements_in_outputs: true
      },
      scientific_disclaimer: (
        `${id} uses source-backed Phase 3.5B GLORYS12V1 evidence. No independent Argo comparison is attached to this pilot block; ` +
        "model–observation metrics shown for the baseline must not be interpreted as validation of this pilot."
      )
    };
  },
  profile: async (profileId: string): Promise<ProfileDetail> => {
    if (activePilotId()) throw new Error("Argo comparison profiles are not attached to the active Phase 3.5B pilot block.");
    return getJson<ProfileDetail>(
      `/api/profiles/${encodeURIComponent(profileId)}`,
      `/profiles/${safeProfileId(profileId)}.json`
    );
  },
  field: async (variable: "thetao" | "so", timeIndex: number, depthIndex: number): Promise<FieldResponse> => {
    const id = activePilotId();
    if (id) return pilotBlockField(await pilotPayload(id, timeIndex), variable, depthIndex);
    return getJson<FieldResponse>(
      `/api/field?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}&stride=1`,
      `/fields/${variable}/t${timeIndex}_d${depthIndex}.json`
    );
  },
  volume: async (variable: "thetao" | "so", timeIndex: number): Promise<VolumeResponse> => {
    const id = activePilotId();
    if (id) return pilotBlockVolume(await pilotPayload(id, timeIndex), variable);
    return getJson<VolumeResponse>(
      `/api/volume?variable=${variable}&time_index=${timeIndex}&horizontal_stride=2&depth_stride=1`,
      `/volumes/${variable}/t${timeIndex}.json`
    );
  },
  telemetry: async (variable: "thetao" | "so", timeIndex: number, depthIndex: number): Promise<TelemetryResponse> => {
    const id = activePilotId();
    if (id) return buildPilotTelemetry(id, variable, timeIndex, depthIndex);
    return getJson<TelemetryResponse>(
      `/api/telemetry?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}`,
      `/telemetry/${variable}/t${timeIndex}_d${depthIndex}.json`
    );
  },
  anomalies: async (variable: "thetao" | "so", timeIndex: number, depthIndex: number): Promise<AnomalyResponse> => {
    const id = activePilotId();
    if (id) return buildPilotAnomaly(id, variable, timeIndex, depthIndex);
    return getJson<AnomalyResponse>(
      `/api/anomalies?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}`,
      `/anomalies/${variable}/t${timeIndex}_d${depthIndex}.json`
    );
  },
  currents: async (timeIndex: number, depthIndex: number): Promise<CurrentsResponse> => {
    const id = activePilotId();
    if (id) return pilotBlockCurrents(await pilotPayload(id, timeIndex), depthIndex);
    return getJson<CurrentsResponse>(
      `/api/currents?time_index=${timeIndex}&depth_index=${depthIndex}&stride=2`,
      `/currents/t${timeIndex}_d${depthIndex}.json`
    );
  },
  currentsVolume: async (timeIndex: number): Promise<CurrentsVolumeResponse> => {
    const id = activePilotId();
    if (id) return pilotBlockCurrentsVolume(await pilotPayload(id, timeIndex));
    return getJson<CurrentsVolumeResponse>(
      `/api/currents-volume?time_index=${timeIndex}&horizontal_stride=4&depth_stride=1`,
      `/currents-volume/t${timeIndex}.json`
    );
  }
};

/**
 * Connector links that point at this project's own API (e.g. "/ogc/wms") only exist when the
 * FastAPI backend is deployed. On the static GitHub Pages build they would 404, so callers
 * receive null and render the link as unavailable instead of broken.
 */
export function resolveServiceUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("/")) return url;
  return STATIC_SCIENCE ? null : `${API_BASE}${url}`;
}
