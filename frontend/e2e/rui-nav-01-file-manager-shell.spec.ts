import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openLive(page: Page, hash = "#/explore") {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-01 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(`${base}${hash}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
}

test("RUI-NAV-01 exposes the frozen file-manager tree and canonical breadcrumb path", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  const tree = page.getByRole("tree", { name: "Ocean Canvas feature directory" });
  const breadcrumb = page.getByRole("navigation", { name: "Workspace breadcrumb" });

  await expect(tree).toBeVisible();
  await expect(tree.locator("[data-nav-group]")).toHaveCount(4);
  await expect(tree.locator("[data-nav-group]").nth(0)).toHaveAttribute("data-nav-group", "EXPLORE");
  await expect(tree.locator("[data-nav-group]").nth(1)).toHaveAttribute("data-nav-group", "ANALYSE");
  await expect(tree.locator("[data-nav-group]").nth(2)).toHaveAttribute("data-nav-group", "DATA");
  await expect(tree.locator("[data-nav-group]").nth(3)).toHaveAttribute("data-nav-group", "SCIENCE");

  await expect(tree.locator('[data-directory-view="explore"]')).toContainText("3D Explorer");
  await expect(tree.locator('[data-directory-view="analyse"]')).toContainText("Telemetry");
  await expect(tree.locator('[data-directory-view="analyse"]')).toContainText("Model vs Observation");
  await expect(tree.locator('[data-directory-view="analyse"]')).toContainText("Anomaly Screening");
  await expect(tree.locator('[data-directory-view="data"]')).toContainText("Data Lab");
  await expect(tree.locator('[data-directory-view="science"]')).toContainText("Science System");

  await expect(breadcrumb).toContainText("Ocean Canvas");
  await expect(breadcrumb).toContainText("Explore");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("3D Explorer");

  await sidebar.getByRole("treeitem", { name: "Model vs Observation" }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  await expect(page.getByTestId("app-navigation-root")).toHaveAttribute("data-nav-directory", "analyse");
  await expect(breadcrumb).toContainText("Analyse");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Model vs Observation");

  // Scientific context remains workspace-owned; the navigation tree is hierarchy only.
  await expect(tree).not.toContainText("GLORYS12V1");
  await expect(tree).not.toContainText("INCOIS MULTI-TIME");
});

test("RUI-NAV-01 preserves all production route ids and deep links", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const routes = [
    ["#/explore", "3D Explorer", "explore"],
    ["#/telemetry", "Telemetry", "analyse"],
    ["#/compare", "Model vs Observation", "analyse"],
    ["#/anomaly", "Anomaly Screening", "analyse"],
    ["#/data-lab", "Data Lab", "data"],
    ["#/about", "Science System", "science"]
  ] as const;

  for (const [hash, label, directory] of routes) {
    await openLive(page, hash);
    await expect(page.getByRole("treeitem", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("app-navigation-root")).toHaveAttribute("data-nav-directory", directory);
    await expect(page.getByRole("navigation", { name: "Workspace breadcrumb" }).locator('[aria-current="page"]')).toHaveText(label);
  }
});

test("RUI-NAV-01 mobile drawer retains directory and breadcrumb semantics", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/anomaly");

  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  await expect(page.getByTestId("mobile-workspace-nav")).toContainText("ANALYSE");
  await expect(page.getByTestId("mobile-workspace-nav")).toContainText("Anomaly Screening");

  await trigger.click();
  const breadcrumb = page.getByRole("navigation", { name: "Workspace breadcrumb" });
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb).toContainText("Ocean Canvas");
  await expect(breadcrumb).toContainText("Analyse");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Anomaly Screening");

  await page.getByRole("treeitem", { name: "Science System" }).click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(page.getByTestId("app-navigation-root")).toHaveAttribute("data-nav-directory", "science");
});
