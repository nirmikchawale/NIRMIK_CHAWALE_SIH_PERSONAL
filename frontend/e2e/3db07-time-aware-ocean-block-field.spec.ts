import { expect, test } from "@playwright/test";

const ACTIVE_BLOCK_KEY = "oceancanvas-active-main-block-v1";

test("3DB-07 keeps only ocean-intersecting blocks and switches genuine pilot time in-session", async ({ page }) => {
  test.setTimeout(240_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-07 browser verification.");

  await page.addInitScript((key) => localStorage.removeItem(key), ACTIVE_BLOCK_KEY);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  const globe = page.locator(".globe-visualization-layer.active .globe-shell");
  await expect(globe).toHaveAttribute("data-main-block-count", "112", { timeout: 30_000 });

  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  const selector = hud.getByLabel("Active main block");
  await expect(selector.locator("option")).toHaveCount(113);
  await expect(selector.locator('option[value="BASE-GLORYS-001"]')).toHaveCount(0);

  const launcher = page.getByTestId("phase35-block-launcher");
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  await expect(dialog.locator(".phase35-block-cell")).toHaveCount(112);
  await expect(dialog.locator('[data-block-id="IO-004"]')).toHaveCount(0);
  await expect(dialog.locator('[data-block-id="IO-019"]')).toHaveCount(1);
  await expect(dialog).toContainText("Yellow light → dark");

  await page.evaluate(() => {
    (window as typeof window & { __3db07NoReload?: string }).__3db07NoReload = "alive";
  });

  const pilot = dialog.locator('[data-block-id="IO-001"]');
  await pilot.click();
  const activate = page.getByTestId("phase35-activate-pilot");
  await expect(activate).toContainText("Load IO-001");
  await activate.click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });

  await expect.poll(() =>
    page.evaluate(() => (window as typeof window & { __3db07NoReload?: string }).__3db07NoReload)
  ).toBe("alive");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), ACTIVE_BLOCK_KEY)).toBe("IO-001");
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });

  const timeline = page.locator(".timeline-scrubber");
  await expect(timeline).toHaveAttribute("data-native-count", "2", { timeout: 30_000 });
  await expect(timeline).toContainText("2 genuine timestamps");

  await selector.selectOption("IO-002");
  await expect.poll(() =>
    page.evaluate(() => (window as typeof window & { __3db07NoReload?: string }).__3db07NoReload)
  ).toBe("alive");
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-002", { timeout: 30_000 });
  await expect(timeline).toHaveAttribute("data-native-count", "1", { timeout: 30_000 });
  await expect(timeline.getByRole("button", { name: "Play genuine Explore time playback" })).toBeDisabled();

  await expect(page.getByRole("button", { name: "Enable field-click entry" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inspect points on map" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open in Water Column 3D" })).toBeVisible();
});
