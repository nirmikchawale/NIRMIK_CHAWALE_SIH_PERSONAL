import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
/**
 * Capture the *real* document's orientation transitions at the DOM mutation
 * boundary, not with a Playwright poll that can miss the short Earth/India
 * phases under loaded software-rendered Cesium.
 */
async function recordDocumentJourney(page: Page) {
  await page.addInitScript(() => {
    const record = { phases: [] as string[], statuses: [] as string[] };
    (window as Window & { __oceanJourneyRecord?: typeof record }).__oceanJourneyRecord = record;
    let watching = false;
    const attach = () => {
      if (watching) return true;
      const globe = document.querySelector<HTMLElement>(".globe-shell[data-journey-phase]");
      if (!globe) return false;
      watching = true;
      const capture = () => {
        const phase = globe.getAttribute("data-journey-phase");
        if (phase && record.phases.at(-1) !== phase) record.phases.push(phase);
        const status = globe.querySelector(".globe-intro-status")?.textContent?.trim();
        if (status && record.statuses.at(-1) !== status) record.statuses.push(status);
      };
      new MutationObserver(capture).observe(globe, {
        attributes: true, attributeFilter: ["data-journey-phase"],
        childList: true, subtree: true
      });
      capture();
      return true;
    };
    const start = () => {
      if (attach()) return;
      const observer = new MutationObserver(() => {
        if (attach()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.documentElement) start();
    else {
      // Attach before deferred application modules mount the globe: waiting
      // until DOMContentLoaded would miss an early real journey transition.
      const rootObserver = new MutationObserver(() => {
        if (!document.documentElement) return;
        rootObserver.disconnect();
        start();
      });
      rootObserver.observe(document, { childList: true });
    }
  });
}

async function expectFullDocumentJourney(page: Page) {
  const expected = ["earth", "india", "flying", "region"];
  // The strict ordering is unchanged; only observation is resilient to lag
  // between Playwright/CI and the browser's actual React commits.
  await expect.poll(async () => {
    const phases = await page.evaluate(
      () => (window as Window & { __oceanJourneyRecord?: { phases: string[] } })
        .__oceanJourneyRecord?.phases ?? []
    );
    let cursor = 0;
    for (const phase of phases) {
      if (cursor < expected.length && phase === expected[cursor]) cursor += 1;
    }
    return cursor === expected.length;
  }, { timeout: 90_000 }).toBe(true);
  await expect(page.locator(".globe-shell[data-journey-phase]")).toHaveAttribute(
    "data-journey-phase", "region", { timeout: 10_000 }
  );
}


test("orientation replay, skip, explicit Water Column entry and return remain usable", async ({ page }) => {
  test.setTimeout(300_000);
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await recordDocumentJourney(page);
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");

  // Record every actual React DOM phase, in order, even if runner/Playwright
  // pauses beyond a short transitional animation state.
  await expectFullDocumentJourney(page);

  // The init-script recorder is reset on each full document reload.
  await page.reload({ waitUntil: "domcontentloaded" });
  await expectFullDocumentJourney(page);

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

  // The MPR-09 explicit view navigator is the current accessible entry.
  // The former dock HUD entry can be outside the active, scroll-owned stage.
  await waterColumnView.scrollIntoViewIfNeeded();
  await waterColumnView.click();
  // MPR-12 now owns a separate genuine Water Column section, not the
  // pre-MPR single-stage renderer. Verify native linked block/eligibility.
  const waterSection = page.getByTestId("mpr-12-water-column-section");
  await expect(waterSection).toBeVisible();
  await expect(waterSection).toHaveAttribute("data-linked-block", "IO-073");
  await expect(waterSection).toHaveAttribute("data-eligible", "true");
  await expect(page.locator("#mpr-3d-stage")).toHaveAttribute("data-visualization-mode", "water-column");
  await expect(waterColumnView).toHaveAttribute("aria-pressed", "true");
  await geographicView.click();
  await expect(geographicView).toHaveAttribute("aria-pressed", "true");
});


test("fresh refresh replays the Earth India ocean orientation", async ({ page }) => {
  test.setTimeout(240_000);
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await recordDocumentJourney(page);
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-shell[data-journey-phase]");
  await expectFullDocumentJourney(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  // Verify real, ordered Earth→India→flying→region DOM states. The old poll
  // missed short-lived phases when Chromium was under software-GPU load.
  await expectFullDocumentJourney(page);
  const recordedStatusText = await page.evaluate(
    () => (window as Window & { __oceanJourneyRecord?: { statuses: string[] } })
      .__oceanJourneyRecord?.statuses.join(" ") ?? ""
  );
  expect(recordedStatusText).toMatch(/EARTH|INDIA|VERIFIED OCEAN FIELD/);
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
