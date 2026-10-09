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

test("3DB-07 integrates 112 ocean-intersecting targets into the primary Cesium Earth workflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplore(page);

  const globe = page.locator(".globe-visualization-layer.active .globe-shell");
  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await expect(globe).toHaveAttribute("data-main-block-count", "112");
  await expect(globe).toHaveAttribute("data-active-main-block", "BASE-GLORYS-001");
  await expect(hud.getByText("112 retained", { exact: true })).toBeVisible();
  await expect(hud.getByText("35 materialized", { exact: true })).toBeVisible();
  await expect(hud.getByText("28", { exact: true })).toBeVisible();

  const selector = hud.getByLabel("Active main block");
  await expect(selector.locator("option")).toHaveCount(113);
  await expect(selector.locator('option[value="BASE-GLORYS-001"]')).toHaveCount(0);
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

  const planned = page.getByTestId("mpr-12-water-column-section");
  await expect(planned).toBeVisible();
  await expect(planned).toHaveAttribute("data-linked-block", "IO-047");
  await expect(planned).toHaveAttribute("data-linked-evidence", "planned");
  await expect(planned.locator(".mpr-water-column-unavailable")).toContainText(
    "No copied, extrapolated or synthetic ocean values"
  );
  await expect(planned.locator("canvas.water-column-canvas")).toHaveCount(0);

  // The active planned target is persisted across reloads by design.
  // Explicitly clear only this test's persisted selection before checking the
  // immutable source-backed baseline; do not fabricate a scientific volume.
  await page.evaluate(() => localStorage.removeItem("oceancanvas-active-main-block-v1"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
  const verified = page.getByTestId("mpr-12-water-column-section");
  await expect(verified).toHaveAttribute("data-linked-block", "BASE-GLORYS-001");
  await expect(verified).toHaveAttribute("data-linked-evidence", "verified", { timeout: 30_000 });
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
    await expect(canvas).toBeVisible();

    const control = page.locator(".station-workspace > .control-panel");
    // The ORIGINAL controls now live in the mobile drawer, not over Cesium.
    await expect(canvas.locator('[data-testid="integrated-main-block-hud"]')).toHaveCount(0);
    if (viewport.width <= 760) {
      await expect(control).toHaveAttribute("data-mobile-open", "false");
      const quickControls = page.getByRole("toolbar", { name: "Explore quick controls" });
      await expect(quickControls.getByRole("button", { name: /Layer/ })).toBeVisible();
      await quickControls.getByRole("button", { name: /Layer/ }).click();
      await expect(control).toHaveAttribute("data-mobile-open", "true");
    }
    await expect(control.getByTestId("mpr-block-region-group")).toBeVisible();
    await expect(hud).toBeVisible();
    const [box, dockBox] = await Promise.all([hud.boundingBox(), control.boundingBox()]);
    expect(box).not.toBeNull();
    expect(dockBox).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(dockBox!.x - 2);
    expect(box!.x + box!.width).toBeLessThanOrEqual(dockBox!.x + dockBox!.width + 2);
    expect(box!.y).toBeGreaterThanOrEqual(dockBox!.y - 2);
    if (viewport.width <= 760) {
      await control.getByRole("button", { name: "Close explorer controls" }).click();
      await expect(control).toHaveAttribute("data-mobile-open", "false");
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
