import { expect, test } from "@playwright/test";

const ACTIVE_BLOCK_KEY = "oceancanvas-active-main-block-v1";

async function startFromBaseline(page: Parameters<typeof test>[0] extends never ? never : any) {
  await page.addInitScript((storageKey) => localStorage.removeItem(storageKey), ACTIVE_BLOCK_KEY);
}

test("Phase 3.5D exposes 140 targets and exactly 24 source-backed pilots", async ({ page }) => {
  await startFromBaseline(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  const launcher = page.getByTestId("phase35-block-launcher");
  await expect(launcher).toBeVisible();
  await expect(launcher).toContainText("24 source-backed pilots");
  await launcher.click();

  const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".phase35-block-cell")).toHaveCount(140);
  await expect(dialog.getByTestId("phase35-materialization-summary")).toContainText("SOURCE-BACKED PILOTS");
  await expect(dialog.getByTestId("phase35-materialization-summary")).toContainText("24");
  await expect(dialog.getByTestId("phase35-materialization-summary")).toContainText("MULTI-DATE PILOTS");
  await expect(dialog.getByText("BASE-GLORYS-001")).toBeVisible();
  await expect(dialog.getByText("02 Jan 2024 · daily mean")).toBeVisible();

  const pilot = dialog.locator('[data-block-id="IO-001"]');
  await expect(pilot).toHaveAttribute("data-materialization", "pilot", { timeout: 20_000 });
  await pilot.click();
  await expect(dialog.getByText("MATERIALIZED · SOURCE-BACKED")).toBeVisible();
  await expect(dialog.getByText("2004-03-15 · 2004-07-28")).toBeVisible();

  const target = dialog.locator('[data-block-id="IO-047"]');
  await expect(target).toHaveAttribute("data-materialization", "planned");
  await target.click();
  await expect(dialog.getByText("IO-047", { exact: true })).toBeVisible();
  await expect(dialog.getByText("LOGICAL TARGET · NOT YET DOWNLOADED")).toBeVisible();
  await expect(dialog.getByText(/SCIENTIFIC RENDERER LOCKED/)).toBeVisible();
});

test("planned-region browsing cannot replace the active scientific renderer source", async ({ page }) => {
  await startFromBaseline(page);
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  const sourceBefore = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  await page.getByTestId("phase35-block-launcher").click();
  const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  await dialog.getByLabel("Region").selectOption({ label: "Bay of Bengal" });

  const filteredCount = await dialog.locator(".phase35-block-cell").count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(140);

  const planned = dialog.locator('[data-materialization="planned"]').first();
  await planned.click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", sourceBefore ?? "glorys");
  const activeStored = await page.evaluate((storageKey) => localStorage.getItem(storageKey), ACTIVE_BLOCK_KEY);
  expect(activeStored).toBeNull();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 430, height: 932 }
]) {
  test(`Phase 3.5D legacy launcher yields to the integrated mobile block HUD on ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await startFromBaseline(page);
    await page.setViewportSize(viewport);
    await page.goto(process.env.OCEANTWIN_LIVE_URL!);

    await expect(page.getByTestId("phase35-block-launcher")).toBeHidden();
    const globe = page.locator(".globe-shell[data-journey-phase]");
    await expect(globe).toHaveAttribute("data-journey-phase", "region", { timeout: 30_000 });
    const hud = page.locator(".main-block-globe-hud");
    await expect(hud).toBeVisible();
    await hud.scrollIntoViewIfNeeded();
    const box = await hud.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
  });
}
