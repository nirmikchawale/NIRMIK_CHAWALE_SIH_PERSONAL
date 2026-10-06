import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openLive(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-02 verification.");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test("RUI-02 desktop moves shared science context out of navigation into compact workspace chrome", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  const header = page.getByTestId("scientific-context-header");
  const context = page.getByTestId("scientific-context-bar");

  await expect(header).toBeVisible();
  await expect(context).toBeVisible();
  await expect(sidebar.getByTestId("scientific-context-bar")).toHaveCount(0);
  await expect(context).toHaveAttribute("data-block-id", "BASE-GLORYS-001");
  await expect(header.locator('[data-context-field="source"]')).toBeVisible();
  await expect(header.locator('[data-context-field="variable"]')).toBeVisible();
  await expect(header.locator('[data-context-field="time"]')).toBeVisible();
  await expect(header.locator('[data-context-field="depth"]')).toBeVisible();

  await sidebar.getByRole("button", { name: "Collapse workspace sidebar" }).click();
  await expect(header).toBeVisible();
  await expect(context).toHaveAttribute("data-block-id", "BASE-GLORYS-001");

  const details = header.locator('details.scientific-context-details');
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(header.getByLabel("Active materialized scientific block")).toBeVisible();
  await expect(header.getByRole("button", { name: "Copy shareable scientific context link" })).toBeVisible();
  await expect(header.locator(".scientific-context-integrity")).toContainText("No runtime scientific-data download");
  await expect(header.locator(".scientific-context-integrity")).toContainText("Scientific disclaimer:");
  await expect(page.locator(".science-footer")).not.toBeVisible();

  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await hud.getByLabel("Active main block").selectOption("IO-047");
  await expect(context).toHaveAttribute("data-block-id", "IO-047");
  await expect(context).toHaveAttribute("data-block-materialization", "planned");
  await expect(header).toContainText("Geographic selection only");
  await expect(header).toContainText(/remain anchored to verified source evidence/i);

  await sidebar.locator('[data-workspace-id="telemetry"]').click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(header).toBeVisible();
  await expect(context).toHaveAttribute("data-block-id", "IO-047");
  await expect(details).not.toHaveAttribute("open", "");
});

test("RUI-02 mobile keeps navigation and scientific context independently accessible and viewport-safe", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const navRoot = page.getByTestId("app-navigation-root");
  const dock = page.getByTestId("mobile-workspace-nav");
  const header = page.getByTestId("scientific-context-header");
  const context = page.getByTestId("scientific-context-bar");
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });

  await expect(dock).toBeVisible();
  await expect(navRoot).toHaveAttribute("data-mobile-open", "false");
  await expect(header).toBeVisible();
  await expect(context).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox!.x).toBeGreaterThanOrEqual(0);
  expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(390.5);

  const details = header.locator('details.scientific-context-details');
  await details.locator("summary").click();
  const panel = header.locator(".scientific-context-panel");
  await expect(panel).toBeVisible();
  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(390.5);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(844.5);

  await details.locator("summary").click();
  await trigger.click();
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(sidebar).toBeVisible();
  await sidebar.locator('[data-workspace-id="telemetry"]').click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(navRoot).toHaveAttribute("data-mobile-open", "false");
  await expect(header).toBeVisible();
  await expect(context).toBeVisible();
  await expect(dock).toContainText("Telemetry");
});
