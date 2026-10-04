import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

test("orientation replay, skip, field entry and return remain usable", async ({ page }) => {
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

  // Replay must restart the active orientation sequence. On a loaded public
  // Cesium scene the 900 ms Earth state can advance before Playwright finishes
  // the click action, so any active journey state proves the restart.
  await page.getByRole("button", { name: "Replay journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", /^(earth|india|flying)$/, { timeout: 10_000 });
  await page.getByRole("button", { name: "Skip journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 10_000 });
  await page.getByRole("button", { name: "Inspect points on map", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enable field-click entry" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Enable field-click entry" }).click();
  await page.getByRole("button", { name: "Enter Water Column 3D", exact: true }).click();
  await expect(page.locator(".water-column-shell")).toBeVisible();
  await page.getByRole("button", { name: "Geographic View", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inspect points on map", exact: true })).toHaveAttribute("aria-pressed", "false");

  // The opening camera now frames the whole 140-block Indian Ocean field. To
  // test direct verified-field entry deterministically, focus the genuine
  // BASE-GLORYS-001 footprint before clicking the center of the canvas.
  const hud = page.getByTestId("integrated-main-block-hud");
  for (let visit = 0; visit < 2; visit += 1) {
    await hud.getByLabel("Active main block").selectOption("BASE-GLORYS-001");
    await hud.getByRole("button", { name: "Fit selected block" }).click();
    await page.waitForTimeout(900);

    const mapCanvas = page.locator(".globe-shell canvas");
    await mapCanvas.scrollIntoViewIfNeeded();
    const bounds = await mapCanvas.boundingBox();
    if (!bounds) throw new Error("Geographic canvas missing");
    await page.mouse.click(bounds.x + bounds.width * 0.50, bounds.y + bounds.height * 0.50);
    await expect(page.getByRole("button", { name: "Water Column 3D", exact: true })).toHaveAttribute("aria-pressed", "true");
    const geographicView = page.getByRole("button", { name: "Geographic View", exact: true });
    await expect(geographicView).toBeVisible({ timeout: 30_000 });
    await geographicView.click({ timeout: 30_000 });
  }
});


test("fresh refresh replays the Earth India ocean orientation", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 30_000 });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(globe).toHaveAttribute("data-journey-phase", /^(earth|india|flying)$/, { timeout: 5_000 });
  await expect(page.locator(".globe-intro-status")).toBeVisible();
  await expect(page.locator(".globe-intro-status")).toContainText(/EARTH|INDIA|VERIFIED OCEAN FIELD/);
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 30_000 });
});

test("mobile pinch, wheel and reduced-motion orientation work", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(liveUrl);
  const globe = page.locator(".globe-shell[data-journey-phase]");
  await expect(globe).toHaveAttribute("data-journey-phase", "region");
  await page.getByRole("button", { name: "Replay journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", /^(earth|india|flying)$/, { timeout: 3_000 });
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 6_000 });
  // The redesigned mobile layout deliberately removes the desktop evidence
  // pill from the crowded canvas. Evidence is covered by the desktop live flow;
  // this test stays focused on mobile journey and 3D gesture behavior.
  await page.getByRole("button", { name: "Water Column 3D", exact: true }).click();
  const shell = page.locator(".water-column-shell");
  await expect(shell).toHaveAttribute("data-zoom", "1.000");
  const canvas = page.getByRole("application", { name: "Interactive scientific water-column 3D" });
  await canvas.scrollIntoViewIfNeeded();

  // Exercise the production canvas touch handler directly. CDP touch injection
  // depends on Chromium hit-testing/touch-hardware emulation and can miss this
  // scroll-owned canvas in headless CI even when browser touch handling is valid.
  // Native TouchEvents keep the same two-finger zoom contract while targeting
  // the exact application surface a real mobile gesture owns.
  await canvas.evaluate((element) => {
    if (typeof Touch !== "function" || typeof TouchEvent !== "function") {
      throw new Error("Chromium Touch/TouchEvent constructors are unavailable");
    }
    const target = element as HTMLCanvasElement;
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const makeTouch = (identifier: number, clientX: number, clientY: number) => new Touch({
      identifier,
      target,
      clientX,
      clientY,
      pageX: clientX + window.scrollX,
      pageY: clientY + window.scrollY,
      screenX: clientX,
      screenY: clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1
    });
    const dispatch = (type: string, touches: Touch[], changedTouches: Touch[]) => {
      target.dispatchEvent(new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches,
        targetTouches: touches,
        changedTouches
      }));
    };

    const startA = makeTouch(1, x - 30, y);
    const startB = makeTouch(2, x + 30, y);
    dispatch("touchstart", [startA, startB], [startA, startB]);

    const moveA = makeTouch(1, x - 50, y);
    const moveB = makeTouch(2, x + 50, y);
    dispatch("touchmove", [moveA, moveB], [moveA, moveB]);
    dispatch("touchend", [], [moveA, moveB]);
  });

  await expect.poll(async () => Number(await shell.getAttribute("data-zoom"))).toBeGreaterThan(1.2);
  await page.getByRole("button", { name: "Reset Water-Column 3D view" }).click();
  await expect(shell).toHaveAttribute("data-zoom", "1.000");
  await canvas.scrollIntoViewIfNeeded();

  // As with pinch, target the production canvas event surface directly. A
  // page-level mouse wheel depends on headless hit-testing and scroll ownership,
  // which can route the gesture to the document even when the canvas handler is
  // correct. A real bubbling WheelEvent exercises React's onWheel contract on
  // the same element a physical wheel/trackpad gesture owns.
  await canvas.evaluate((element) => {
    element.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      composed: true,
      deltaY: -100,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL
    }));
  });
  await expect.poll(async () => Number(await shell.getAttribute("data-zoom"))).toBeGreaterThan(1);
});
