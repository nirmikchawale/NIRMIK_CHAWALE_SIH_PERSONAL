import { expect, test } from "@playwright/test";

const live = process.env.OCEANTWIN_LIVE_URL;
for (const width of [1327, 1440]) {
  test(`desktop real toolbar receives pointer input at ${width}px, not intercepted by Cesium`, async ({ page }) => {
    test.setTimeout(180_000);
    if (!live) throw new Error("OCEANTWIN_LIVE_URL required");
    await page.setViewportSize({ width, height: 900 });
    await page.goto(live.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    const shell = page.locator(".globe-visualization-layer.active .globe-shell");
    await expect(shell).toBeVisible({ timeout: 30000 });
    const skip = page.getByRole("button", { name: "Skip journey" });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    const shelf = shell.locator(".renderer-tools");
    const offline = shelf.getByRole("button", { name: "Offline", exact: true });
    await expect(offline).toBeVisible({ timeout: 30000 });
    const hit = await offline.evaluate(el => {
      const r = el.getBoundingClientRect();
      const found = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        buttonHit: Boolean(found && (el === found || el.contains(found))),
        actualTarget: found?.tagName ?? null,
        toolbarPointer: getComputedStyle(el.closest(".renderer-tools")!).pointerEvents,
        imageryPointer: getComputedStyle(el.closest(".imagery-control")!).pointerEvents
      };
    });
    expect(hit.buttonHit, `Desktop click intercepted by ${hit.actualTarget}`).toBe(true);
    expect(hit.toolbarPointer).toBe("auto");
    expect(hit.imageryPointer).toBe("auto");
    await offline.click();
    await expect(offline).toHaveAttribute("aria-pressed", "true");
    const online = shelf.getByRole("button", { name: "High-res auto" });
    await online.click();
    await expect(online).toHaveAttribute("aria-pressed", "true");
    const replay = shelf.getByRole("button", { name: "Replay journey" });
    await expect(replay).toBeVisible({ timeout: 30000 });
    await replay.click();
    await expect(shell).toHaveAttribute("data-journey-phase", "earth", { timeout: 8000 });
    await shelf.getByRole("button", { name: "Skip journey" }).click();
    await expect(shell).toHaveAttribute("data-journey-phase", "region");
    await expect(shell.locator(".main-block-globe-hud")).toHaveCount(0);
  });
}
