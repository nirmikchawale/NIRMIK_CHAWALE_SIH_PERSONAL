import { expect, test } from "@playwright/test";
import {
  CURRENT_VERIFIED_BASELINE,
  INDIAN_OCEAN_MAIN_BLOCKS
} from "../src/main-block-engine";
import {
  canRenderMainBlock,
  deriveMainBlockCapabilities
} from "../src/main-block-capabilities";
import {
  PHASE35B_PILOT_IDS,
  resolveMainBlock
} from "../src/main-block-runtime";

test("3DB-00 keeps every planned logical block scientifically locked", () => {
  const pilotIds = new Set<string>(PHASE35B_PILOT_IDS);
  const planned = INDIAN_OCEAN_MAIN_BLOCKS
    .filter((block) => !pilotIds.has(block.id))
    .map((block) => resolveMainBlock(block.id));

  expect(planned).toHaveLength(105);

  for (const block of planned) {
    const capability = deriveMainBlockCapabilities(block);
    expect(capability.logicalExists).toBe(true);
    expect(capability.geographicReady).toBe(true);
    expect(capability.dataAvailable).toBe(false);
    expect(capability.materialized).toBe(false);
    expect(capability.scientificallyValidated).toBe(false);
    expect(capability.cesiumReady).toBe(false);
    expect(capability.waterColumnReady).toBe(false);
    expect(capability.renderReady).toBe(false);
    expect(capability.availableVariables).toEqual([]);
    expect(capability.availableTimes).toEqual([]);
    expect(capability.observationsAvailable).toBe(false);
    expect(capability.provenance.evidenceClass).toBe("none");
    expect(canRenderMainBlock(block)).toBe(false);
  }
});

test("3DB-00 exposes source-backed pilots without inventing observation validation", () => {
  expect(PHASE35B_PILOT_IDS).toHaveLength(35);

  for (const id of PHASE35B_PILOT_IDS) {
    const block = resolveMainBlock(id);
    const capability = deriveMainBlockCapabilities(block);

    expect(capability.lifecycleStatus).toBe("render-ready");
    expect(capability.dataAvailable).toBe(true);
    expect(capability.materialized).toBe(true);
    expect(capability.validation.sourceIntegrityValidated).toBe(true);
    expect(capability.validation.rendererAcceptanceValidated).toBe(true);
    expect(capability.validation.modelObservationValidated).toBe(false);
    expect(capability.cesiumReady).toBe(true);
    expect(capability.waterColumnReady).toBe(true);
    expect(capability.renderReady).toBe(true);
    expect(capability.availableVariables).toEqual(["thetao", "so", "currents"]);
    expect(capability.availableTimes.length).toBeGreaterThan(0);
    expect(capability.observationsAvailable).toBe(false);
    expect(capability.depthRange.resolution).toBe("payload-resolved");
    expect(capability.provenance.evidenceClass).toBe("checksum-verified-pilot");
    expect(canRenderMainBlock(block)).toBe(true);
  }
});

test("3DB-00 preserves the immutable verified GLORYS baseline contract", () => {
  const capability = deriveMainBlockCapabilities(CURRENT_VERIFIED_BASELINE);

  expect(capability.id).toBe("BASE-GLORYS-001");
  expect(capability.lifecycleStatus).toBe("render-ready");
  expect(capability.availableTimes).toEqual(["2024-01-02"]);
  expect(capability.availableVariables).toEqual(["thetao", "so", "currents"]);
  expect(capability.depthRange).toEqual({
    minimumM: 0.49402499198913574,
    maximumM: 453.9377136230469,
    levelCount: 31,
    resolution: "verified-registry"
  });
  expect(capability.validation.modelObservationValidated).toBe(true);
  expect(capability.observationsAvailable).toBe(true);
  expect(capability.renderReady).toBe(true);
});
