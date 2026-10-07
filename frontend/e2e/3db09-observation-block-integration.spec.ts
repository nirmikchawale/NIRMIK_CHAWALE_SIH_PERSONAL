import { expect, test } from "@playwright/test";

import { deriveMainBlockCapabilities } from "../src/main-block-capabilities";
import {
  MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION,
  deriveMainBlockObservationIntegration
} from "../src/main-block-observations";
import { resolveMainBlock } from "../src/main-block-runtime";
import type {
  ImportedObservationProfile,
  ProfileSummary
} from "../src/types";

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

function verifiedProfile(longitude: number, latitude: number): ImportedObservationProfile {
  return {
    id: "glider|test|2025-09-11T14:42:49.000Z|" + longitude + "|" + latitude,
    platform_id: "TEST-GLIDER",
    sensor_type: "glider",
    longitude,
    latitude,
    timestamp: "2025-09-11T14:42:49.000Z",
    source: "verified fixture source",
    dataset_id: "fixture",
    variables: ["temperature", "salinity"],
    records: [
      {
        longitude,
        latitude,
        depth_m: 10,
        timestamp: "2025-09-11T14:42:49.000Z",
        variable: "temperature",
        value: 25,
        units: "degree_C",
        source: "verified fixture source",
        platform_id: "TEST-GLIDER",
        sensor_type: "glider",
        dataset_id: "fixture"
      }
    ]
  };
}

test("3DB-09 keeps independent baseline validation separate from logical-block observation context", () => {
  expect(MAIN_BLOCK_OBSERVATION_INTEGRATION_VERSION).toBe("3db-09-v1");

  const argo = argoProfile(67.61864833333334, 12.837103333333333);
  const baseline = deriveMainBlockObservationIntegration(
    resolveMainBlock("BASE-GLORYS-001"),
    { comparisonProfiles: [argo] }
  );
  expect(baseline.observationCount).toBe(1);
  expect(baseline.independentComparisonCount).toBe(1);
  expect(baseline.evidenceClass).toBe("independent-model-observation");
  expect(baseline.modelObservationValidated).toBe(true);
  expect(baseline.links[0].evidenceRole).toBe("independent-model-observation");

  const io087Block = resolveMainBlock("IO-087");
  const io087 = deriveMainBlockObservationIntegration(io087Block, { comparisonProfiles: [argo] });
  expect(io087Block.materialization).toBe("planned");
  expect(io087.observationCount).toBe(1);
  expect(io087.independentComparisonCount).toBe(0);
  expect(io087.spatialContextCount).toBe(1);
  expect(io087.evidenceClass).toBe("spatial-context-only");
  expect(io087.modelObservationValidated).toBe(false);
  expect(io087.links[0].evidenceRole).toBe("spatial-context");

  const capability = deriveMainBlockCapabilities(io087Block, io087);
  expect(capability.observationsAvailable).toBe(true);
  expect(capability.renderReady).toBe(false);
  expect(capability.validation.modelObservationValidated).toBe(false);
});

test("3DB-09 uses canonical geographic edge ownership and cannot promote pilot validation", () => {
  const edgeProfile = verifiedProfile(63, 24);
  const west = deriveMainBlockObservationIntegration(
    resolveMainBlock("IO-001"),
    { verifiedProfiles: [edgeProfile] }
  );
  const east = deriveMainBlockObservationIntegration(
    resolveMainBlock("IO-002"),
    { verifiedProfiles: [edgeProfile] }
  );

  expect(west.observationCount).toBe(0);
  expect(east.observationCount).toBe(1);
  expect(east.sensorTypes).toEqual(["glider"]);
  expect(east.modelObservationValidated).toBe(false);
  expect(east.links[0].sourceClass).toBe("verified-observation-pack");

  expect(() => deriveMainBlockCapabilities(resolveMainBlock("IO-002"), {
    observationsAvailable: true,
    modelObservationValidated: true
  })).toThrow(/cannot promote a non-baseline main block/i);
});

test("3DB-09 live block HUD distinguishes baseline validation from IO-087 spatial context", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-09 browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.removeItem("oceancanvas-active-main-block-v1"));
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  const globe = page.locator(".globe-visualization-layer.active .globe-shell");
  await expect(globe).toHaveAttribute("data-active-main-block", "BASE-GLORYS-001", { timeout: 30_000 });
  await expect(globe).toHaveAttribute("data-active-block-observation-evidence", "independent-model-observation", { timeout: 30_000 });
  await expect(globe).toHaveAttribute("data-active-block-observation-validation", "true");
  await expect.poll(async () => Number(await globe.getAttribute("data-active-block-observation-count"))).toBeGreaterThanOrEqual(2);

  const context = page.getByTestId("active-block-observation-context");
  await expect(context).toContainText(/independently compared to this active verified baseline/i);

  const selector = page.getByTestId("integrated-main-block-hud").getByLabel("Active main block");
  await selector.selectOption("IO-087");
  await expect(globe).toHaveAttribute("data-active-main-block", "IO-087", { timeout: 30_000 });
  await expect(globe).toHaveAttribute("data-active-main-block-materialization", "planned");
  await expect(globe).toHaveAttribute("data-active-block-observation-evidence", "spatial-context-only", { timeout: 30_000 });
  await expect(globe).toHaveAttribute("data-active-block-observation-validation", "false");
  await expect.poll(async () => Number(await globe.getAttribute("data-active-block-observation-count"))).toBeGreaterThanOrEqual(2);
  await expect(context).toContainText(/spatial context only/i);
  await expect(context).toContainText(/no block validation is implied/i);

  expect(pageErrors).toEqual([]);
});
