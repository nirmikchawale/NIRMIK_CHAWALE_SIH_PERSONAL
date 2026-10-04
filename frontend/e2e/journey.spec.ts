import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

test("orientation replay, skip, field entry and return remain usable", async ({ page }) => {
  // Public GitHub Pages can spend substantial time initializing Cesium and
  // switching between two WebGL-heavy views. Preserve every interaction
  // assertion, but give the complete repeated-entry journey a realistic live budget.
  test.setTimeout(300_000);
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");

  // A fresh document load must visibly orient Earth → India → ocean.
  await expect(globe).toHaveAttribute("data-journey-phase", "earth", { timeout: 45_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "india", { timeout: 45_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "flying", { timeout: 45_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 45_000 });

  // A browser refresh creates a new document and must replay the same story.
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(globe).toHaveAttribute("data-journey-phase", "earth", { timeout: 45_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "india", { timeout: 45_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "flying", { timeout: 45_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 45_000 });

  // Full Earth → India → ocean completion is already proven above for both
  // open and refresh. Replay must restart it, and Skip must exit immediately.
  await page.getByRole("button", { name: "Replay journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", "earth", { timeout: 30_000 });
  await page.getByRole("button", { name: "Skip journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 10_000 });
  await page.getByRole("button", { name: "Inspect points on map", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enable field-click entry" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Enable field-click entry" }).click();
  await page.getByRole("button", { name: "Enter Water Column 3D", exact: true }).click();
  await expect(page.locator(".water-column-shell")).toBeVisible();
  await page.getByRole("button", { name: "Geographic View", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inspect points on map", exact: true })).toHaveAttribute("aria-pressed", "false");
  // The 140-block field means an arbitrary canvas centre is no longer guaranteed
  // to be the verified GLORYS footprint. Re-enter through the canonical action
  // and prove the mounted globe can transition repeatedly without stale state.
  for (let visit = 0; visit < 2; visit += 1) {
    const enterWaterColumn = page.getByRole("button", { name: "Enter Water Column 3D", exact: true });
    await expect(enterWaterColumn).toBeVisible({ timeout: 30_000 });
    await enterWaterColumn.click({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Water Column 3D", exact: true })).toHaveAttribute("aria-pressed", "true");
    const geographicView = page.getByRole("button", { name: "Geographic View", exact: true });
    await expect(geographicView).toBeVisible({ timeout: 30_000 });
    await geographicView.click({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Inspect points on map", exact: true })).toHaveAttribute("aria-pressed", "false");
  }
});


test("fresh refresh replays the Earth India ocean orientation", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 30_000 });

  await page.reload({ waitUntil: "domcontentloaded" });
  // The orientation journey lasts several seconds, so a fresh reload must
  // re-enter one of its active phases instead of opening directly at region.
  await expect(globe).toHaveAttribute("data-journey-phase", /^(earth|india|flying)$/, { timeout: 5_000 });
  await expect(page.locator(".globe-intro-status")).toBeVisible();
  await expect(page.locator(".globe-intro-status")).toContainText(/EARTH|INDIA|VERIFIED OCEAN FIELD/);
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 30_000 });
});

test("mobile pinch, wheel and reduced-motion orientation work", async ({ page, context }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(liveUrl);
  const globe = page.locator(".globe-shell[data-journey-phase]");
  await expect(globe).toHaveAttribute("data-journey-phase", "region");
  await page.getByRole("button", { name: "Replay journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", "region");
  // The redesigned mobile layout deliberately removes the desktop evidence
  // pill from the crowded canvas. Evidence is covered by the desktop live flow;
  // this test stays focused on mobile journey and 3D gesture behavior.
  await page.getByRole("button", { name: "Water Column 3D", exact: true }).click();
  const shell = page.locator(".water-column-shell");
  await expect(shell).toHaveAttribute("data-zoom", "1.000");
  const canvas = page.getByRole("application", { name: "Interactive scientific water-column 3D" });
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("3D canvas missing");
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 50, y, id: 1 }, { x: x + 50, y, id: 2 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => Number(await shell.getAttribute("data-zoom"))).toBeGreaterThan(1.2);
  await page.getByRole("button", { name: "Reset Water-Column 3D view" }).click();
  await expect(shell).toHaveAttribute("data-zoom", "1.000");
  await canvas.scrollIntoViewIfNeeded();
  const wheelBounds = await canvas.boundingBox();
  await page.mouse.move(wheelBounds!.x + wheelBounds!.width / 2, wheelBounds!.y + wheelBounds!.height / 2);
  await page.mouse.wheel(0, -100);
  await expect.poll(async () => Number(await shell.getAttribute("data-zoom"))).toBeGreaterThan(1);
  await client.detach();
});
