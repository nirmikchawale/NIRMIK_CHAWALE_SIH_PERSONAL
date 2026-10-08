import { expect, test, type Page } from "@playwright/test";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

async function openExplorer(page: Page) {
  await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const details = page.getByTestId("mpr-block-details-workspace");
  await expect(details).toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  return details;
}

for (const width of [1440, 1024, 390]) {
  test(`Block Details really owns a dedicated full-width row at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    const details = await openExplorer(page);
    const workspace = page.locator(".station-workspace");
    const catalog = page.getByTestId("rui-nav-02-block-system");
    const context = page.getByTestId("scientific-context-bar");
    await expect(details).toHaveCount(1);
    await expect(workspace.locator(":scope > .mpr-block-details-workspace")).toHaveCount(1);
    await expect(catalog.locator(".mpr-block-details-workspace")).toHaveCount(0);
    await expect(catalog).toBeVisible();
    const [box, gridBox, catalogBox] = await Promise.all([
      details.boundingBox(), workspace.boundingBox(), catalog.boundingBox()
    ]);
    expect(box && gridBox && catalogBox).toBeTruthy();
    expect(box!.width, "Details must not be squeezed into a catalog column").toBeGreaterThan(gridBox!.width * .90);
    expect(box!.y + box!.height, "Details must have a separate row BEFORE the catalog").toBeLessThanOrEqual(catalogBox!.y + 2);
    await expect(details).toContainText((await context.getAttribute("data-block-id")) || "BASE-GLORYS-001");
    const nav = details.getByRole("navigation", { name: "Block navigation and evidence actions" });
    await expect(nav.getByRole("button")).toHaveCount(5);
    await nav.getByRole("button", { name: "Block & Region controls" }).click();
    await expect(page.getByTestId("mpr-block-region-group")).toHaveAttribute("open", "");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "Block Details must not create horizontal viewport overflow").toBeLessThanOrEqual(3);
    await details.scrollIntoViewIfNeeded();
    await testInfo.attach(`block-details-${width}.png`, {
      body: await page.screenshot({ animations: "disabled" }), contentType: "image/png"
    });
  });

  test(`Presentation has complete full-width 3D screens, scroll, and readable guide at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await openExplorer(page);
    const mode = page.getByTestId("mpr-04-workspace-mode-island");
    await mode.getByRole("button", { name: "Presentation workspace" }).click();
    const root = page.locator(".ocean-workbench");
    await expect(root).toHaveAttribute("data-workspace-mode", "presentation");
    // P0 historical bug: hiding only .feature-rail leaves the 100%-height
    // .app-navigation-root flex child occupying the entire presentation screen.
    await expect(page.getByTestId("app-navigation-root")).toBeHidden();
    await expect(page.locator(".workspace-frame > .scientific-context-header")).toBeHidden();
    const exit = page.getByRole("button", { name: "Exit presentation workspace" });
    await expect(exit).toBeVisible();
    const workspace = page.locator(".station-workspace");
    const globe = page.locator("#mpr-3d-stage");
    const water = page.getByTestId("mpr-12-water-column-section");
    await expect(globe).toBeVisible();
    await expect(water).toBeVisible();
    const [stageRect, parentRect, waterRect, waterCanvasRect] = await Promise.all([
      globe.boundingBox(), workspace.boundingBox(), water.boundingBox(),
      water.locator(".mpr-water-column-visualization").boundingBox()
    ]);
    expect(stageRect && parentRect && waterRect && waterCanvasRect).toBeTruthy();
    expect(stageRect!.width, "Globe should not be stuck in one half of screen").toBeGreaterThan(parentRect!.width * .90);
    expect(stageRect!.height).toBeGreaterThanOrEqual(width <= 760 ? 435 : 625);
    expect(waterRect!.width, "Water Column should have its own full-width screen").toBeGreaterThan(parentRect!.width * .90);
    expect(waterCanvasRect!.width, "Water renderer should not be shrunk into a half-width grid cell")
      .toBeGreaterThan(waterRect!.width * .93);
    const scrollState = await workspace.evaluate(el => ({
      client: el.clientHeight, scroll: el.scrollHeight, overflowY: getComputedStyle(el).overflowY
    }));
    expect(scrollState.scroll).toBeGreaterThan(scrollState.client);
    expect(scrollState.overflowY).toBe("auto");
    await globe.scrollIntoViewIfNeeded();
    await testInfo.attach(`presentation-geographic-${width}.png`, {
      body: await page.screenshot({ animations: "disabled" }), contentType: "image/png"
    });
    await water.scrollIntoViewIfNeeded();
    await testInfo.attach(`presentation-water-${width}.png`, {
      body: await page.screenshot({ animations: "disabled" }), contentType: "image/png"
    });
    await exit.click();
    await expect(root).toHaveAttribute("data-workspace-mode", "explorer");

    await page.getByRole("button", { name: "Present demo" }).click();
    const guide = page.getByTestId("presentation-guide");
    await expect(guide).toBeVisible();
    await expect(page.locator(".workspace")).toHaveAttribute("data-judge-guide", "open");
    const [guideBox, sceneBox] = await Promise.all([
      guide.boundingBox(), page.locator(".station-workspace").boundingBox()
    ]);
    expect(guideBox && sceneBox).toBeTruthy();
    expect(guideBox!.x).toBeGreaterThanOrEqual(-1);
    expect(guideBox!.x + guideBox!.width).toBeLessThanOrEqual(width + 2);
    // Unlike the old floating panel, the judge guide must occupy separate
    // vertical space and NEVER cover a single pixel of the current scene.
    expect(guideBox!.y + guideBox!.height).toBeLessThanOrEqual(sceneBox!.y + 2);
    await guide.getByRole("button", { name: "Next →" }).click();
    await expect(guide).toContainText("02 / 6");
    await guide.getByRole("button", { name: "Close presentation guide" }).click();
    await expect(guide).toHaveCount(0);
  });
}
