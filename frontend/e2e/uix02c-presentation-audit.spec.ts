import { test, expect, type Page } from "@playwright/test";

// UIX-02-C: targeted Presentation layout/scroll/keyboard audit only.
// Existing scientific data and Cesium/WC renderers are never mocked or modified.
async function openExplorer(page: Page) {
  const live = process.env.OCEANTWIN_LIVE_URL;
  if (!live?.startsWith("http://") && !live?.startsWith("https://")) {
    throw new Error("UIX02-C requires absolute OCEANTWIN_LIVE_URL");
  }
  const url = live.replace(/#.*$/, "") + "#/explore";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("mpr-block-details-workspace")).toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

for (const width of [320, 768, 1440]) {
  test(`UIX02-C Presentation native stages and keyboard exit ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await openExplorer(page);
    const root = page.locator(".ocean-workbench");
    const source = await root.getAttribute("data-explore-source");
    const context = await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
    const action = page.getByTestId("mpr-04-workspace-mode-island")
      .getByRole("button", { name: "Presentation workspace" });
    await action.focus();
    await page.keyboard.press("Enter");
    await expect(root).toHaveAttribute("data-workspace-mode", "presentation");
    await expect(page.getByTestId("app-navigation-root")).toBeHidden();
    const scroller = root.locator(".station-workspace");
    const geo = page.locator("#mpr-3d-stage");
    const water = page.getByTestId("mpr-12-water-column-section");
    await expect(geo).toBeVisible();
    await expect(water).toBeVisible();
    const dims = await scroller.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight,
      extent: el.scrollHeight, overflow: getComputedStyle(el).overflowY }));
    const geoRect = await geo.boundingBox();
    const waterRect = await water.boundingBox();
    console.log("UIX02C presentation layout", width, dims, geoRect, waterRect);
    expect(dims.overflow).toBe("auto");
    expect(dims.extent).toBeGreaterThan(dims.height + 150);
    expect(geoRect!.width).toBeGreaterThan(dims.width * .86);
    expect(waterRect!.width).toBeGreaterThan(dims.width * .86);
    expect(geoRect!.height).toBeGreaterThan(370);
    expect(waterRect!.height).toBeGreaterThan(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth -
      document.documentElement.clientWidth)).toBeLessThanOrEqual(3);
    await water.evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect.poll(() => scroller.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await expect(geo).toHaveAttribute("data-visualization-mode", "water-column");
    const exit = page.getByRole("button", { name: "Exit presentation workspace" });
    await expect(exit).toBeVisible();
    await exit.focus();
    await page.keyboard.press("Enter");
    await expect(root).toHaveAttribute("data-workspace-mode", "explorer");
    await expect(root).toHaveAttribute("data-explore-source", source || "glorys");
    await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute(
      "data-block-id", context || "BASE-GLORYS-001");
  });
}

test("UIX02-C judge guide keyboard focus enters guide and returns to trigger on Escape", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplorer(page);
  const source = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const trigger = page.getByRole("button", { name: "Present demo" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const guide = page.getByTestId("presentation-guide");
  await expect(guide).toBeVisible();
  const close = guide.getByRole("button", { name: "Close presentation guide" });
  await expect(close).toBeFocused();
  const bounds = await guide.boundingBox();
  console.log("UIX02C guide bounds", bounds);
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(392);
  await page.keyboard.press("Escape");
  await expect(guide).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute(
    "data-explore-source", source || "glorys");
});
