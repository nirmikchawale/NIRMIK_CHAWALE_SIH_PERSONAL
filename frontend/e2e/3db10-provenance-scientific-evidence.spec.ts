import { expect, test } from "@playwright/test";

import { deriveMainBlockObservationIntegration } from "../src/main-block-observations";
import {
  MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION,
  deriveMainBlockProvenanceEvidence
} from "../src/main-block-provenance";
import { resolveMainBlock } from "../src/main-block-runtime";
import type { PilotBlockManifest } from "../src/pilot-main-block-loader";
import type { ProfileSummary, ProvenanceResponse } from "../src/types";

function argoProfile(longitude: number, latitude: number): ProfileSummary {
  return {
    profile_id: "20240102_indian_ocean_prof:23",
    platform_id: "5907092",
    cycle: 13,
    direction: "D",
    matched_level_count: 50,
    mae_celsius: 0.22538286668411817,
    rmse_celsius: 0.3188158440179983,
    spatial_distance_km: 3.851344566390636,
    time_offset_hours: 14.766666666666667,
    observation_time_utc: "2024-01-02T14:46:00Z",
    observation_longitude: longitude,
    observation_latitude: latitude,
    model_cell_longitude: 67.58333587646484,
    model_cell_latitude: 12.833333015441895,
    shallowest_matched_depth_m: 1.3919436791479163,
    deepest_matched_depth_m: 447.0244991497731
  };
}

const provenance: ProvenanceResponse = {
  model: {
    label: "Copernicus Marine GLORYS12V1",
    product: "GLOBAL_MULTIYEAR_PHY_001_030",
    dataset_id: "cmems_mod_glo_phy_my_0.083deg_P1D-m",
    doi: "10.48670/moi-00021",
    file: "verified-baseline.nc",
    freshness_class: "immutable_verified_snapshot",
    runtime_mode: "bundled_static"
  },
  observations: {
    provider: "Ifremer Argo GDAC",
    doi: "10.17882/42182"
  },
  quality_control: {
    accepted_provider_qc: ["1", "2"],
    max_cell_distance_km: 12,
    matched_profiles: 2,
    no_extrapolation: true,
    metrics_weighting: "unweighted"
  },
  methodology: {
    horizontal: "nearest verified model cell",
    depth: "within native model depth support",
    time: null,
    temperature: null
  },
  integrity: {
    created_utc: "2026-10-01T00:00:00Z",
    source_checksums_unchanged: true,
    configuration_sha256: "a".repeat(64),
    engine_sha256: "b".repeat(64),
    no_synthetic_measurements_in_outputs: true
  },
  source_metadata_available: ["model", "argo"],
  scientific_disclaimer: "Diagnostic comparison only."
};

const manifest: PilotBlockManifest = {
  schema: "oceancanvas-main-block-manifest-v1",
  phase: "3.5B",
  target_domain: {
    west: 60,
    east: 100,
    south: 5,
    north: 25,
    columns: 14,
    rows: 10,
    logical_block_count: 140
  },
  source: {
    origin_product: "Copernicus Marine / Mercator Ocean GLORYS12V1",
    product_id: "GLOBAL_MULTIYEAR_PHY_001_030",
    dataset_id: "cmems_mod_glo_phy_my_0.083deg_P1D-m",
    archive_provider: "NCAR GDEX public THREDDS archive",
    dates: ["2004-03-15"],
    files: ["mercatorglorys12v1_gl12_mean_20040315_R20040317.nc"],
    time_semantics: "daily_mean",
    horizontal_stride: 2,
    maximum_depth_m: 500
  },
  integrity: {
    logical_block_count: 140,
    pilot_block_count: 1,
    multi_date_pilot_count: 0,
    land_blocks_materialized: 0,
    synthetic_measurements: false,
    synthetic_timestamps: false,
    synthetic_coordinates: false,
    synthetic_depths: false,
    vertical_component_available: false
  },
  pilot_ids: ["IO-001"],
  multi_date_pilot_ids: [],
  blocks: [{
    id: "IO-001",
    row: 0,
    column: 0,
    west: 60,
    east: 63,
    south: 23,
    north: 25,
    region: "Western Arabian Sea",
    ocean_fraction: 1,
    ocean_relevance: "ocean",
    materialization: "pilot",
    available_dates: ["2004-03-15"],
    payloads: [{
      date: "2004-03-15",
      path: "data/IO-001/2004-03-15.json",
      sha256: "a6e07a7f34a5dfb240a9ab85f48265f227456cf2872ad26620071c24f409a8ce"
    }]
  }]
};

