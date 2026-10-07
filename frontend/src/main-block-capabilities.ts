import type { OceanMainBlock, VerifiedBaselineBlock } from "./main-block-engine";

export type ScientificMainBlock = OceanMainBlock | VerifiedBaselineBlock;

export type MainBlockLifecycleStatus =
  | "planned"
  | "discovered"
  | "source-available"
  | "materializing"
  | "validated"
  | "render-ready"
  | "deployed";

export type MainBlockValidationLevel =
  | "none"
  | "source-integrity-renderer"
  | "model-observation";

export interface MainBlockDepthRange {
  minimumM: number | null;
  maximumM: number | null;
  levelCount: number | null;
  resolution: "verified-registry" | "payload-resolved" | "unavailable";
}

export interface MainBlockValidation {
  level: MainBlockValidationLevel;
  sourceIntegrityValidated: boolean;
  rendererAcceptanceValidated: boolean;
  modelObservationValidated: boolean;
}

export interface MainBlockObservationCapabilityEvidence {
  observationsAvailable: boolean;
  modelObservationValidated: boolean;
}

export interface MainBlockCapabilityContract {
  id: string;
  name: string;
  lifecycleStatus: MainBlockLifecycleStatus;
  logicalExists: true;
  dataAvailable: boolean;
  materialized: boolean;
  scientificallyValidated: boolean;
  geographicBounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  geographicReady: boolean;
  cesiumReady: boolean;
  waterColumnReady: boolean;
  renderReady: boolean;
  availableVariables: ReadonlyArray<"thetao" | "so" | "currents">;
  availableTimes: ReadonlyArray<string>;
  depthRange: MainBlockDepthRange;
  observationsAvailable: boolean;
  provenance: {
    sourceProduct: string | null;
    evidenceClass: "immutable-verified-baseline" | "checksum-verified-pilot" | "none";
  };
  validation: MainBlockValidation;
  limitations: ReadonlyArray<string>;
}

/**
 * 3DB-00 canonical capability projection.
 *
 * This deliberately separates a block's logical/geographic existence from scientific
 * readiness. A planned block always has valid bounds, but it never gains data,
 * variables, times, renderer readiness, observation claims, or provenance merely
 * because the logical grid contains its ID.
 *
 * "Scientifically validated" here means the evidence needed to render the source
 * without fabrication has passed the existing integrity/renderer gates. Independent
 * model-observation validation is tracked separately and is true only for the
 * immutable verified baseline.
 */
function isVerifiedBaselineBlock(block: ScientificMainBlock): block is VerifiedBaselineBlock {
  return "depthLevels" in block
    && block.id === "BASE-GLORYS-001"
    && block.materialization === "verified-baseline";
}

export function deriveMainBlockCapabilities(
  block: ScientificMainBlock,
  observationEvidence?: MainBlockObservationCapabilityEvidence
): MainBlockCapabilityContract {
  const isBaseline = isVerifiedBaselineBlock(block);
  const isPilot = !isBaseline && block.materialization === "pilot";
  const sourceBacked = isBaseline || isPilot;

  if (!isBaseline && observationEvidence?.modelObservationValidated) {
    throw new Error(
      "Observation context cannot promote a non-baseline main block to model-observation validated."
    );
  }

  const validation: MainBlockValidation = isBaseline
    ? {
        level: "model-observation",
        sourceIntegrityValidated: true,
        rendererAcceptanceValidated: true,
        modelObservationValidated: true
      }
    : isPilot
      ? {
          level: "source-integrity-renderer",
          sourceIntegrityValidated: true,
          rendererAcceptanceValidated: true,
          modelObservationValidated: false
        }
      : {
          level: "none",
          sourceIntegrityValidated: false,
          rendererAcceptanceValidated: false,
          modelObservationValidated: false
        };

  const geographicReady = Number.isFinite(block.west)
    && Number.isFinite(block.east)
    && Number.isFinite(block.south)
    && Number.isFinite(block.north)
    && block.west < block.east
    && block.south < block.north;

  const cesiumReady = sourceBacked && geographicReady && validation.rendererAcceptanceValidated;
  const waterColumnReady = sourceBacked && geographicReady && validation.rendererAcceptanceValidated;
  const renderReady = sourceBacked
    && validation.sourceIntegrityValidated
    && cesiumReady
    && waterColumnReady;

  const depthRange: MainBlockDepthRange = isBaseline
    ? {
        minimumM: 0.49402499198913574,
        maximumM: 453.9377136230469,
        levelCount: block.depthLevels,
        resolution: "verified-registry"
      }
    : isPilot
      ? {
          minimumM: null,
          maximumM: null,
          levelCount: null,
          resolution: "payload-resolved"
        }
      : {
          minimumM: null,
          maximumM: null,
          levelCount: null,
          resolution: "unavailable"
        };

  const limitations = isBaseline
    ? [
        "One immutable verified model timestamp is available; baseline playback is not a multi-time claim."
      ]
    : isPilot
      ? [
          "No independent Argo/model-observation validation is attached to this pilot block.",
          "Exact retained depth coordinates resolve from the checksum-verified payload at load time.",
          "Only horizontal current components uo/vo are available; no vertical velocity is claimed."
        ]
      : [
          "Logical/geographic target only: no genuine materialized scientific payload is available.",
          "Scientific Cesium and Water Column rendering must remain locked until source evidence is materialized and validated."
        ];

  return {
    id: block.id,
    name: isBaseline ? block.label : `${block.id} · ${block.region}`,
    lifecycleStatus: sourceBacked ? "render-ready" : "planned",
    logicalExists: true,
    dataAvailable: sourceBacked,
    materialized: sourceBacked,
    scientificallyValidated: validation.sourceIntegrityValidated,
    geographicBounds: {
      west: block.west,
      east: block.east,
      south: block.south,
      north: block.north
    },
    geographicReady,
    cesiumReady,
    waterColumnReady,
    renderReady,
    availableVariables: sourceBacked ? [...block.variables] : [],
    availableTimes: sourceBacked ? [...block.availableDates] : [],
    depthRange,
    observationsAvailable: observationEvidence?.observationsAvailable ?? isBaseline,
    provenance: {
      sourceProduct: sourceBacked ? block.sourceProduct : null,
      evidenceClass: isBaseline
        ? "immutable-verified-baseline"
        : isPilot
          ? "checksum-verified-pilot"
          : "none"
    },
    validation,
    limitations
  };
}

export function canRenderMainBlock(block: ScientificMainBlock): boolean {
  return deriveMainBlockCapabilities(block).renderReady;
}
