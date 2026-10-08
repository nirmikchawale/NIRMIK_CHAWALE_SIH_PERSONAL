import { expect, test, type Page } from "@playwright/test";
const liveUrl = process.env.OCEANTWIN_LIVE_URL;
async function openLive(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL required");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
}
test("RUI-01 desktop shell has 72px category rail without resizing the scene on drawer open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);
  const root = page.getByTestId("app-navigation-root");
  const rail = page.getByTestId("mpr-workspace-rail");
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(rail).toBeVisible();
  await expect(rail.getByRole("button")).toHaveCount(4);
  await expect(sidebar).toBeHidden();
  const widthBefore = (await page.locator(".workspace-frame > .workspace").boundingBox())?.width;
  const rootWidth = (await root.boundingBox())?.width ?? 0;
  expect(rootWidth).toBeGreaterThanOrEqual(68);
  expect(rootWidth).toBeLessThanOrEqual(76);
  await rail.getByRole("button", { name: "Open Analyze workspaces" }).click();
  await expect(sidebar).toBeVisible();
  const widthAfter = (await page.locator(".workspace-frame > .workspace").boundingBox())?.width;
  expect(Math.abs((widthAfter ?? 0) - (widthBefore ?? 0))).toBeLessThanOrEqual(1);
  await expect(sidebar.getByRole("button", { name: "Telemetry" })).toBeVisible();
  await sidebar.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(sidebar).toBeHidden();
  await expect(rail.getByRole("button", { name: "Open Analyze workspaces" })).toHaveAttribute("aria-current", "true");

  await rail.getByRole("button", { name: "Open Analyze workspaces" }).click();
  await sidebar.getByRole("button", { name: "Model vs Observation" }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  await rail.getByRole("button", { name: "Open Data workspaces" }).click();
  await sidebar.getByRole("button", { name: "Data Lab" }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);
  await rail.getByRole("button", { name: "Open Science workspaces" }).click();
  await sidebar.getByRole("button", { name: "Science System" }).click();
  await expect(page).toHaveURL(/#\/about$/);
});

test("RUI-01 mobile launcher opens and dismisses an accessible grouped directory", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);
  const root = page.getByTestId("app-navigation-root");
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces", includeHidden: true });
  await expect(page.getByTestId("mobile-workspace-nav")).toContainText("3D Explorer");
  await expect(root).toHaveAttribute("data-mobile-open", "false");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");
  await trigger.click();
  await expect(root).toHaveAttribute("data-mobile-open", "true");
  await expect(sidebar).toBeVisible();
  await sidebar.getByRole("button", { name: "Analyze", exact: true }).click();
  await sidebar.getByRole("treeitem", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(root).toHaveAttribute("data-mobile-open", "false");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(sidebar).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sidebar).toBeHidden();
  await expect(trigger).toBeFocused();
});