test("3DB-10 evidence contract distinguishes baseline, pilot and planned provenance", () => {
  expect(MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION).toBe("3db-10-v1");

  const argo = argoProfile(67.61864833333334, 12.837103333333333);
  const baselineBlock = resolveMainBlock("BASE-GLORYS-001");
  const baselineObservation = deriveMainBlockObservationIntegration(
    baselineBlock,
    { comparisonProfiles: [argo] }
  );
  const baseline = deriveMainBlockProvenanceEvidence(baselineBlock, {
    runtimeProvenance: provenance,
    observationIntegration: baselineObservation
  });
  expect(baseline.evidenceClass).toBe("immutable-verified-baseline");
  expect(baseline.evidenceAvailability).toBe("verified");
  expect(baseline.datasetId).toBe("cmems_mod_glo_phy_my_0.083deg_P1D-m");
  expect(baseline.observationEvidence.modelObservationValidated).toBe(true);

  const pilotBlock = resolveMainBlock("IO-001");
  const pilot = deriveMainBlockProvenanceEvidence(pilotBlock, {
    manifest,
    runtimeProvenance: provenance,
    observationIntegration: deriveMainBlockObservationIntegration(pilotBlock)
  });
  expect(pilot.evidenceClass).toBe("checksum-verified-pilot");
  expect(pilot.evidenceAvailability).toBe("source-backed");
  expect(pilot.payloadChecksums).toHaveLength(1);
  expect(pilot.payloadChecksums[0].sha256).toBe(
    "a6e07a7f34a5dfb240a9ab85f48265f227456cf2872ad26620071c24f409a8ce"
  );
  expect(pilot.observationEvidence.modelObservationValidated).toBe(false);

  const plannedBlock = resolveMainBlock("IO-087");
  const plannedObservation = deriveMainBlockObservationIntegration(
    plannedBlock,
    { comparisonProfiles: [argo] }
  );
  const planned = deriveMainBlockProvenanceEvidence(plannedBlock, {
    manifest,
    runtimeProvenance: provenance,
    observationIntegration: plannedObservation
  });
  expect(planned.evidenceClass).toBe("planned-no-scientific-payload");
  expect(planned.evidenceAvailability).toBe("withheld");
  expect(planned.modelEvidenceAvailable).toBe(false);
  expect(planned.payloadChecksums).toEqual([]);
  expect(planned.observationEvidence.evidenceClass).toBe("spatial-context-only");
  expect(planned.observationEvidence.modelObservationValidated).toBe(false);
  expect(planned.withheldClaims.join(" ")).toMatch(/baseline fallback/i);
});

test("3DB-10 fail-closes a pilot when manifest checksum evidence is unavailable", () => {
  const pilot = deriveMainBlockProvenanceEvidence(resolveMainBlock("IO-001"), {
    manifest: null,
    runtimeProvenance: provenance
  });
  expect(pilot.evidenceClass).toBe("pilot-evidence-withheld");
  expect(pilot.evidenceAvailability).toBe("withheld");
  expect(pilot.modelEvidenceAvailable).toBe(false);
  expect(pilot.sourceIntegrityValidated).toBe(false);
  expect(pilot.rendererAcceptanceValidated).toBe(false);
});

test("3DB-10 live provenance drawer follows active block truth", async ({ page }) => {
  test.setTimeout(210_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-10 browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.removeItem("oceancanvas-active-main-block-v1"));
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  const globe = page.locator(".globe-visualization-layer.active .globe-shell");
  await expect(globe).toHaveAttribute("data-active-main-block", "BASE-GLORYS-001", { timeout: 30_000 });

  const sources = page.getByRole("button", { name: "Sources & QC" }).first();
  await expect(sources).toBeVisible({ timeout: 30_000 });
  await sources.click();

  const evidence = page.getByTestId("active-block-provenance-evidence");
  await expect(evidence).toHaveAttribute("data-block-id", "BASE-GLORYS-001");
  await expect(evidence).toHaveAttribute("data-evidence-class", "immutable-verified-baseline");
  await expect(evidence).toHaveAttribute("data-model-observation-validated", "true", { timeout: 30_000 });

  const selector = page.getByTestId("integrated-main-block-hud").getByLabel("Active main block");

  // Keep the provenance drawer open while switching the canonical block selector.
  // Drawer close/open interaction is covered elsewhere; this acceptance test is
  // intentionally scoped to proving the active evidence contract updates in place.
  await selector.selectOption("IO-001", { force: true });
  await expect(globe).toHaveAttribute("data-active-main-block", "IO-001", { timeout: 30_000 });
  await expect(evidence).toHaveAttribute("data-block-id", "IO-001");
  await expect(evidence).toHaveAttribute("data-evidence-class", "checksum-verified-pilot", { timeout: 30_000 });
  await expect.poll(async () => Number(await evidence.getAttribute("data-checksum-count"))).toBeGreaterThanOrEqual(1);
  await expect(evidence).toHaveAttribute("data-model-observation-validated", "false");

  await selector.selectOption("IO-087", { force: true });
  await expect(globe).toHaveAttribute("data-active-main-block", "IO-087", { timeout: 30_000 });
  await expect(evidence).toHaveAttribute("data-block-id", "IO-087");
  await expect(evidence).toHaveAttribute("data-evidence-class", "planned-no-scientific-payload");
  await expect(evidence).toHaveAttribute("data-evidence-availability", "withheld");
  await expect(evidence).toHaveAttribute("data-model-observation-validated", "false");
  await expect(evidence).toHaveAttribute("data-observation-evidence", "spatial-context-only", { timeout: 30_000 });
  await expect(evidence).toContainText(/no materialized scientific model payload/i);
  await expect(page.getByTestId("active-block-runtime-provenance-withheld")).toContainText(/baseline fallback metadata/i);

  expect(pageErrors).toEqual([]);
});
