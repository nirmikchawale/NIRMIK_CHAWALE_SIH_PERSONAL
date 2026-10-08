import { deriveMainBlockCapabilities, type ScientificMainBlock } from "./main-block-capabilities";
import type { CurrentsResponse, FieldResponse, VolumeResponse } from "./types";

export const MAIN_BLOCK_CESIUM_RENDERER_VERSION = "3db-04-v1";
export const MAIN_BLOCK_GLORYS_DATASET_ID = "cmems_mod_glo_phy_my_0.083deg_P1D-m";
const COORDINATE_EPSILON_DEGREES = 1e-6;
const SPEED_EPSILON = 1e-8;

export type CesiumScientificRenderKind = "scalar-slice" | "scalar-volume" | "horizontal-currents";
export type CesiumScientificScope = "main-block" | "external-source";

export interface CesiumRenderExtent {
  west: number;
  east: number;
  south: number;
  north: number;
  minimumDepthM: number;
  maximumDepthM: number;
}

type MainBlockLifecycleStatus = ReturnType<typeof deriveMainBlockCapabilities>["lifecycleStatus"];
type MainBlockEvidenceClass = ReturnType<typeof deriveMainBlockCapabilities>["provenance"]["evidenceClass"];

interface CesiumRenderPlanBase {
  scientificScope: CesiumScientificScope;
  blockId: string | null;
  blockName: string;
  kind: CesiumScientificRenderKind;
  materialization: ScientificMainBlock["materialization"] | "external-source";
  lifecycleStatus: MainBlockLifecycleStatus | "source-backed-external";
  evidenceClass: MainBlockEvidenceClass | "external-source";
  geographicBounds: ReturnType<typeof deriveMainBlockCapabilities>["geographicBounds"];
}

export interface BlockedCesiumRenderPlan extends CesiumRenderPlanBase {
  allowed: false;
  reason: string;
}

export interface AllowedCesiumRenderPlan extends CesiumRenderPlanBase {
  allowed: true;
  variable: string;
  sourceTime: string;
  sourceDate: string;
  sampleCount: number;
  extent: CesiumRenderExtent;
  nativeCoordinatesPreserved: true;
  nativeDepthPreserved: true;
  horizontalCurrentOnly: boolean;
}

export type CesiumMainBlockRenderPlan = BlockedCesiumRenderPlan | AllowedCesiumRenderPlan;

function blockedPlan(
  block: ScientificMainBlock,
  kind: CesiumScientificRenderKind,
  reason = "Scientific Cesium rendering is locked until genuine source evidence is materialized and renderer-accepted."
): BlockedCesiumRenderPlan {
  const capability = deriveMainBlockCapabilities(block);
  return {
    allowed: false,
    scientificScope: "main-block",
    blockId: capability.id,
    blockName: capability.name,
    kind,
    materialization: block.materialization,
    lifecycleStatus: capability.lifecycleStatus,
    evidenceClass: capability.provenance.evidenceClass,
    geographicBounds: capability.geographicBounds,
    reason
  };
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`3DB-04 Cesium contract: ${name} must be finite.`);
}

function assertCoordinateInsideBlock(
  block: ScientificMainBlock,
  longitude: number,
  latitude: number
): void {
  assertFinite("longitude", longitude);
  assertFinite("latitude", latitude);
  const { west, east, south, north } = block;
  if (
    longitude < west - COORDINATE_EPSILON_DEGREES ||
    longitude > east + COORDINATE_EPSILON_DEGREES ||
    latitude < south - COORDINATE_EPSILON_DEGREES ||
    latitude > north + COORDINATE_EPSILON_DEGREES
  ) {
    throw new Error(
      `3DB-04 Cesium contract: source coordinate ${longitude},${latitude} falls outside ${block.id} canonical bounds.`
    );
  }
}

function assertDepth(depthM: number): void {
  assertFinite("depth", depthM);
  if (depthM < 0) throw new Error("3DB-04 Cesium contract: source depth must use positive-down non-negative metres.");
}

function sourceDate(time: string): string {
  const date = time.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`3DB-04 Cesium contract: invalid source time ${time}.`);
  }
  return date;
}

function assertTimeAvailable(block: ScientificMainBlock, time: string): string {
  const capability = deriveMainBlockCapabilities(block);
  const date = sourceDate(time);
  if (!capability.availableTimes.includes(date)) {
    throw new Error(`3DB-04 Cesium contract: ${date} is not a genuine available date for ${block.id}.`);
  }
  return date;
}

