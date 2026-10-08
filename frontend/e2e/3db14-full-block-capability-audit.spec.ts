import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { deriveMainBlockCapabilities } from "../src/main-block-capabilities";
import { INDIAN_OCEAN_MAIN_BLOCKS } from "../src/main-block-engine";
import { resolveMainBlock } from "../src/main-block-runtime";

const report = JSON.parse(readFileSync(new URL("../public/main-blocks/capability-audit.json", import.meta.url), "utf8"));

test("3DB-14 audits every logical block against the live TS scientific render gates", () => {
  expect(report.summary).toMatchObject({
    logicalBlocks: 140, sourceBackedPilots: 35, plannedBlocks: 105,
    multiDatePilots: 6, sourcePayloadFrames: 41, landBlocksMaterialized: 0,
    independentlyObservationValidatedPilots: 0
  });
  expect(INDIAN_OCEAN_MAIN_BLOCKS).toHaveLength(140);
  for (const audited of report.blocks) {
    const capability = deriveMainBlockCapabilities(resolveMainBlock(audited.id));
    expect(capability.id).toBe(audited.id);
    expect(capability.geographicBounds).toEqual(audited.bounds);
    expect(capability.materialized).toBe(audited.materialized);
    expect(capability.cesiumReady).toBe(audited.cesiumContractReady);
    expect(capability.waterColumnReady).toBe(audited.waterColumnContractReady);
    expect(capability.availableTimes).toEqual(audited.availableDates);
    expect(capability.availableVariables).toEqual(audited.availableVariables);
    expect(capability.validation.modelObservationValidated).toBe(false);
    expect(audited.individualProduction3DRenderProven).toBe(false);
  }
  const baseline = deriveMainBlockCapabilities(resolveMainBlock("BASE-GLORYS-001"));
  expect(baseline.validation.modelObservationValidated).toBe(true);
  expect(report.blocks.some((b: {id: string}) => b.id === baseline.id)).toBe(false);
});

test("3DB-14 published audit and representative scientific bytes are publicly retrievable", async ({ request }) => {
  const live = process.env.OCEANTWIN_LIVE_URL;
  if (!live) throw new Error("OCEANTWIN_LIVE_URL required");
  const base = new URL(live.split("#")[0]);
  const path = (suffix: string) => new URL("main-blocks/" + suffix, base).toString();
  const auditResponse = await request.get(path("capability-audit.json"));
  expect(auditResponse.ok()).toBe(true);
  expect(await auditResponse.json()).toEqual(report);
  for (const id of ["IO-001", "IO-082", "IO-123"]) {
    const audited = report.blocks.find((b: {id: string}) => b.id === id);
    expect(audited.materialized).toBe(true);
    const record = audited.sourcePayloads[0];
    const bytesResponse = await request.get(path(record.path));
    expect(bytesResponse.ok()).toBe(true);
    expect(createHash("sha256").update(await bytesResponse.body()).digest("hex")).toBe(record.sha256);
  }
});
