import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

test("Phase 3 Arabian Sea atlas exposes twelve verified 3D sectors", async ({ page }) => {
  test.setTimeout(180_000);
  if (!liveUrl) {
    throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  }

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${liveUrl.replace(/\/$/, "")}/#/explore`, { waitUntil: "domcontentloaded" });

  const launcher = page.getByTestId("phase3-atlas-launcher");
  await expect(launcher).toBeVisible();
  await expect(launcher).toContainText("12 verified sectors");
  await launcher.click();

  const dialog = page.getByRole("dialog", { name: "Arabian Sea 3D Sector Atlas" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("not twelve independent forecasts or model runs");

  const grid = page.getByTestId("phase3-sector-grid");
  await expect(grid).toBeVisible({ timeout: 30_000 });
  const sectors = grid.locator(".phase3-sector-card");
  await expect(sectors).toHaveCount(12);
  await expect(sectors.first()).toContainText("AS-01");
  await expect(sectors.last()).toContainText("AS-12");

  await expect(sectors.first()).toHaveAttribute("aria-pressed", "false");
  await sectors.first().click();
  await expect(sectors.first()).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator(".phase3-atlas-footer")).toContainText("AS-01");

  await dialog.getByRole("button", { name: "Salinity" }).click();
  await expect(dialog.locator(".phase3-atlas-status")).toContainText("Salinity", { timeout: 30_000 });
  await expect(grid.locator(".phase3-sector-card")).toHaveCount(12);

  await dialog.getByRole("button", { name: "Current speed" }).click();
  await expect(dialog.locator(".phase3-atlas-status")).toContainText("Current speed", { timeout: 30_000 });
  await expect(grid.locator(".phase3-sector-card")).toHaveCount(12);

  await dialog.getByRole("button", { name: "Close 3D sector atlas" }).click();
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeVisible();

  expect(pageErrors).toEqual([]);
});
