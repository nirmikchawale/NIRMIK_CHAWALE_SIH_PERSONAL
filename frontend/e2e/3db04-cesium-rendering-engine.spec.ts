import { expect, test } from "@playwright/test";

import { CURRENT_VERIFIED_BASELINE } from "../src/main-block-engine";
import {
  MAIN_BLOCK_CESIUM_RENDERER_VERSION,
  buildCesiumCurrentsRenderPlan,
  buildCesiumFieldRenderPlan,
  buildCesiumVolumeRenderPlan,
  canCesiumRenderMainBlock
} from "../src/main-block-cesium-renderer";
import {
  PHASE35B_MULTI_DATE_PILOT_IDS,
  PHASE35B_PILOT_IDS,
  resolveMainBlock
} from "../src/main-block-runtime";
import type { CurrentsResponse, FieldResponse, VolumeResponse } from "../src/types";

function scalarField(
  variable: "thetao" | "so",
  time: string,
  west: number,
  east: number,
  south: number,
  north: number
): FieldResponse {
  return {
    variable,
    label: variable === "thetao" ? "Temperature" : "Salinity",
    units: variable === "thetao" ? "degree_Celsius" : "1e-3",
    time_index: 0,
    time,
    depth_index: 0,
    depth_m: 0.494,
    longitude: [west, east],
    latitude: [south, north],
    values: [[24.1, 24.2], [24.3, 24.4]],
    minimum: 24.1,
    maximum: 24.4,
    provenance: {
      product: "GLORYS12V1",
      dataset_id: "cmems_mod_glo_phy_my_0.083deg_P1D-m",
      freshness_class: "historical_daily_reanalysis",
      runtime_mode: "static"
    }
  };
}

function scalarVolume(
  time: string,
  west: number,
  east: number,
  south: number,
  north: number
): VolumeResponse {
  return {
    variable: "thetao",
    label: "Temperature",
    units: "degree_Celsius",
    time_index: 0,
    time,
    points: [
      [west, south, 0.494, 24.1],
      [east, north, 10, 23.9],
      [(west + east) / 2, (south + north) / 2, 100, 18.2]
    ],
    minimum: 18.2,
    maximum: 24.1,
    depth_positive: "down",
    rendering_note: "test fixture using source-shaped coordinates"
  };
}

function currentsSlice(
  time: string,
  west: number,
  east: number,
  south: number,
  north: number
): CurrentsResponse {
  const vectors: CurrentsResponse["vectors"] = [
    [west, south, 0.3, 0.4, 0.5],
    [east, north, -0.12, 0.16, 0.2]
  ];
  return {
    variable: "currents",
    units: "m s-1",
    time_index: 0,
    time,
    depth_index: 0,
    depth_m: 0.494,
    vectors,
    minimum: 0.2,
    maximum: 0.5,
    rendering_note: "horizontal uo/vo only"
  };
}

test("3DB-04 freezes a fail-closed Cesium scientific rendering contract", () => {
  expect(MAIN_BLOCK_CESIUM_RENDERER_VERSION).toBe("3db-04-v1");
  expect(PHASE35B_PILOT_IDS).toHaveLength(25);
  expect(PHASE35B_MULTI_DATE_PILOT_IDS).toHaveLength(6);

  const baseline = resolveMainBlock(CURRENT_VERIFIED_BASELINE.id);
  const pilot = resolveMainBlock("IO-001");
  const planned = resolveMainBlock("IO-003");

  expect(canCesiumRenderMainBlock(baseline)).toBe(true);
  expect(canCesiumRenderMainBlock(pilot)).toBe(true);
  expect(canCesiumRenderMainBlock(planned)).toBe(false);

  const plannedAttempt = buildCesiumFieldRenderPlan(
    planned,
    scalarField("thetao", "2024-01-02T00:00:00Z", planned.west, planned.east, planned.south, planned.north)
  );
  expect(plannedAttempt.allowed).toBe(false);
  expect(plannedAttempt.lifecycleStatus).toBe("planned");
});

