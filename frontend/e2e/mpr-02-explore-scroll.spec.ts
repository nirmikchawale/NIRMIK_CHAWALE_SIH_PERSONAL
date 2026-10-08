import { expect, test } from "@playwright/test";

/**
 * MPR-02: Explorer-only unified shell scrolling.
 * The fixed app viewport remains in force for non-Explorer routes.
 * The main header should scroll away with the Explorer islands, not remain pinned.
 */
const liveUrl = process.env.OCEANTWIN_LIVE_URL;
if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");

for (const width of [1440, 1024, 390, 320]) {
  test(`Explorer scroll-away header, one shell scroll owner at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(liveUrl!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });

    const shell = page.locator(".ocean-workbench[data-page='explore']");
    const header = shell.locator(":scope > .app-header");
    const source = page.locator(".explorer-landing-islands > .source-workbench");
    const station = page.locator(".station-workspace");
    await expect(header).toBeVisible();
    await expect(source).toBeVisible();

    const initial = await shell.evaluate((root) => {
      const heading = root.querySelector(".app-header");
      const island = root.querySelector(".explorer-landing-islands > .source-workbench");
      const station = root.querySelector(".station-workspace");
      if (!heading || !island || !station) throw new Error("Explorer shell missing header, source island or stage.");
      return {
        headerTop: heading.getBoundingClientRect().top,
        sourceTop: island.getBoundingClientRect().top,
        room: root.scrollHeight - root.clientHeight,
        scroller: getComputedStyle(root).overflowY,
        stationScroller: getComputedStyle(station).overflowY,
        htmlScroll: document.scrollingElement?.scrollTop ?? 0
      };
    });
    expect(initial.room).toBeGreaterThan(250);
    expect(["auto", "scroll"]).toContain(initial.scroller);
    expect(initial.stationScroller).toBe("visible");

    // Programmatic position and genuine mouse-wheel both act on the same
    // shell, instead of requiring a gesture outside the app.
    await shell.evaluate((root) => { root.scrollTop = 0; });
    await page.mouse.move(width - 35, 250);
    await page.mouse.wheel(0, 320);
    await expect.poll(() => shell.evaluate((root) => root.scrollTop)).toBeGreaterThan(100);

    const after = await shell.evaluate((root) => ({
      scroll: root.scrollTop,
      headerTop: root.querySelector(".app-header")!.getBoundingClientRect().top,
      sourceTop: root.querySelector(".explorer-landing-islands > .source-workbench")!.getBoundingClientRect().top,
      stationScroll: root.querySelector(".station-workspace")!.scrollTop,
      documentScroll: document.scrollingElement?.scrollTop ?? 0
    }));
    expect(after.headerTop).toBeLessThan(initial.headerTop - 80);
    expect(after.sourceTop).toBeLessThan(initial.sourceTop - 80);
    expect(after.stationScroll).toBe(0);
    expect(after.documentScroll).toBe(0);
    await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
    await shell.evaluate((root) => { root.scrollTop = 0; });
    await expect(header).toBeVisible();
  });
}

test("non-Explorer navigation retains viewport-locked route scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveUrl!.replace(/#.*$/, "") + "#/telemetry", { waitUntil: "domcontentloaded" });
  const shell = page.locator(".ocean-workbench[data-page='telemetry']");
  const content = page.locator("main[data-page='telemetry']");
  await expect(shell).toBeVisible();
  await expect(content).toBeVisible();
  await expect(shell).toHaveCSS("overflow-y", "hidden");
  await expect(content).toHaveCSS("overflow-y", "auto");
});

test("Explorer leaves source controls and scientific context usable after shell scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveUrl!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const shell = page.locator(".ocean-workbench[data-page='explore']");
  await shell.evaluate((root) => { root.scrollTop = 410; });
  await expect(page.getByRole("button", { name: "GLORYS baseline" })).toBeAttached();
  const sourceMode = await shell.getAttribute("data-explore-source");
  await shell.evaluate((root) => { root.scrollTop = 0; });
  await expect(page.getByRole("button", { name: "GLORYS baseline" })).toHaveAttribute("aria-pressed", "true");
  expect(await shell.getAttribute("data-explore-source")).toBe(sourceMode);
});
