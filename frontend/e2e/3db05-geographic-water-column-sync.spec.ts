import { expect, test } from "@playwright/test";

import { CURRENT_VERIFIED_BASELINE } from "../src/main-block-engine";
import {
  MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION,
  deriveMainBlockWaterColumnSyncContext
} from "../src/main-block-runtime";

const ACTIVE_BLOCK_KEY = "oceancanvas-active-main-block-v1";

test("3DB-05 freezes baseline, pilot and planned Water Column synchronization states", () => {
  expect(MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION).toBe("3db-05-v1");

  const baseline = deriveMainBlockWaterColumnSyncContext(CURRENT_VERIFIED_BASELINE.id);
  expect(baseline.blockId).toBe("BASE-GLORYS-001");
  expect(baseline.materialization).toBe("verified-baseline");
  expect(baseline.mode).toBe("scientific-volume");
  expect(baseline.geographicReady).toBe(true);
  expect(baseline.waterColumnReady).toBe(true);
  expect(baseline.scientificVolumeAllowed).toBe(true);
  expect(baseline.evidenceClass).toBe("immutable-verified-baseline");
  expect(baseline.validationLevel).toBe("model-observation");
  expect(baseline.availableDates).toEqual(["2024-01-02"]);

  const pilot = deriveMainBlockWaterColumnSyncContext("IO-001");
  expect(pilot.blockId).toBe("IO-001");
  expect(pilot.materialization).toBe("pilot");
  expect(pilot.mode).toBe("scientific-volume");
  expect(pilot.geographicReady).toBe(true);
  expect(pilot.waterColumnReady).toBe(true);
  expect(pilot.scientificVolumeAllowed).toBe(true);
  expect(pilot.evidenceClass).toBe("checksum-verified-pilot");
  expect(pilot.validationLevel).toBe("source-integrity-renderer");
  expect(pilot.availableDates).toEqual(["2004-03-15", "2004-07-28"]);

  const planned = deriveMainBlockWaterColumnSyncContext("IO-003");
  expect(planned.blockId).toBe("IO-003");
  expect(planned.materialization).toBe("planned");
  expect(planned.mode).toBe("geographic-shell");
  expect(planned.geographicReady).toBe(true);
  expect(planned.waterColumnReady).toBe(false);
  expect(planned.scientificVolumeAllowed).toBe(false);
  expect(planned.evidenceClass).toBe("none");
  expect(planned.validationLevel).toBe("none");
  expect(planned.availableDates).toEqual([]);
});

test("3DB-05 Water Column presents the active pilot identity instead of the verified baseline identity", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-05 browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(({ key }) => localStorage.setItem(key, "IO-001"), { key: ACTIVE_BLOCK_KEY });
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });
  await expect(context).toHaveAttribute("data-block-materialization", "pilot");

  const trigger = page.getByTestId("pilot-block-details-trigger");
  await expect(trigger).toBeVisible({ timeout: 30_000 });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const bridge = page.getByTestId("pilot-renderer-bridge");
  await expect(bridge).toHaveAttribute("data-water-column-sync", "ready", { timeout: 30_000 });
  await expect(bridge).toHaveAttribute("data-water-column-sync-version", "3db-05-v1");
  await page.getByRole("button", { name: "Close source-backed main block details" }).last().click();
  await expect(bridge).toHaveCount(0);

  const openWaterColumn = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(openWaterColumn).toBeEnabled({ timeout: 30_000 });
  await openWaterColumn.click();

  const shell = page.locator(".water-column-shell:not(.planned-main-block-shell):not(.water-column-loading)");
  await expect(shell).toBeVisible({ timeout: 30_000 });
  await expect(shell).toHaveAttribute("data-main-block-id", "IO-001");
  await expect(shell).toHaveAttribute("data-materialization", "pilot");
  await expect(shell).toHaveAttribute("data-water-column-sync", "synchronized");
  await expect(shell).toHaveAttribute("data-water-column-sync-version", "3db-05-v1");
  await expect(shell).toHaveAttribute("data-water-column-evidence-class", "checksum-verified-pilot");

  const identity = shell.locator(".water-column-main-block-context");
  await expect(identity).toContainText("IO-001 · SOURCE-BACKED PILOT VOLUME");
  await expect(identity).toContainText("no independent Argo validation claim");
  await expect(identity).not.toContainText("BASE-GLORYS-001");
  await expect(identity).not.toContainText("VERIFIED VOLUME");
  await expect(page.locator(".water-column-summary")).toContainText("2004-03-15", { timeout: 30_000 });
  await expect(page.getByTestId("planned-main-block-shell")).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("3DB-05 keeps a planned geographic block synchronized as an empty Water Column shell", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-05 browser verification.");

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(({ key }) => localStorage.setItem(key, "IO-003"), { key: ACTIVE_BLOCK_KEY });
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-003", { timeout: 30_000 });
  const openWaterColumn = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(openWaterColumn).toBeEnabled({ timeout: 30_000 });
  await openWaterColumn.click();

  const shell = page.locator(".planned-main-block-shell");
  await expect(shell).toBeVisible({ timeout: 30_000 });
  await expect(shell).toHaveAttribute("data-main-block-id", "IO-003");
  await expect(shell).toHaveAttribute("data-materialization", "planned");
  await expect(shell).toHaveAttribute("data-scientific-values", "0");
  await expect(shell).toContainText("PLANNED TARGET · NO MATERIALIZED VOLUME");
  await expect(shell).toContainText("0 bundled for this target; none copied from the baseline");
  await expect(page.locator(".water-column-shell:not(.planned-main-block-shell)")).toHaveCount(0);
});
