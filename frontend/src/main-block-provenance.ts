import { deriveMainBlockCapabilities } from "./main-block-capabilities";
import type { MainBlockObservationIntegration } from "./main-block-observations";
import type { ActiveMainBlock } from "./main-block-runtime";
import type { PilotBlockManifest } from "./pilot-main-block-loader";
import type { ProvenanceResponse } from "./types";

export const MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION = "3db-10-v1";
const GLORYS_PRODUCT_ID = "GLOBAL_MULTIYEAR_PHY_001_030";
const GLORYS_DOI = "10.48670/moi-00021";

export type MainBlockProvenanceEvidenceClass =
  | "immutable-verified-baseline"
  | "checksum-verified-pilot"
  | "pilot-evidence-withheld"
  | "planned-no-scientific-payload";

export type MainBlockProvenanceAvailability =
  | "verified"
  | "source-backed"
  | "withheld";

export interface MainBlockPayloadChecksumEvidence {
  date: string;
  path: string;
  sha256: string;
}

export interface MainBlockProvenanceEvidence {
  version: typeof MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION;
  blockId: string;
  materialization: ActiveMainBlock["materialization"];
  evidenceClass: MainBlockProvenanceEvidenceClass;
  evidenceAvailability: MainBlockProvenanceAvailability;
  modelEvidenceAvailable: boolean;
  sourceProduct: string | null;
  productId: string | null;
  datasetId: string | null;
  doi: string | null;
  archiveProvider: string | null;
  runtimeMode: string | null;
  payloadChecksums: readonly MainBlockPayloadChecksumEvidence[];
  checksumEvidenceAvailable: boolean;
  manifestEntryMatchesBlock: boolean;
  sourceIntegrityValidated: boolean;
  rendererAcceptanceValidated: boolean;
  observationEvidence: {
    evidenceClass: MainBlockObservationIntegration["evidenceClass"] | "none";
    profileCount: number;
    independentComparisonCount: number;
    spatialContextCount: number;
    modelObservationValidated: boolean;
    sourceClasses: readonly string[];
  };
  allowedClaims: readonly string[];
  withheldClaims: readonly string[];
  summary: string;
}

export interface MainBlockProvenanceEvidenceInput {
  manifest?: PilotBlockManifest | null;
  runtimeProvenance?: ProvenanceResponse | null;
  observationIntegration?: MainBlockObservationIntegration | null;
}

function validSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

function sameBounds(
  block: ActiveMainBlock,
  entry: { west: number; east: number; south: number; north: number } | undefined
): boolean {
  return Boolean(entry)
    && block.west === entry!.west
    && block.east === entry!.east
    && block.south === entry!.south
    && block.north === entry!.north;
}

/**
 * 3DB-10 block-scoped provenance contract.
 *
 * This projection deliberately separates active-block evidence from the app's
 * baseline fallback science. A planned block may still coexist with a verified
 * reference dataset in the application, but that reference must never be
 * presented as if it were materialized evidence for the planned block.
 *
 * Pilot checksum evidence is read from the existing source-backed manifest.
 * 3DB-10 does not duplicate payloads, invent checksums, or promote geographic
 * observation proximity into independent model validation.
 */