test("3DB-04 binds pilot scalar slices and volumes to canonical block bounds and native time/depth", () => {
  const pilot = resolveMainBlock("IO-001");
  expect(pilot.materialization).toBe("pilot");

  const field = scalarField(
    "thetao",
    "2004-03-15T12:00:00Z",
    pilot.west,
    pilot.east,
    pilot.south,
    pilot.north
  );
  const fieldPlan = buildCesiumFieldRenderPlan(pilot, field);
  expect(fieldPlan.allowed).toBe(true);
  if (!fieldPlan.allowed) throw new Error(fieldPlan.reason);
  expect(fieldPlan.blockId).toBe("IO-001");
  expect(fieldPlan.sourceDate).toBe("2004-03-15");
  expect(fieldPlan.sampleCount).toBe(4);
  expect(fieldPlan.extent).toEqual({
    west: pilot.west,
    east: pilot.east,
    south: pilot.south,
    north: pilot.north,
    minimumDepthM: 0.494,
    maximumDepthM: 0.494
  });
  expect(fieldPlan.nativeCoordinatesPreserved).toBe(true);
  expect(fieldPlan.nativeDepthPreserved).toBe(true);

  const volumePlan = buildCesiumVolumeRenderPlan(
    pilot,
    scalarVolume("2004-03-15T12:00:00Z", pilot.west, pilot.east, pilot.south, pilot.north)
  );
  expect(volumePlan.allowed).toBe(true);
  if (!volumePlan.allowed) throw new Error(volumePlan.reason);
  expect(volumePlan.sampleCount).toBe(3);
  expect(volumePlan.extent.minimumDepthM).toBe(0.494);
  expect(volumePlan.extent.maximumDepthM).toBe(100);
});

test("3DB-04 rejects coordinates and timestamps that are not genuine for the active block", () => {
  const pilot = resolveMainBlock("IO-001");

  expect(() => buildCesiumFieldRenderPlan(
    pilot,
    scalarField("thetao", "2004-03-15T12:00:00Z", pilot.west - 0.01, pilot.east, pilot.south, pilot.north)
  )).toThrow(/outside IO-001 canonical bounds/);

  expect(() => buildCesiumFieldRenderPlan(
    pilot,
    scalarField("thetao", "2004-03-16T12:00:00Z", pilot.west, pilot.east, pilot.south, pilot.north)
  )).toThrow(/not a genuine available date/);
});

test("3DB-04 current rendering accepts horizontal uo\/vo only and verifies derived speed", () => {
  const pilot = resolveMainBlock("IO-001");
  const currents = currentsSlice(
    "2004-03-15T12:00:00Z",
    pilot.west,
    pilot.east,
    pilot.south,
    pilot.north
  );
  const plan = buildCesiumCurrentsRenderPlan(pilot, currents);
  expect(plan.allowed).toBe(true);
  if (!plan.allowed) throw new Error(plan.reason);
  expect(plan.variable).toBe("currents");
  expect(plan.horizontalCurrentOnly).toBe(true);
  expect(plan.sampleCount).toBe(2);

  const invalid = structuredClone(currents);
  invalid.vectors[0][4] = 0.75;
  expect(() => buildCesiumCurrentsRenderPlan(pilot, invalid)).toThrow(/derived only from native uo\/vo/);
});

test("3DB-04 preserves independently validated baseline rendering separately from pilots", () => {
  const baseline = resolveMainBlock(CURRENT_VERIFIED_BASELINE.id);
  const plan = buildCesiumFieldRenderPlan(
    baseline,
    scalarField(
      "thetao",
      "2024-01-02T00:00:00Z",
      baseline.west,
      baseline.east,
      baseline.south,
      baseline.north
    )
  );
  expect(plan.allowed).toBe(true);
  if (!plan.allowed) throw new Error(plan.reason);
  expect(plan.lifecycleStatus).toBe("verified-baseline");
  expect(plan.evidenceClass).toBe("independently-model-observation-validated-baseline");
});
