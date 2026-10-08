import { expect, test } from "@playwright/test";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

for (const width of [1440, 1024, 390, 320]) {
  test(`Block & Region owns the real globe controls without obscuring Cesium at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    const skip = page.getByRole("button", { name: "Skip journey" });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    const globe = page.locator(".globe-visualization-layer.active .globe-shell");
    const cesium = globe.locator(".cesium-host");
    const dock = page.locator(".station-workspace > .control-panel");
    const region = dock.getByTestId("mpr-block-region-group");
    const hud = region.getByTestId("integrated-main-block-hud");

    await expect(globe).toBeVisible();
    await expect(cesium).toBeVisible();
    await expect(globe.locator(".main-block-globe-hud")).toHaveCount(0);
    await expect(page.getByTestId("integrated-main-block-hud")).toHaveCount(1);
    await expect(region).toHaveAttribute("open", "");

    if (width <= 760) {
      // Mobile owns a genuine on-demand controls sheet; no always-on globe overlay.
      await expect(dock).toHaveAttribute("data-mobile-open", "false");
      await page.locator(".mobile-explore-tray button").first().click();
      await expect(dock).toHaveAttribute("data-mobile-open", "true");
    }
    await expect(hud).toBeVisible();
    await expect(region.locator("summary")).toHaveText("Block & Region");
    await expect(hud.getByLabel("Active main block")).toBeEnabled();

    const [dockBox, hudBox] = await Promise.all([dock.boundingBox(), hud.boundingBox()]);
    expect(dockBox && hudBox).toBeTruthy();
    expect(hudBox!.x).toBeGreaterThanOrEqual(dockBox!.x - 2);
    expect(hudBox!.x + hudBox!.width).toBeLessThanOrEqual(dockBox!.x + dockBox!.width + 2);

    await hud.getByLabel("Active main block").selectOption("IO-047");
    await expect(globe).toHaveAttribute("data-active-main-block", "IO-047");
    await expect(globe).toHaveAttribute("data-active-main-block-materialization", "planned");
    await expect(hud).toContainText(/no copied or synthetic ocean values/i);

    await region.locator("summary").click();
    await expect(region).not.toHaveAttribute("open", "");
    await dock.getByRole("navigation", { name: "Geographic tools" })
      .getByRole("button", { name: /Block & region/ }).click();
    await expect(region).toHaveAttribute("open", "");
    await expect(hud).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
