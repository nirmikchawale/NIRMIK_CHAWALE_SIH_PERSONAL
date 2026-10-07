import type {
  ImportedObservationProfile,
  ImportedSensorType,
  ProfileSummary
} from "./types";
import type {
  OceanMainBlock,
  VerifiedBaselineBlock
} from "./main-block-engine";
import { blockOwnsCoordinate } from "./main-block-geography";

export const MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION = "3db-09-v1";

export type MainBlockObservationEvidenceClass =
  | "independent-model-observation"
  | "spatial-context-only"
  | "none";

export type MainBlockObservationEvidenceRole =
  | "independent-model-observation"
  | "spatial-context";

export type MainBlockObservationSourceClass =
  | "verified-argo-comparison"
  | "verified-observation-pack";

export type ObservationAwareMainBlock = OceanMainBlock | VerifiedBaselineBlock;

export interface MainBlockObservationLink {
  id: string;
  profileId: string;
  platformId: string;
  sensorType: ImportedSensorType;
  longitude: number;
  latitude: number;
  timestamp: string;
  variables: readonly string[];
  source: string;
  datasetId: string | null;
  sourceClass: MainBlockObservationSourceClass;
  evidenceRole: MainBlockObservationEvidenceRole;
  independentlyComparedToActiveModel: boolean;
}

export interface MainBlockObservationIntegration {
  version: typeof MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION;
  blockId: string;
  materialization: ObservationAwareMainBlock["materialization"];
  observationsAvailable: boolean;
  observationCount: number;
  independentComparisonCount: number;
  spatialContextCount: number;
  sensorTypes: readonly ImportedSensorType[];
  evidenceClass: MainBlockObservationEvidenceClass;
  modelObservationValidated: boolean;
  links: readonly MainBlockObservationLink[];
  limitations: readonly string[];
}

export interface MainBlockObservationEvidence {
  comparisonProfiles?: readonly ProfileSummary[];
  verifiedProfiles?: readonly ImportedObservationProfile[];
}

function isVerifiedBaseline(block: ObservationAwareMainBlock): block is VerifiedBaselineBlock {
  return block.id === "BASE-GLORYS-001" && block.materialization === "verified-baseline";
}

function finiteCoordinate(longitude: number, latitude: number): boolean {
  return Number.isFinite(longitude)
    && Number.isFinite(latitude)
    && longitude >= -180
    && longitude <= 180
    && latitude >= -90
    && latitude <= 90;
}

function baselineOwnsCoordinate(
  block: VerifiedBaselineBlock,
  longitude: number,
  latitude: number
): boolean {
  return finiteCoordinate(longitude, latitude)
    && longitude >= block.west
    && longitude <= block.east
    && latitude >= block.south
    && latitude <= block.north;
}

function observationInsideBlock(
  block: ObservationAwareMainBlock,
  longitude: number,
  latitude: number
): boolean {
  if (!finiteCoordinate(longitude, latitude)) return false;
  return isVerifiedBaseline(block)
    ? baselineOwnsCoordinate(block, longitude, latitude)
    : blockOwnsCoordinate(block, longitude, latitude);
}

function validTimestamp(value: string): boolean {
  return Boolean(value) && Number.isFinite(Date.parse(value));
}

function argoComparisonLink(
  block: ObservationAwareMainBlock,
  profile: ProfileSummary
): MainBlockObservationLink | null {
  if (
    !observationInsideBlock(block, profile.observation_longitude, profile.observation_latitude)
    || !validTimestamp(profile.observation_time_utc)
  ) {
    return null;
  }

  const attachedToActiveBaseline = isVerifiedBaseline(block);
  return {
    id: "argo-comparison:" + profile.profile_id,
    profileId: profile.profile_id,
    platformId: profile.platform_id,
    sensorType: "argo",
    longitude: profile.observation_longitude,
    latitude: profile.observation_latitude,
    timestamp: profile.observation_time_utc,
    variables: ["temperature"],
    source: "Ifremer Argo GDAC / verified GLORYS12V1 comparison",
    datasetId: "Argo GDAC",
    sourceClass: "verified-argo-comparison",
    evidenceRole: attachedToActiveBaseline ? "independent-model-observation" : "spatial-context",
    independentlyComparedToActiveModel: attachedToActiveBaseline
  };
}

