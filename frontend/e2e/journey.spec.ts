import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

// Transient native Cesium journey states can disappear before a Playwright
// locator assertion begins (especially after a loaded document/reload).
// Observe ACTUAL DOM phase mutations before app bootstrap; never force or
// fabricate a phase and require all three real intermediate phases in order.
async function recordNativeJourney(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const extended = window as typeof window & {
      __oceanJourneyPhases?: string[];
      __oceanJourneyStatus?: string[];
    };
    const phases: string[] = [];
    const status: string[] = [];
    extended.__oceanJourneyPhases = phases;
    extended.__oceanJourneyStatus = status;
    const record = () => {
      const value = document.querySelector(".globe-shell[data-journey-phase]")?.getAttribute("data-journey-phase");
      if (value && phases[phases.length - 1] !== value) phases.push(value);
      const label = document.querySelector(".globe-intro-status")?.textContent?.trim();
      if (label && status[status.length - 1] !== label) status.push(label);
    };
    new MutationObserver(record).observe(document, {
      attributes: true,
      attributeFilter: ["data-journey-phase"],
      childList: true,
      subtree: true
    });
    record();
  });
}
// In a software-rendered Cesium CI browser a committed reload can briefly
// abort its own navigation (ERR_ABORTED), leaving Playwright waiting on the
// superseded document. Retry one fresh document navigation *only* on that
// recoverable transport error. Still require the genuine, ordered DOM phases.
async function reloadAndVerifyNativeJourney(
  page: import("@playwright/test").Page,
  url: string
) {
  const previousDocumentTime = await page.evaluate(() => performance.timeOrigin);
  try {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
  } catch (error) {
    const message = String(error);
    if (!/net::ERR_ABORTED|frame was detached/i.test(message)) throw error;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  }
  await expect.poll(
    () => page.evaluate(() => performance.timeOrigin),
    { timeout: 30_000 }
  ).not.toBe(previousDocumentTime);
  await requireNativeJourney(page);
}

async function requireNativeJourney(page: import("@playwright/test").Page) {
  await expect.poll(async () => page.evaluate(() => {
    const all = (window as typeof window & { __oceanJourneyPhases?: string[] }).__oceanJourneyPhases ?? [];
    const earth = all.indexOf("earth");
    const india = all.indexOf("india", earth + 1);
    const flying = all.indexOf("flying", india + 1);
    const region = all.indexOf("region", flying + 1);
    return earth >= 0 && india > earth && flying > india && region > flying;
  }), { timeout: 90_000 }).toBe(true);
  await expect(page.locator(".globe-shell[data-journey-phase]")).toHaveAttribute("data-journey-phase", "region");
}

test("orientation replay, skip, explicit Water Column entry and return remain usable", async ({ page }) => {
  test.setTimeout(300_000);
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await recordNativeJourney(page);
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");

  // Require the real Earth → India → flying → region DOM transitions, even
  // when the first transient state is missed by a delayed locator poll.
  await requireNativeJourney(page);

  // A fresh document must replay the same actual sequence after refresh.
  await reloadAndVerifyNativeJourney(page, liveUrl);

  // Replay must restart the active orientation sequence. On a loaded public
  // Cesium scene the 900 ms Earth state can advance before Playwright finishes
  // the click action, so any active journey state proves the restart.
  await page.getByRole("button", { name: "Replay journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", /^(earth|india|flying)$/, { timeout: 10_000 });
  await page.getByRole("button", { name: "Skip journey", exact: true }).click();
  await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 10_000 });
  // 3DB-07 deliberately removes the old map-click entry mode. Selecting a
  // block changes context only; Water Column entry remains an explicit action.
  await expect(page.getByRole("button", { name: "Inspect points on map", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enable field-click entry" })).toHaveCount(0);

  const hud = page.getByTestId("integrated-main-block-hud");
  const geographicView = page.getByRole("button", { name: "Geographic View", exact: true });
  const waterColumnView = page.getByRole("button", { name: "Water Column 3D", exact: true });
  await expect(geographicView).toHaveAttribute("aria-pressed", "true");

  await hud.getByLabel("Active main block").selectOption("IO-073");
  await expect(globe).toHaveAttribute("data-active-main-block", "IO-073");
  await expect(geographicView).toHaveAttribute("aria-pressed", "true");
  await expect(waterColumnView).toHaveAttribute("aria-pressed", "false");

  await hud.getByRole("button", { name: "Open in Water Column 3D" }).click();
  // MPR-12 keeps the genuine Water Column section mounted for both valid
  // native volumes and explicitly withheld planned-block evidence.
  const waterColumn = page.getByTestId("mpr-12-water-column-section");
  await expect(waterColumn).toBeVisible();
  await expect(waterColumn).toHaveAttribute("data-linked-block", "IO-073");
  await expect(waterColumnView).toHaveAttribute("aria-pressed", "true");
  await geographicView.click();
  await expect(geographicView).toHaveAttribute("aria-pressed", "true");
});


test("fresh refresh replays the Earth India ocean orientation", async ({ page }) => {
  test.setTimeout(300_000);
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await recordNativeJourney(page);
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");
  await requireNativeJourney(page);

  await reloadAndVerifyNativeJourney(page, liveUrl);
  // The live orientation guidance is transient, not rendered once region is
  // reached. Audit what the real browser displayed during the flight.
  const status = await page.evaluate(() =>
    (window as typeof window & { __oceanJourneyStatus?: string[] }).__oceanJourneyStatus ?? []);
  expect(status.join(" ")).toMatch(/EARTH|INDIA|INDIAN OCEAN/);
  await expect(globe).toHaveAttribute("data-journey-phase", "region");
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
