import { expect, test } from "@playwright/test";

const target = process.env.OCEANTWIN_LIVE_URL;
const openExplorer = async (page: import("@playwright/test").Page) => {
  if (!target) throw new Error("OCEANTWIN_LIVE_URL required");
  await page.goto(target.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-visualization-layer.active .globe-shell");
  await expect(globe).toBeVisible({ timeout: 40_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  return globe;
};

for (const width of [390, 1024, 1327, 1440]) {
  test(`Geographic toolbar is aligned and wheel-scrollable at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const globe = await openExplorer(page);
    const toolbar = globe.getByTestId("geographic-renderer-toolbar");
    await expect(toolbar).toBeVisible();
    const journey = toolbar.locator(".ocean-journey");
    const orientation = toolbar.locator(".camera-orientation-hud");
    const camera = toolbar.locator(".camera-control-stack");
    const basemap = toolbar.locator(".imagery-control");
    await expect(journey).toBeVisible();
    await expect(orientation).toBeVisible();
    await expect(camera).toBeVisible();
    await expect(basemap).toBeVisible();
    // Check the actual boxes, not merely CSS computed visibility. The old
    // floats could draw a compass on top of a preset or imagery control.
    const geometry = await toolbar.evaluate(el => {
      const selectors = [
        ".ocean-journey", ".camera-orientation-hud",
        ".camera-control-stack", ".imagery-control"
      ];
      return selectors.map(selector => {
        const node = el.querySelector(selector)!;
        const b = node.getBoundingClientRect();
        return { selector, x: b.x, y: b.y, width: b.width, height: b.height };
      });
    });
    for (let i = 0; i < geometry.length; i++) {
      for (let j = i + 1; j < geometry.length; j++) {
        const a = geometry[i], b = geometry[j];
        const intersectionX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        const intersectionY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        expect(intersectionX * intersectionY, `${a.selector} overlaps ${b.selector}`).toBeLessThan(4);
      }
    }
    const overflow = await toolbar.evaluate(el => ({
      width: el.scrollWidth - el.clientWidth,
      scrollable: el.scrollHeight > el.clientHeight + 1
    }));
    expect(overflow.width, "No controls should spill horizontally").toBeLessThanOrEqual(3);
    expect(overflow.scrollable, "Toolbar must be vertically scrollable when controls exceed it").toBe(true);
    // Test wheel over the toolbar itself: first scroll the local controls,
    // then hand further wheel input to the real Explorer page scrollport.
    await page.locator(".station-workspace").evaluate(el => { el.scrollTop = 0; });
    await toolbar.evaluate(el => { el.scrollTop = 0; });
    await toolbar.hover({ position: { x: 25, y: 20 } });
    await page.mouse.wheel(0, 180);
    await expect.poll(() => toolbar.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await page.mouse.wheel(0, 1800);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.locator(".station-workspace").evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    // Same toolbar maintains real actions when not scrolling.
    await toolbar.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const offline = basemap.getByRole("button", { name: "Offline", exact: true });
    await offline.click();
    await expect(offline).toHaveAttribute("aria-pressed", "true");
    await basemap.getByRole("button", { name: "High-res auto" }).click();
  });
}
