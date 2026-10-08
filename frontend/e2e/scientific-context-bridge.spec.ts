import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openExplore(page: import("@playwright/test").Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench").first()).toBeVisible();
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test("Phase 5.0 keeps block truth visible while analytics use verified evidence", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplore(page);

  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toBeVisible();
  await expect(context).toHaveAttribute("data-block-id", "BASE-GLORYS-001");

  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await hud.getByLabel("Active main block").selectOption("IO-047");
  await expect(context).toHaveAttribute("data-block-id", "IO-047");
  await expect(context).toHaveAttribute("data-block-materialization", "planned");
  await context.locator("details").evaluate((element: HTMLDetailsElement) => { element.open = true; });
  await expect(context).toContainText("Geographic selection only");
  await expect(context).toContainText(/remain anchored to verified source evidence/i);

  await page.getByRole("button", { name: "Open Analyze workspaces" }).click();
  await page.getByRole("navigation", { name: "Ocean Canvas workspaces" }).locator('[data-workspace-id="telemetry"]').click();
  await expect(page.getByRole("heading", { name: "Depth & telemetry workspace" })).toBeVisible();
  await expect(context).toHaveAttribute("data-source-mode", "glorys");
  await page.getByRole("button", { name: "Salinity telemetry" }).click();
  await expect(context).toHaveAttribute("data-variable", "so");

  await page.getByRole("button", { name: "Open Analyze workspaces" }).click();
  await page.getByRole("navigation", { name: "Ocean Canvas workspaces" }).locator('[data-workspace-id="anomaly"]').click();
  const anomaly = page.locator('main[data-page="anomaly"]');
  await expect(anomaly).toBeVisible();
  await expect(anomaly).toHaveAttribute("data-time-index", "0");
  const anomalyTime = page.getByRole("slider", { name: "Anomaly time" });
  await expect(anomalyTime).toBeVisible();
  await expect(anomalyTime).toBeDisabled();
});

test("Phase 5.0 shared context stays viewport-safe on mobile", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplore(page);
  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
