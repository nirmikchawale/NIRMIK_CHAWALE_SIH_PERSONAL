import { expect, test } from "@playwright/test";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

for (const width of [1440, 390]) {
  test(`UIX-01 active 3D view follows the real Presentation scroller at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("mpr-block-details-workspace")).toBeVisible({ timeout: 60_000 });
    const skip = page.getByRole("button", { name: "Skip journey" });
    if (await skip.isVisible().catch(() => false)) await skip.click();

    await page.locator(".workspace-mode-switcher")
      .getByRole("button", { name: "Presentation workspace" }).click();
    const root = page.locator(".ocean-workbench");
    await expect(root).toHaveAttribute("data-workspace-mode", "presentation");

    const scroller = root.locator(".station-workspace");
    const geographic = page.locator("#mpr-3d-stage");
    const water = page.getByTestId("mpr-12-water-column-section");
    await expect(scroller).toHaveCSS("overflow-y", "auto");
    await expect(geographic).toHaveAttribute("data-visualization-mode", "globe");

    // Scroll the real in-page Presentation host, not the outer document.
    await water.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    expect(await scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await expect(geographic).toHaveAttribute("data-visualization-mode", "water-column");
    await geographic.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(geographic).toHaveAttribute("data-visualization-mode", "globe");

    // Opening Present demo changes the scroll context again, without trapping
    // the active-view observer on an inactive outer container.
    await page.getByRole("button", { name: "Present demo" }).click();
    await expect(page.getByTestId("presentation-guide")).toBeVisible();
    await expect(page.locator(".workspace")).toHaveAttribute("data-judge-guide", "open");
    await water.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(geographic).toHaveAttribute("data-visualization-mode", "water-column");
    await page.getByRole("button", { name: "Close presentation guide" }).click();
    await expect(page.getByTestId("presentation-guide")).toHaveCount(0);
  });
}
