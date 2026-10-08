import { expect, test } from "@playwright/test";
import { deriveMainBlockCapabilities } from "../src/main-block-capabilities";
import { resolveMainBlock, PHASE35B_PILOT_IDS, pilotAvailableDates } from "../src/main-block-runtime";
import { INDIAN_OCEAN_MAIN_BLOCKS } from "../src/main-block-engine";

const ADDED_REGION_BLOCKS = ["IO-082", "IO-066", "IO-059", "IO-122", "IO-130", "IO-030"] as const;

test("3DB-11 newly acquired Indian Ocean regions resolve to independent render-ready pilots", () => {
  expect(PHASE35B_PILOT_IDS).toHaveLength(35);
  for (const id of ADDED_REGION_BLOCKS) {
    const block = resolveMainBlock(id);
    const ability = deriveMainBlockCapabilities(block);
    expect(block.materialization).toBe("pilot");
    expect(ability.cesiumReady).toBe(true);
    expect(ability.waterColumnReady).toBe(true);
    expect(ability.provenance.evidenceClass).toBe("checksum-verified-pilot");
    expect(ability.validation.modelObservationValidated).toBe(false);
    expect(pilotAvailableDates(id)).toEqual(["2004-03-15"]);
  }
  expect(INDIAN_OCEAN_MAIN_BLOCKS).toHaveLength(140);
});

test("3DB-11 keeps unmaterialized regions locked and the baseline separate", () => {
  const planned = resolveMainBlock("IO-047");
  expect(planned.materialization).toBe("planned");
  const ability = deriveMainBlockCapabilities(planned);
  expect(ability.renderReady).toBe(false);
  expect(ability.dataAvailable).toBe(false);
  expect(ability.availableTimes).toEqual([]);
  const baseline = resolveMainBlock("BASE-GLORYS-001");
  expect(baseline.materialization).toBe("verified-baseline");
  expect(deriveMainBlockCapabilities(baseline).validation.modelObservationValidated).toBe(true);
});
