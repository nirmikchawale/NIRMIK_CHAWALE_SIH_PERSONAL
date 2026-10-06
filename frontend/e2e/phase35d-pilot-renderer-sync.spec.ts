import { expect, test } from "@playwright/test";

const ACTIVE_BLOCK_KEY = "oceancanvas-active-main-block-v1";

test("Phase 3.5D loads a genuine pilot into Geographic and Water Column 3D without synthetic fallback", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for Phase 3.5D browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  // Establish a deterministic reference context once. 3DB-07 removes the old
  // block-triggered page reload, so a window sentinel must survive activation.
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), ACTIVE_BLOCK_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => ((window as typeof window & { __blockSwitchSentinel?: string }).__blockSwitchSentinel = "alive"));

  await page.getByTestId("phase35-block-launcher").click();
  const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  const pilot = dialog.locator('[data-block-id="IO-001"]');
  await expect(pilot).toHaveAttribute("data-materialization", "pilot", { timeout: 20_000 });
  await pilot.click();
  await expect(dialog).toContainText("2004-03-15 · 2004-07-28");

  const activate = page.getByTestId("phase35-activate-pilot");
  await expect(activate).toContainText("Load IO-001");
  await activate.click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __blockSwitchSentinel?: string }).__blockSwitchSentinel)).toBe("alive");

  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), ACTIVE_BLOCK_KEY)).toBe("IO-001");

  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });
  await expect(context).toHaveAttribute("data-block-materialization", "pilot");

  const bridge = page.getByTestId("pilot-renderer-bridge");
  await expect(bridge).toBeVisible({ timeout: 30_000 });
  await expect(bridge).toContainText("SOURCE-BACKED MAIN BLOCK LIVE");
  await expect(bridge).toContainText("IO-001");
  await expect(bridge).toContainText("Geographic 3D");
  await expect(bridge).toContainText("Water Column 3D");
  await expect(bridge).toContainText("SYNCHRONIZED");
  await expect(bridge).toContainText("No synthetic values");

  const workbench = page.locator(".ocean-workbench");
  await expect(workbench).toHaveAttribute("data-explore-source", "glorys");
  await expect(page.locator(".main-block-globe-hud select[aria-label='Active main block']")).toHaveValue("IO-001");

  const openWaterColumn = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(openWaterColumn).toBeEnabled({ timeout: 30_000 });
  await openWaterColumn.click();

  const waterColumn = page.locator(".water-column-shell:not(.planned-main-block-shell)");
  await expect(waterColumn).toBeVisible({ timeout: 30_000 });
  await expect(waterColumn).not.toHaveAttribute("data-depth-count", "0");
  await expect(page.locator(".water-column-summary")).toContainText("2004-03-15", { timeout: 30_000 });
  await expect(page.getByTestId("planned-main-block-shell")).toHaveCount(0);

  const returnToBaseline = page.getByTestId("pilot-return-baseline");
  await returnToBaseline.click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __blockSwitchSentinel?: string }).__blockSwitchSentinel)).toBe("alive");
  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), ACTIVE_BLOCK_KEY)).toBe("BASE-GLORYS-001");
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "BASE-GLORYS-001", { timeout: 30_000 });
  await expect(page.getByTestId("pilot-renderer-bridge")).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
