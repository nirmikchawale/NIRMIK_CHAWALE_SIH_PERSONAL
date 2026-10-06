import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import {
  MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION,
  assertExactNativeDepthAxisMatch,
  deriveMainBlockDepthIntegration,
  resolveNativeDepthSelection
} from "../src/main-block-depth";
import { resolveMainBlock } from "../src/main-block-runtime";

interface DepthPayload {
  block_id: string;
  coordinates: { depth_m: number[]; depth_positive: "down" };
  shape: { depth: number };
  integrity: { synthetic_depths: boolean };
}

function payload(path: string): DepthPayload {
  return JSON.parse(readFileSync(new URL(`../public/main-blocks/data/${path}`, import.meta.url), "utf8")) as DepthPayload;
}

test("3DB-06 resolves exact source-backed pilot depth axes and keeps planned blocks locked", () => {
  expect(MAIN_BLOCK_MULTI_DEPTH_INTEGRATION_VERSION).toBe("3db-06-v1");

  const first = payload("IO-001/2004-03-15.json");
  const second = payload("IO-001/2004-07-28.json");
  const addedPilot = payload("IO-029/2004-03-15.json");

  expect(first.integrity.synthetic_depths).toBe(false);
  expect(second.integrity.synthetic_depths).toBe(false);
  expect(addedPilot.integrity.synthetic_depths).toBe(false);

  const pilot = resolveMainBlock("IO-001");
  const integration = deriveMainBlockDepthIntegration(pilot, {
    depthsM: first.coordinates.depth_m,
    depthPositive: first.coordinates.depth_positive,
    declaredLevelCount: first.shape.depth
  });

  expect(integration.ready).toBe(true);
  if (!integration.ready) throw new Error("IO-001 multi-depth integration unexpectedly locked.");
  expect(integration.mode).toBe("native-multi-depth");
  expect(integration.resolution).toBe("payload-resolved");
  expect(integration.depthPositive).toBe("down");
  expect(integration.levelCount).toBe(31);
  expect(integration.minimumM).toBeCloseTo(0.494025, 6);
  expect(integration.maximumM).toBeCloseTo(453.937714, 6);

  assertExactNativeDepthAxisMatch("IO-001", first.coordinates.depth_m, second.coordinates.depth_m);
  assertExactNativeDepthAxisMatch("IO-029", first.coordinates.depth_m, addedPilot.coordinates.depth_m);

  expect(resolveNativeDepthSelection("IO-001", first.coordinates.depth_m, "down", 0, first.shape.depth).depthM)
    .toBeCloseTo(0.494025, 6);
  expect(resolveNativeDepthSelection("IO-001", first.coordinates.depth_m, "down", 18, first.shape.depth).depthM)
    .toBeCloseTo(55.76429, 5);
  expect(resolveNativeDepthSelection("IO-001", first.coordinates.depth_m, "down", 30, first.shape.depth).depthM)
    .toBeCloseTo(453.937714, 6);

  const planned = deriveMainBlockDepthIntegration(resolveMainBlock("IO-003"));
  expect(planned.ready).toBe(false);
  expect(planned.mode).toBe("locked");
  expect(planned.levelCount).toBe(0);
  expect(planned.depthsM).toEqual([]);
  expect(() => deriveMainBlockDepthIntegration(resolveMainBlock("IO-003"), {
    depthsM: first.coordinates.depth_m,
    depthPositive: "down",
    declaredLevelCount: first.shape.depth
  })).toThrow(/planned block IO-003 cannot receive scientific depth values/);
});

test("3DB-06 live pilot Water Column uses the complete native depth axis", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-06 browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("oceancanvas-active-main-block-v1", "IO-001"));
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });
  await expect(page.locator(".depth-controller-meta")).toContainText("31 verified levels", { timeout: 30_000 });
  await expect(page.locator(".selected-depth-hero strong")).toContainText("55.76 m", { timeout: 30_000 });

  const openWaterColumn = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(openWaterColumn).toBeEnabled({ timeout: 30_000 });
  await openWaterColumn.click();

  const shell = page.locator(".water-column-shell:not(.planned-main-block-shell):not(.water-column-loading)");
  await expect(shell).toBeVisible({ timeout: 30_000 });
  await expect(shell).toHaveAttribute("data-main-block-id", "IO-001");
  await expect(shell).toHaveAttribute("data-materialization", "pilot");
  await expect(shell).toHaveAttribute("data-depth-count", "31");
  await expect(shell.locator(".water-column-summary")).toContainText("31 genuine depth levels");
  await expect(shell.locator(".water-column-selected strong")).toContainText("55.76 m");
  await expect(shell.locator(".water-column-selected small")).toContainText("positive down");

  expect(pageErrors).toEqual([]);
});
