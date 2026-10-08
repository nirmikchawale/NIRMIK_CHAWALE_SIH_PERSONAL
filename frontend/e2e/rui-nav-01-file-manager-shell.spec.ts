import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
async function openLive(page: Page, hash = "#/explore") {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL required");
  await page.goto(liveUrl.replace(/#.*$/, "") + hash, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
}

test("RUI-NAV-01 canonical hierarchy survives adaptive rail and overlay", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLive(page);
  const rail = page.getByTestId("mpr-workspace-rail");
  await expect(rail.getByRole("button")).toHaveCount(4);
  await rail.getByRole("button", { name: "Open Explore workspaces" }).click();
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  const tree = page.getByRole("tree", { name: "Ocean Canvas feature directory" });
  const breadcrumb = page.getByRole("navigation", { name: "Workspace breadcrumb" });
  await expect(sidebar).toBeVisible();
  await expect(tree.locator("[data-nav-group]")).toHaveCount(4);
  await expect(tree.locator("[role=treeitem]")).toHaveCount(6);
  await expect(tree.locator('[data-directory-view="explore"]')).toBeVisible();
  await expect(tree.locator('[data-directory-view="analyse"]')).toBeHidden();
  await expect(breadcrumb).toContainText("Ocean Canvas");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("3D Explorer");
  await sidebar.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(tree.locator('[data-directory-view="analyse"]')).toBeVisible();
  await expect(tree.locator('[data-directory-view="explore"]')).toBeHidden();
  await expect(tree.getByRole("treeitem", { name: "Model vs Observation" })).toBeVisible();
  await tree.getByRole("button", { name: "Model vs Observation" }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  await expect(page.getByTestId("app-navigation-root")).toHaveAttribute("data-nav-directory", "analyse");
  await expect(sidebar).toBeHidden();
  await expect(rail.getByRole("button", { name: "Open Analyze workspaces" })).toHaveAttribute("aria-current", "true");
  // The adaptive drawer may unmount when closed; in either case stale source names
  // must not leak into any workspace directory tree.
  await expect(
    page.locator('[data-testid="workspace-directory-tree"]').filter({ hasText: "GLORYS12V1" })
  ).toHaveCount(0);
});

test("RUI-NAV-01 preserves all six canonical route ids and deep links", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  for (const [hash, label, group, action] of [
    ["#/explore", "3D Explorer", "explore", "Explore"],
    ["#/telemetry", "Telemetry", "analyse", "Analyze"],
    ["#/compare", "Model vs Observation", "analyse", "Analyze"],
    ["#/anomaly", "Anomaly Screening", "analyse", "Analyze"],
    ["#/data-lab", "Data Lab", "data", "Data"],
    ["#/about", "Science System", "science", "Science"]
  ]) {
    await openLive(page, hash);
    const root = page.getByTestId("app-navigation-root");
    await expect(root).toHaveAttribute("data-nav-directory", group);
    await page.getByRole("button", { name: `Open ${action} workspaces` }).click();
    const tree = page.getByRole("tree", { name: "Ocean Canvas feature directory" });
    await expect(tree.getByRole("treeitem", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Workspace breadcrumb" })
      .locator('[aria-current="page"]')).toHaveText(label);
    await page.getByRole("button", { name: "Dismiss workspace directory" }).click();
  }
});

test("RUI-NAV-01 mobile drawer can switch categories and restores trigger focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLive(page, "#/anomaly");
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  await expect(page.getByTestId("mobile-workspace-nav")).toContainText("Anomaly Screening");
  await trigger.click();
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("navigation", { name: "Workspace breadcrumb" })).toContainText("Analyse");
  await sidebar.getByRole("button", { name: "Science", exact: true }).click();
  await sidebar.getByRole("treeitem", { name: "Science System" }).click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(page.getByTestId("app-navigation-root")).toHaveAttribute("data-mobile-open", "false");
  await expect(trigger).toBeFocused();
});