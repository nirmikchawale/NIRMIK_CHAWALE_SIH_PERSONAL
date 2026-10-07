import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import {
  MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION,
  assertMainBlockVariableSelection,
  deriveMainBlockVariableIntegration,
  type NativeVariableEvidence
} from "../src/main-block-variables";
import { resolveMainBlock } from "../src/main-block-runtime";

interface VariablePayload {
  block_id: string;
  shape: { depth: number; latitude: number; longitude: number };
  variables: NativeVariableEvidence["variables"];
}

function payload(path: string): VariablePayload {
  return JSON.parse(
    readFileSync(new URL(`../public/main-blocks/data/${path}`, import.meta.url), "utf8")
  ) as VariablePayload;
}

test("3DB-08 resolves only genuine native pilot variables and keeps planned blocks locked", () => {
  expect(MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION).toBe("3db-08-v1");

  const source = payload("IO-001/2004-03-15.json");
  const pilot = resolveMainBlock(source.block_id);
  const integration = deriveMainBlockVariableIntegration(pilot, {
    shape: source.shape,
    variables: source.variables
  });

  expect(integration.ready).toBe(true);
  if (!integration.ready) throw new Error("IO-001 variable integration unexpectedly locked.");
  expect(integration.mode).toBe("native-multi-variable");
  expect(integration.resolution).toBe("payload-resolved");
  expect(integration.availableVariables).toEqual(["thetao", "so", "currents"]);
  expect(integration.sourceComponents).toEqual(["thetao", "so", "uo", "vo"]);
  expect(integration.horizontalCurrentOnly).toBe(true);
  expect(assertMainBlockVariableSelection(integration, "thetao")).toBe("thetao");
  expect(assertMainBlockVariableSelection(integration, "so")).toBe("so");
  expect(assertMainBlockVariableSelection(integration, "currents")).toBe("currents");
  expect(() => assertMainBlockVariableSelection(integration, "chlorophyll")).toThrow(/unsupported main-block scientific variable/);

  const planned = deriveMainBlockVariableIntegration(resolveMainBlock("IO-003"));
  expect(planned.ready).toBe(false);
  expect(planned.mode).toBe("locked");
  expect(planned.availableVariables).toEqual([]);
  expect(planned.sourceComponents).toEqual([]);
  expect(() => deriveMainBlockVariableIntegration(resolveMainBlock("IO-003"), {
    shape: source.shape,
    variables: source.variables
  })).toThrow(/planned block IO-003 cannot receive scientific variable evidence/);
});

test("3DB-08 fails closed on missing current components, unsupported variables and corrupt source metadata", () => {
  const source = payload("IO-029/2004-03-15.json");
  const pilot = resolveMainBlock(source.block_id);

  const missingVo = structuredClone(source);
  delete missingVo.variables.vo;
  expect(() => deriveMainBlockVariableIntegration(pilot, {
    shape: missingVo.shape,
    variables: missingVo.variables
  })).toThrow(/currents require both native uo and vo/);

  const unsupported = structuredClone(source) as VariablePayload & {
    variables: NativeVariableEvidence["variables"] & Record<string, unknown>;
  };
  unsupported.variables.chlorophyll = {
    units: "mg m-3",
    values: Array(source.shape.depth * source.shape.latitude * source.shape.longitude).fill(1),
    finite_count: source.shape.depth * source.shape.latitude * source.shape.longitude,
    minimum: 1,
    maximum: 1
  };
  expect(() => deriveMainBlockVariableIntegration(pilot, {
    shape: unsupported.shape,
    variables: unsupported.variables
  })).toThrow(/unsupported main-block source component/);

  const badCount = structuredClone(source);
  if (!badCount.variables.thetao) throw new Error("IO-029 test fixture is missing thetao.");
  badCount.variables.thetao.finite_count = (badCount.variables.thetao.finite_count ?? 0) + 1;
  expect(() => deriveMainBlockVariableIntegration(pilot, {
    shape: badCount.shape,
    variables: badCount.variables
  })).toThrow(/finite_count/);
});

test("3DB-08 preserves the immutable verified baseline variable contract without inventing extra components", () => {
  const baseline = deriveMainBlockVariableIntegration(resolveMainBlock("BASE-GLORYS-001"));
  expect(baseline.ready).toBe(true);
  if (!baseline.ready) throw new Error("Verified baseline variable integration unexpectedly locked.");
  expect(baseline.resolution).toBe("verified-registry");
  expect(baseline.availableVariables).toEqual(["thetao", "so", "currents"]);
  expect(baseline.sourceComponents).toEqual(["thetao", "so", "uo", "vo"]);
  expect(baseline.horizontalCurrentOnly).toBe(true);
});

test("3DB-08 live pilot exposes exactly the three source-backed GLORYS block variables", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-08 browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("oceancanvas-active-main-block-v1", "IO-001"));
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });

  const switcher = page.getByLabel("Ocean variable");
  await expect(switcher).toBeVisible({ timeout: 30_000 });
  await expect(switcher.locator("button")).toHaveCount(3);
  await expect(switcher.getByRole("button", { name: /Temperature/ })).toBeVisible();
  await expect(switcher.getByRole("button", { name: /Salinity/ })).toBeVisible();
  await expect(switcher.getByRole("button", { name: /Horizontal current speed/ })).toBeVisible();
  await expect(switcher.getByRole("button", { name: /Chlorophyll/i })).toHaveCount(0);

  const salinity = switcher.getByRole("button", { name: /Salinity/ });
  await salinity.click();
  await expect(salinity).toHaveAttribute("aria-pressed", "true");

  const currents = switcher.getByRole("button", { name: /Horizontal current speed/ });
  await currents.click();
  await expect(currents).toHaveAttribute("aria-pressed", "true");
  expect(pageErrors).toEqual([]);
});