function assertVariableAvailable(
  block: ScientificMainBlock,
  variable: string
): "thetao" | "so" | "currents" {
  if (variable !== "thetao" && variable !== "so" && variable !== "currents") {
    throw new Error(`3DB-04 Cesium contract: unsupported scientific variable ${variable}.`);
  }
  const capability = deriveMainBlockCapabilities(block);
  if (!capability.availableVariables.includes(variable)) {
    throw new Error(`3DB-04 Cesium contract: ${variable} is unavailable for ${block.id}.`);
  }
  return variable;
}

function extentFromCoordinates(
  longitudes: number[],
  latitudes: number[],
  depths: number[]
): CesiumRenderExtent {
  if (!longitudes.length || !latitudes.length || !depths.length) {
    throw new Error("3DB-04 Cesium contract: render extent cannot be derived from empty native coordinates.");
  }
  longitudes.forEach((value) => assertFinite("longitude", value));
  latitudes.forEach((value) => assertFinite("latitude", value));
  depths.forEach(assertDepth);
  return {
    west: Math.min(...longitudes),
    east: Math.max(...longitudes),
    south: Math.min(...latitudes),
    north: Math.max(...latitudes),
    minimumDepthM: Math.min(...depths),
    maximumDepthM: Math.max(...depths)
  };
}

function allowedBase(
  block: ScientificMainBlock,
  kind: CesiumScientificRenderKind
): Omit<AllowedCesiumRenderPlan, "variable" | "sourceTime" | "sourceDate" | "sampleCount" | "extent" | "horizontalCurrentOnly"> {
  const capability = deriveMainBlockCapabilities(block);
  return {
    allowed: true,
    scientificScope: "main-block",
    blockId: capability.id,
    blockName: capability.name,
    kind,
    materialization: block.materialization,
    lifecycleStatus: capability.lifecycleStatus,
    evidenceClass: capability.provenance.evidenceClass,
    geographicBounds: capability.geographicBounds,
    nativeCoordinatesPreserved: true,
    nativeDepthPreserved: true
  };
}

function validateScalarFieldSamples(field: FieldResponse): { sampleCount: number; extent: CesiumRenderExtent } {
  assertDepth(field.depth_m);
  if (!field.longitude.length || !field.latitude.length) {
    throw new Error("3DB-04 Cesium contract: scalar field has no native horizontal coordinates.");
  }
  if (field.values.length !== field.latitude.length) {
    throw new Error("3DB-04 Cesium contract: scalar field latitude/value shape mismatch.");
  }
  let sampleCount = 0;
  for (const row of field.values) {
    if (row.length !== field.longitude.length) {
      throw new Error("3DB-04 Cesium contract: scalar field longitude/value shape mismatch.");
    }
    for (const value of row) {
      if (value == null) continue;
      assertFinite("scalar value", value);
      sampleCount += 1;
    }
  }
  if (sampleCount === 0) throw new Error("3DB-04 Cesium contract: scalar field contains no finite source samples.");
  return {
    sampleCount,
    extent: extentFromCoordinates(field.longitude, field.latitude, [field.depth_m])
  };
}

/**
 * The 3DB block contract governs GLORYS main-block payloads only. INCOIS
 * operational/chlorophyll and other genuine overlays retain their own source
 * identity and must not inherit GLORYS block dates, variables or validation.
 */
export function isMainBlockGlorysField(field: FieldResponse): boolean {
  return field.provenance.dataset_id === MAIN_BLOCK_GLORYS_DATASET_ID;
}

export function canCesiumRenderMainBlock(block: ScientificMainBlock): boolean {
  return deriveMainBlockCapabilities(block).cesiumReady;
}