export function deriveMainBlockProvenanceEvidence(
  block: ActiveMainBlock,
  input: MainBlockProvenanceEvidenceInput = {}
): MainBlockProvenanceEvidence {
  const observation = input.observationIntegration ?? null;
  const capability = deriveMainBlockCapabilities(
    block,
    observation
      ? {
          observationsAvailable: observation.observationsAvailable,
          modelObservationValidated: observation.modelObservationValidated
        }
      : undefined
  );

  const isBaseline = block.materialization === "verified-baseline";
  const isPilot = block.materialization === "pilot";
  const manifestEntry = isPilot
    ? input.manifest?.blocks.find((entry) => entry.id === block.id)
    : undefined;
  const manifestEntryMatchesBlock = isPilot
    ? Boolean(manifestEntry)
      && manifestEntry!.materialization === "pilot"
      && sameBounds(block, manifestEntry)
    : isBaseline;

  const payloadChecksums: MainBlockPayloadChecksumEvidence[] = manifestEntryMatchesBlock && manifestEntry
    ? manifestEntry.payloads
        .filter((payload) => validSha256(payload.sha256))
        .map((payload) => ({
          date: payload.date,
          path: payload.path,
          sha256: payload.sha256
        }))
    : [];

  const manifestIntegritySafe = Boolean(
    isPilot
    && input.manifest
    && manifestEntry
    && manifestEntryMatchesBlock
    && manifestEntry.payloads.length > 0
    && payloadChecksums.length === manifestEntry.payloads.length
    && input.manifest.integrity.synthetic_measurements === false
    && input.manifest.integrity.synthetic_timestamps === false
    && input.manifest.integrity.synthetic_coordinates === false
    && input.manifest.integrity.synthetic_depths === false
    && input.manifest.integrity.vertical_component_available === false
  );

  const modelObservationValidated = observation
    ? observation.modelObservationValidated
    : capability.validation.modelObservationValidated;
  const sourceClasses = observation
    ? [...new Set(observation.links.map((link) => link.sourceClass))].sort((a, b) => a.localeCompare(b))
    : [];

  let evidenceClass: MainBlockProvenanceEvidenceClass;
  let evidenceAvailability: MainBlockProvenanceAvailability;
  let modelEvidenceAvailable: boolean;
  let sourceProduct: string | null;
  let productId: string | null;
  let datasetId: string | null;
  let doi: string | null;
  let archiveProvider: string | null;
  let runtimeMode: string | null;
  let checksumEvidenceAvailable: boolean;
  const allowedClaims: string[] = [];
  const withheldClaims: string[] = [];

  if (isBaseline) {
    evidenceClass = "immutable-verified-baseline";
    evidenceAvailability = "verified";
    modelEvidenceAvailable = true;
    sourceProduct = block.sourceProduct;
    productId = GLORYS_PRODUCT_ID;
    datasetId = block.sourceDatasetId;
    doi = input.runtimeProvenance?.model.doi ?? GLORYS_DOI;
    archiveProvider = input.runtimeProvenance?.model.label ?? "Copernicus Marine";
    runtimeMode = input.runtimeProvenance?.model.runtime_mode ?? "verified bundled reference";
    checksumEvidenceAvailable = input.runtimeProvenance?.integrity.source_checksums_unchanged === true;

    allowedClaims.push(
      "Immutable GLORYS12V1 baseline model evidence is attached to this active reference.",
      "Source-integrity and renderer-acceptance gates are satisfied for the verified baseline."
    );
    if (modelObservationValidated) {
      allowedClaims.push("Independent Argo-to-model comparison evidence is attached to this baseline.");
    } else {
      withheldClaims.push("Independent observation evidence is not currently resolved in the active browser session.");
    }
    withheldClaims.push("No multi-time baseline playback is claimed from the single verified 2024-01-02 timestep.");
  } else if (isPilot && manifestIntegritySafe) {
    evidenceClass = "checksum-verified-pilot";
    evidenceAvailability = "source-backed";
    modelEvidenceAvailable = true;
    sourceProduct = input.manifest!.source.origin_product;
    productId = input.manifest!.source.product_id;
    datasetId = input.manifest!.source.dataset_id;
    doi = input.runtimeProvenance?.model.doi ?? GLORYS_DOI;
    archiveProvider = input.manifest!.source.archive_provider;
    runtimeMode = "static checksum-manifest-backed pilot";
    checksumEvidenceAvailable = true;

    allowedClaims.push(
      `${payloadChecksums.length} genuine pilot payload checksum${payloadChecksums.length === 1 ? "" : "s"} are attached through the canonical manifest.`,
      "Only genuine materialized source dates and retained coordinates/depths are exposed.",
      "Temperature, salinity and horizontal uo/vo current components are source-backed for this pilot."
    );
    withheldClaims.push("No independent Argo/model-observation validation is attached to this pilot block.");
    withheldClaims.push("No vertical current component is available or implied.");
    if (observation?.spatialContextCount) {
      withheldClaims.push("Observation profiles inside the footprint are spatial context only and do not validate the pilot.");
    }
  } else if (isPilot) {
    evidenceClass = "pilot-evidence-withheld";
    evidenceAvailability = "withheld";
    modelEvidenceAvailable = false;
    sourceProduct = null;
    productId = null;
    datasetId = null;
    doi = null;
    archiveProvider = null;
    runtimeMode = null;
    checksumEvidenceAvailable = false;

    withheldClaims.push(
      "Pilot provenance is fail-closed because canonical manifest/checksum evidence is unavailable or inconsistent.",
      "No active-block source, checksum, renderer-validation or model-observation claim may be inferred from fallback data."
    );
  } else {
    evidenceClass = "planned-no-scientific-payload";
    evidenceAvailability = "withheld";
    modelEvidenceAvailable = false;
    sourceProduct = null;
    productId = null;
    datasetId = null;
    doi = null;
    archiveProvider = null;
    runtimeMode = null;
    checksumEvidenceAvailable = false;

    allowedClaims.push("Canonical block identity, geographic bounds and planned lifecycle state are available.");
    withheldClaims.push(
      "No materialized scientific model payload is attached to this planned block.",
      "Variables, timestamps, depths, checksums and renderer validation remain withheld until genuine source evidence is materialized.",
      "The verified baseline fallback must not be presented as active-block provenance."
    );
    if (observation?.observationCount) {
      withheldClaims.push("Observation footprint context does not unlock model science or create block validation.");
    }
  }

  const summary = isBaseline
    ? "Verified immutable reference evidence with baseline-only independent model-observation validation."
    : isPilot && manifestIntegritySafe
      ? `Source-backed pilot evidence with ${payloadChecksums.length} canonical SHA-256 payload record${payloadChecksums.length === 1 ? "" : "s"}; independent observation validation remains absent.`
      : isPilot
        ? "Pilot scientific provenance is withheld until canonical manifest/checksum evidence is available and consistent."
        : "Planned geographic block only; no materialized scientific payload or active-block model provenance is claimed.";

  return {
    version: MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION,
    blockId: block.id,
    materialization: block.materialization,
    evidenceClass,
    evidenceAvailability,
    modelEvidenceAvailable,
    sourceProduct,
    productId,
    datasetId,
    doi,
    archiveProvider,
    runtimeMode,
    payloadChecksums,
    checksumEvidenceAvailable,
    manifestEntryMatchesBlock,
    sourceIntegrityValidated: modelEvidenceAvailable && capability.validation.sourceIntegrityValidated,
    rendererAcceptanceValidated: modelEvidenceAvailable && capability.validation.rendererAcceptanceValidated,
    observationEvidence: {
      evidenceClass: observation?.evidenceClass ?? "none",
      profileCount: observation?.observationCount ?? 0,
      independentComparisonCount: observation?.independentComparisonCount ?? 0,
      spatialContextCount: observation?.spatialContextCount ?? 0,
      modelObservationValidated,
      sourceClasses
    },
    allowedClaims,
    withheldClaims,
    summary
  };
}
