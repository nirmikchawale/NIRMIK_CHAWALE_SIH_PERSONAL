import { expect, test } from "@playwright/test";
const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");
async function visit(page: import("@playwright/test").Page) {
  await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("mpr-block-details-workspace")).toBeVisible({ timeout: 40_000 });
}
for (const width of [1440, 1024, 390]) {
  test(`block details owns usable navigation and genuine shared source at ${width}px`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    const block = page.getByTestId("mpr-block-details-workspace");
    const context = page.getByTestId("scientific-context-bar");
    await expect(block).toContainText(await context.getAttribute("data-block-id") || "");
    await expect(block.getByRole("navigation", { name: "Block navigation and evidence actions" }).getByRole("button")).toHaveCount(5);
    await block.getByRole("button", { name: "Block & Region controls" }).click();
    const region = page.getByTestId("mpr-block-region-group");
    await expect(region).toHaveAttribute("open", "");
    await expect(block).toContainText(/native source/i);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(3);
  });
  test(`presentation owns full stage and readable exit and guide at ${width}px`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    const mode = page.getByTestId("mpr-04-workspace-mode-island");
    await mode.getByRole("button", { name: "Presentation workspace" }).click();
    const root = page.locator(".ocean-workbench");
    await expect(root).toHaveAttribute("data-workspace-mode", "presentation");
    const exit = page.getByRole("button", { name: "Exit presentation workspace" });
    await expect(exit).toBeVisible();
    const stage = page.locator("#mpr-3d-stage");
    const water = page.getByTestId("mpr-12-water-column-section");
    await expect(stage).toBeVisible();
    await expect(water).toBeAttached();
    const stageBox = await stage.boundingBox();
    const workBox = await page.locator(".station-workspace").boundingBox();
    expect(stageBox && workBox).toBeTruthy();
    expect(stageBox!.width).toBeGreaterThan(workBox!.width * .80);
    expect(stageBox!.height).toBeGreaterThanOrEqual(width <= 760 ? 370 : 565);
    const scrolling = await page.locator(".station-workspace").evaluate(el => ({
      client: el.clientHeight, total: el.scrollHeight, overflow: getComputedStyle(el).overflowY
    }));
    expect(scrolling.total).toBeGreaterThan(scrolling.client);
    expect(scrolling.overflow).toBe("auto");
    await exit.click();
    await expect(root).toHaveAttribute("data-workspace-mode", "explorer");
    await page.getByRole("button", { name: "Present demo" }).click();
    const guide = page.getByTestId("presentation-guide");
    await expect(guide).toBeVisible();
    await expect(guide.getByRole("button", { name: "Next →" })).toBeEnabled();
    const rect = await guide.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 2);
    await guide.getByRole("button", { name: "Next →" }).click();
    await expect(guide).toContainText("02 / 6");
    await guide.getByRole("button", { name: "Close presentation guide" }).click();
    await expect(guide).toHaveCount(0);
  });
}
