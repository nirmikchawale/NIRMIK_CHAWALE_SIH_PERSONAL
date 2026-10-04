import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openLive(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI shell verification.");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
}

test("RUI-01 desktop shell provides grouped collapsible left navigation without changing route ids", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const root = page.getByTestId("app-navigation-root");
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(root).toHaveAttribute("data-collapsed", "false");
  await expect(sidebar).toBeVisible();

  for (const group of ["EXPLORE", "ANALYSE", "DATA", "EVIDENCE"]) {
    await expect(sidebar.locator(`[data-nav-group="${group}"]`)).toBeVisible();
  }
  await expect(sidebar.locator('[data-nav-group="DATA"]')).toContainText("Data Lab");
  await expect(sidebar.locator('[data-nav-group="EVIDENCE"]')).toContainText("Science & System");
  await expect(sidebar.getByRole("button", { name: "3D Explorer" })).toHaveAttribute("aria-current", "page");

  const expandedWidth = (await root.boundingBox())?.width ?? 0;
  await sidebar.getByRole("button", { name: "Collapse workspace sidebar" }).click();
  await expect(root).toHaveAttribute("data-collapsed", "true");
  const collapsedWidth = (await root.boundingBox())?.width ?? expandedWidth;
  expect(collapsedWidth).toBeLessThan(expandedWidth);

  await sidebar.getByRole("button", { name: "Expand workspace sidebar" }).click();
  await expect(root).toHaveAttribute("data-collapsed", "false");

  await sidebar.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(page.locator('main[data-page="telemetry"]')).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Telemetry" })).toHaveAttribute("aria-current", "page");

  await sidebar.getByRole("button", { name: "Model vs Observation" }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  await expect(page.locator('main[data-page="compare"]')).toBeVisible();

  await sidebar.getByRole("button", { name: "Data Lab" }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);
  await expect(page.locator('main[data-page="data-lab"]')).toBeVisible();

  await sidebar.getByRole("button", { name: "Science & System" }).click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(page.locator('main[data-page="about"]')).toBeVisible();
});

test("RUI-01 mobile shell uses a compact dock and dismissible navigation drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const root = page.getByTestId("app-navigation-root");
  const dock = page.getByTestId("mobile-workspace-nav");
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces", includeHidden: true });

  await expect(dock).toBeVisible();
  await expect(dock).toContainText("3D Explorer");
  await expect(root).toHaveAttribute("data-mobile-open", "false");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");

  await trigger.click();
  await expect(root).toHaveAttribute("data-mobile-open", "true");
  await expect(sidebar).not.toHaveAttribute("aria-hidden", "true");
  await expect(sidebar).toBeVisible();

  await sidebar.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(root).toHaveAttribute("data-mobile-open", "false");
  await expect(dock).toContainText("Telemetry");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(root).toHaveAttribute("data-mobile-open", "true");
  await page.keyboard.press("Escape");
  await expect(root).toHaveAttribute("data-mobile-open", "false");
  await expect(trigger).toBeFocused();
});