export function buildCesiumFieldRenderPlan(
  block: ScientificMainBlock,
  field: FieldResponse
): CesiumMainBlockRenderPlan {
  const date = sourceDate(field.time);
  const validated = validateScalarFieldSamples(field);

  if (!isMainBlockGlorysField(field)) {
    return {
      allowed: true,
      scientificScope: "external-source",
      blockId: null,
      blockName: `${field.provenance.product} · ${field.provenance.dataset_id}`,
      kind: "scalar-slice",
      materialization: "external-source",
      lifecycleStatus: "source-backed-external",
      evidenceClass: "external-source",
      geographicBounds: {
        west: validated.extent.west,
        east: validated.extent.east,
        south: validated.extent.south,
        north: validated.extent.north
      },
      variable: field.variable,
      sourceTime: field.time,
      sourceDate: date,
      sampleCount: validated.sampleCount,
      extent: validated.extent,
      nativeCoordinatesPreserved: true,
      nativeDepthPreserved: true,
      horizontalCurrentOnly: false
    };
  }

  if (!canCesiumRenderMainBlock(block)) return blockedPlan(block, "scalar-slice");

  const variable = assertVariableAvailable(block, field.variable);
  if (variable === "currents") {
    throw new Error("3DB-04 Cesium contract: scalar field renderer cannot accept current vectors.");
  }
  assertTimeAvailable(block, field.time);
  for (const longitude of field.longitude) {
    for (const latitude of field.latitude) assertCoordinateInsideBlock(block, longitude, latitude);
  }

  return {
    ...allowedBase(block, "scalar-slice"),
    variable,
    sourceTime: field.time,
    sourceDate: date,
    sampleCount: validated.sampleCount,
    extent: validated.extent,
    horizontalCurrentOnly: false
  };
}

export function buildCesiumVolumeRenderPlan(
  block: ScientificMainBlock,
  volume: VolumeResponse
): CesiumMainBlockRenderPlan {
  if (!canCesiumRenderMainBlock(block)) return blockedPlan(block, "scalar-volume");

  const variable = assertVariableAvailable(block, volume.variable);
  if (variable === "currents") {
    throw new Error("3DB-04 Cesium contract: scalar volume renderer cannot accept current vectors.");
  }
  const date = assertTimeAvailable(block, volume.time);
  if (volume.depth_positive !== "down") {
    throw new Error("3DB-04 Cesium contract: scalar volume depth axis must be positive down.");
  }
  if (!volume.points.length) throw new Error("3DB-04 Cesium contract: scalar volume contains no finite source samples.");

  const longitudes: number[] = [];
  const latitudes: number[] = [];
  const depths: number[] = [];
  for (const [longitude, latitude, depthM, value] of volume.points) {
    assertCoordinateInsideBlock(block, longitude, latitude);
    assertDepth(depthM);
    assertFinite("scalar value", value);
    longitudes.push(longitude);
    latitudes.push(latitude);
    depths.push(depthM);
  }

  return {
    ...allowedBase(block, "scalar-volume"),
    variable,
    sourceTime: volume.time,
    sourceDate: date,
    sampleCount: volume.points.length,
    extent: extentFromCoordinates(longitudes, latitudes, depths),
    horizontalCurrentOnly: false
  };
}

export function buildCesiumCurrentsRenderPlan(
  block: ScientificMainBlock,
  currents: CurrentsResponse
): CesiumMainBlockRenderPlan {
  if (!canCesiumRenderMainBlock(block)) return blockedPlan(block, "horizontal-currents");

  if (assertVariableAvailable(block, currents.variable) !== "currents") {
    throw new Error("3DB-13 Cesium contract: horizontal-current vectors require the currents variable.");
  }
  const date = assertTimeAvailable(block, currents.time);
  assertDepth(currents.depth_m);
  if (!currents.vectors.length) {
    throw new Error("3DB-04 Cesium contract: horizontal-current slice contains no finite source vectors.");
  }

  const longitudes: number[] = [];
  const latitudes: number[] = [];
  for (const [longitude, latitude, u, v, speed] of currents.vectors) {
    assertCoordinateInsideBlock(block, longitude, latitude);
    assertFinite("zonal current uo", u);
    assertFinite("meridional current vo", v);
    assertFinite("horizontal current speed", speed);
    const expectedSpeed = Math.hypot(u, v);
    const tolerance = Math.max(SPEED_EPSILON, expectedSpeed * 1e-6);
    if (Math.abs(speed - expectedSpeed) > tolerance) {
      throw new Error("3DB-04 Cesium contract: current speed must be derived only from native uo/vo components.");
    }
    longitudes.push(longitude);
    latitudes.push(latitude);
  }

  return {
    ...allowedBase(block, "horizontal-currents"),
    variable: "currents",
    sourceTime: currents.time,
    sourceDate: date,
    sampleCount: currents.vectors.length,
    extent: extentFromCoordinates(longitudes, latitudes, [currents.depth_m]),
    horizontalCurrentOnly: true
  };
}
