import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

function px(value: string | null): number {
  return Number.parseFloat(value ?? "0");
}

async function openExplorer(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-VIS-02 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(base + "#/explore", { waitUntil: "domcontentloaded" });
  await expect(page.locator('.ocean-workbench[data-page="explore"]')).toBeVisible();
  await expect(page.getByTestId("rui-nav-02-explorer-directory")).toBeVisible();
}

test("RUI-VIS-02 gives the canonical Explorer directory readable workstation density without changing hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplorer(page);

  const directory = page.getByTestId("rui-nav-02-explorer-directory");
  const nav = page.getByRole("navigation", { name: "3D Explorer feature directory" });
  await expect(nav.locator("button[data-explorer-directory]")).toHaveCount(11);

  const directoryStyle = await directory.evaluate((element) => {
    const style = getComputedStyle(element);
    return { radius: style.borderRadius, minHeight: style.minHeight, border: style.borderTopWidth };
  });
  expect(px(directoryStyle.radius)).toBeGreaterThanOrEqual(12);
  expect(px(directoryStyle.minHeight)).toBeGreaterThanOrEqual(60);
  expect(px(directoryStyle.border)).toBeGreaterThan(0);

  const firstDirectoryButton = nav.locator("button[data-explorer-directory]").first();
  const buttonStyle = await firstDirectoryButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { minHeight: style.minHeight, fontSize: style.fontSize };
  });
  expect(px(buttonStyle.minHeight)).toBeGreaterThanOrEqual(36);
  expect(px(buttonStyle.fontSize)).toBeGreaterThanOrEqual(10);

  await expect(page.getByRole("group", { name: "Explorer workspace mode" })).toBeVisible();
});

test("RUI-VIS-02 visually unifies source, block, controls, scene and display-range surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplorer(page);

  const sourceButton = page.getByRole("button", { name: "GLORYS baseline" });
  const sourceMinHeight = await sourceButton.evaluate((element) => getComputedStyle(element).minHeight);
  expect(px(sourceMinHeight)).toBeGreaterThanOrEqual(70);

  const blockHome = page.getByTestId("rui-nav-02-block-system");
  await expect(blockHome).toBeVisible();
  const blockRadius = await blockHome.evaluate((element) => getComputedStyle(element).borderRadius);
  expect(px(blockRadius)).toBeGreaterThanOrEqual(12);
  const blockLauncherHeight = await page.getByTestId("phase35-block-launcher").evaluate((element) => getComputedStyle(element).minHeight);
  expect(px(blockLauncherHeight)).toBeGreaterThanOrEqual(56);

  const controls = page.getByLabel("Scientific explorer controls");
  await expect(controls).toBeVisible();
  const controlRadius = await controls.evaluate((element) => getComputedStyle(element).borderRadius);
  expect(px(controlRadius)).toBeGreaterThanOrEqual(12);

  const scene = page.locator(".station-workspace > .visualization-stage");
  await expect(scene).toBeVisible();
  const sceneStyle = await scene.evaluate((element) => {
    const style = getComputedStyle(element);
    return { radius: style.borderRadius, border: style.borderTopWidth };
  });
  expect(px(sceneStyle.radius)).toBeGreaterThanOrEqual(12);
  expect(px(sceneStyle.border)).toBeGreaterThan(0);

  const colorbar = page.getByLabel("Interactive scientific colorbar");
  await expect(colorbar).toBeVisible();
  const colorbarRadius = await colorbar.evaluate((element) => getComputedStyle(element).borderRadius);
  expect(px(colorbarRadius)).toBeGreaterThanOrEqual(12);
});

test("RUI-VIS-02 preserves core Explorer actions while strengthening focus and active presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await openExplorer(page);

  const sourceButton = page.getByRole("button", { name: "GLORYS baseline" });
  await expect(sourceButton).toHaveAttribute("aria-pressed", "true");

  const workspace = page.getByRole("group", { name: "Explorer workspace mode" });
  const explorerMode = workspace.getByRole("button", { name: "Explorer workspace" });
  await expect(explorerMode).toHaveAttribute("aria-pressed", "true");

  const variables = page.getByRole("navigation", { name: "Jump to exploration controls" }).getByRole("button", { name: "Variables" });
  await variables.focus();
  await expect(variables).toBeFocused();
  const outlineWidth = await variables.evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(px(outlineWidth)).toBeGreaterThanOrEqual(2);

  await workspace.getByRole("button", { name: "Analysis Split workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "analysis");
  await workspace.getByRole("button", { name: "Explorer workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "explorer");
});

test("RUI-VIS-02 keeps Explorer touch-safe and horizontally contained on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplorer(page);

  const nav = page.getByRole("navigation", { name: "3D Explorer feature directory" });
  const firstDirectoryButton = nav.locator("button[data-explorer-directory]").first();
  const navMinHeight = await firstDirectoryButton.evaluate((element) => getComputedStyle(element).minHeight);
  expect(px(navMinHeight)).toBeGreaterThanOrEqual(44);

  const sourceButton = page.getByRole("button", { name: "GLORYS baseline" });
  await expect(sourceButton).toBeVisible();
  const sourceButtonHeight = await sourceButton.evaluate((element) => getComputedStyle(element).minHeight);
  expect(px(sourceButtonHeight)).toBeGreaterThanOrEqual(80);

  const launcherHeight = await page.getByTestId("phase35-block-launcher").evaluate((element) => getComputedStyle(element).minHeight);
  expect(px(launcherHeight)).toBeGreaterThanOrEqual(56);

  const noHorizontalOverflow = await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  expect(noHorizontalOverflow).toBe(true);

  // Exercise the exact compact source-to-workspace sequence that historically
  // exposed pointer interception after automatic scrolling.
  await page.getByRole("button", { name: "Field overview ↗", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Field overview", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close evidence inspector" }).click();

  const workspace = page.getByRole("group", { name: "Explorer workspace mode" });
  await workspace.getByRole("button", { name: "Analysis Split workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "analysis");
  await workspace.getByRole("button", { name: "Explorer workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "explorer");
});

test("RUI-VIS-02 removes decorative motion when reduced motion is requested", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExplorer(page);

  const button = page.getByRole("navigation", { name: "3D Explorer feature directory" }).locator("button[data-explorer-directory]").first();
  const transitionDuration = await button.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration).toBe("0s");
});
