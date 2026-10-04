import { expect, test } from "@playwright/test";

async function openExplore(page: import("@playwright/test").Page) {
  await page.goto(process.env.OCEANTWIN_LIVE_URL!, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ timeout: 15_000 });
    await expect(page.locator(".globe-shell[data-journey-phase]")).toHaveAttribute("data-journey-phase", "region", { timeout: 10_000 });
  }
}

test("Phase 3.5A-G integrates all 140 targets into the primary Cesium Earth workflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplore(page);

  const globe = page.locator(".globe-visualization-layer.active .globe-shell");
  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await expect(globe).toHaveAttribute("data-main-block-count", "140");
  await expect(globe).toHaveAttribute("data-active-main-block", "BASE-GLORYS-001");
  await expect(hud.getByText("140 blocks", { exact: true })).toBeVisible();
  await expect(hud.getByText("0 materialized", { exact: true })).toBeVisible();
  await expect(hud.getByText("1 baseline", { exact: true })).toBeVisible();

  const selector = hud.getByLabel("Active main block");
  await expect(selector.locator("option")).toHaveCount(141);
  await selector.selectOption("IO-047");

  await expect(globe).toHaveAttribute("data-active-main-block", "IO-047");
  await expect(globe).toHaveAttribute("data-active-main-block-materialization", "planned");
  await expect(hud.getByText("Planned target", { exact: true })).toBeVisible();
  await expect(hud.getByText(/no copied or synthetic ocean values/i)).toBeVisible();
});

test("planned target enters the same Water Column 3D workflow without fabricated science", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplore(page);

  const hud = page.getByTestId("integrated-main-block-hud");
  await hud.getByLabel("Active main block").selectOption("IO-047");
  await hud.getByRole("button", { name: "Open in Water Column 3D" }).click();

  const planned = page.locator('.planned-main-block-shell[data-main-block-id="IO-047"]');
  await expect(planned).toBeVisible();
  await expect(planned).toHaveAttribute("data-materialization", "planned");
  await expect(planned).toHaveAttribute("data-scientific-values", "0");
  await expect(planned.getByText("PLANNED TARGET · NO MATERIALIZED VOLUME", { exact: true })).toBeVisible();
  await expect(planned.getByText(/none copied from the baseline/i)).toBeVisible();

  await planned.getByRole("button", { name: "Return to verified baseline volume" }).click();
  const verified = page.locator('.water-column-visualization-layer.active .water-column-shell[data-main-block-id="BASE-GLORYS-001"]');
  await expect(verified).toBeVisible();
  await expect(verified).toHaveAttribute("data-materialization", "verified-baseline");
  await expect(verified.locator("canvas.water-column-canvas")).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 }
]) {
  test(`integrated main-block controls stay viewport-safe at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openExplore(page);

    const hud = page.getByTestId("integrated-main-block-hud");
    const canvas = page.locator(".globe-visualization-layer.active .cesium-host");
    await expect(hud).toBeVisible();
    await expect(canvas).toBeVisible();

    const [box, canvasBox] = await Promise.all([hud.boundingBox(), canvas.boundingBox()]);
    expect(box).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(canvasBox!.x - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(canvasBox!.x + canvasBox!.width + 1);
    expect(box!.y).toBeGreaterThanOrEqual(canvasBox!.y - 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(canvasBox!.y + canvasBox!.height + 1);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
