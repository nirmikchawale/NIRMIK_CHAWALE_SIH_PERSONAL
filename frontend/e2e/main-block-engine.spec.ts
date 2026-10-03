import { expect, test } from "@playwright/test";

test("Phase 3.5A exposes 140 logical main-block targets without claiming them as downloaded", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  const launcher = page.getByTestId("phase35-block-launcher");
  await expect(launcher).toBeVisible();
  await launcher.click();

  const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".phase35-block-cell")).toHaveCount(140);
  await expect(dialog.getByText("0", { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText("Phase 3.5B acquires real new blocks")).toBeVisible();
  await expect(dialog.getByText("BASE-GLORYS-001")).toBeVisible();
  await expect(dialog.getByText("02 Jan 2024 · daily mean")).toBeVisible();

  const target = dialog.locator('[data-block-id="IO-047"]');
  await expect(target).toHaveAttribute("data-materialization", "planned");
  await target.click();
  await expect(dialog.getByText("IO-047", { exact: true })).toBeVisible();
  await expect(dialog.getByText("LOGICAL TARGET · NOT YET DOWNLOADED")).toBeVisible();
});

test("Phase 3.5A region filter changes the planning catalog without changing scientific data", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  const sourceBefore = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  await page.getByTestId("phase35-block-launcher").click();
  const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  await dialog.getByLabel("Region").selectOption({ label: "Bay of Bengal" });

  const filteredCount = await dialog.locator(".phase35-block-cell").count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(140);
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", sourceBefore ?? "glorys");
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 430, height: 932 }
]) {
  test(`Phase 3.5A dialog remains viewport-bounded on ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(process.env.OCEANTWIN_LIVE_URL!);
    await page.getByTestId("phase35-block-launcher").click();

    const dialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
  });
}