function verifiedProfileLink(
  block: ObservationAwareMainBlock,
  profile: ImportedObservationProfile
): MainBlockObservationLink | null {
  if (
    !observationInsideBlock(block, profile.longitude, profile.latitude)
    || !validTimestamp(profile.timestamp)
  ) {
    return null;
  }

  return {
    id: "verified-profile:" + profile.id,
    profileId: profile.id,
    platformId: profile.platform_id,
    sensorType: profile.sensor_type,
    longitude: profile.longitude,
    latitude: profile.latitude,
    timestamp: profile.timestamp,
    variables: [...profile.variables],
    source: profile.source,
    datasetId: profile.dataset_id ?? null,
    sourceClass: "verified-observation-pack",
    evidenceRole: "spatial-context",
    independentlyComparedToActiveModel: false
  };
}

/**
 * 3DB-09 observation/block integration.
 *
 * Geographic co-location is intentionally weaker than scientific validation.
 * Verified Argo comparison profiles count as independent model-observation
 * evidence only while the active scientific block is the immutable baseline
 * they were actually compared against. The same Argo profile, or any verified
 * Glider/CTD/BGC profile, may be associated with another logical block only as
 * spatial context. No temporal collocation, interpolation or block skill claim
 * is inferred from footprint membership.
 */
export function deriveMainBlockObservationIntegration(
  block: ObservationAwareMainBlock,
  evidence: MainBlockObservationEvidence = {}
): MainBlockObservationIntegration {
  const linksById = new Map<string, MainBlockObservationLink>();

  for (const profile of evidence.comparisonProfiles ?? []) {
    const link = argoComparisonLink(block, profile);
    if (link) linksById.set(link.id, link);
  }

  for (const profile of evidence.verifiedProfiles ?? []) {
    const link = verifiedProfileLink(block, profile);
    if (link) linksById.set(link.id, link);
  }

  const links = [...linksById.values()].sort(
    (a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id)
  );
  const independentComparisonCount = links.filter(
    (link) => link.independentlyComparedToActiveModel
  ).length;
  const spatialContextCount = links.length - independentComparisonCount;
  const modelObservationValidated = independentComparisonCount > 0 && isVerifiedBaseline(block);
  const evidenceClass: MainBlockObservationEvidenceClass = modelObservationValidated
    ? "independent-model-observation"
    : links.length > 0
      ? "spatial-context-only"
      : "none";
  const sensorTypes = [...new Set(links.map((link) => link.sensorType))]
    .sort((a, b) => a.localeCompare(b));

  const limitations: string[] = [
    "Observation timestamps and coordinates are preserved; footprint membership does not imply temporal collocation."
  ];
  if (modelObservationValidated) {
    limitations.push(
      "Only the existing verified Argo-to-GLORYS baseline comparison is treated as model-observation evidence."
    );
  } else if (links.length > 0) {
    limitations.push(
      "These profiles are spatial context only; no interpolation, matchup metric or block validation is inferred."
    );
  } else {
    limitations.push(
      "No source-backed observation profile currently falls inside this active footprint."
    );
  }
  if (block.materialization === "planned") {
    limitations.push(
      "Observation presence does not unlock planned model science; the block remains scientifically render-locked."
    );
  }

  return {
    version: MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION,
    blockId: block.id,
    materialization: block.materialization,
    observationsAvailable: links.length > 0,
    observationCount: links.length,
    independentComparisonCount,
    spatialContextCount,
    sensorTypes,
    evidenceClass,
    modelObservationValidated,
    links,
    limitations
  };
}
