import { expect, test } from "@playwright/test";

const THEME_KEY = "oceantwin-glass-theme-v2";

async function expectCenteredAndBounded(
  page: import("@playwright/test").Page,
  viewport: { width: number; height: number },
  tolerance = 3
) {
  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  const box = await gallery.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  const leftGap = box!.x;
  const rightGap = viewport.width - (box!.x + box!.width);
  expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(tolerance);
}

test("glass appearance gallery exposes all presets, is centered and persists selection", async ({ page }) => {
  const viewport = { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator(".theme-option")).toHaveCount(16);
  await expectCenteredAndBounded(page, viewport);

  await gallery.getByRole("button", { name: /Lavender Haze/i }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("lavender-haze");
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("lavender-haze");

  await page.reload();
  await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("lavender-haze");
  await expect(page.getByRole("button", { name: /Appearance: Lavender Haze/ })).toBeVisible();
});

test("dark glass selection changes interface theme without changing scientific source", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  const sourceBefore = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  await page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ }).click();
  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await gallery.getByRole("button", { name: /Aurora Borealis/i }).click();

  await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("aurora-borealis");
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("dark");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", sourceBefore ?? "glorys");
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 430, height: 932 }
]) {
  test(`glass gallery remains centered and bounded on mobile ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(process.env.OCEANTWIN_LIVE_URL!);

    await page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ }).click();
    const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
    await expect(gallery).toBeVisible();
    await expectCenteredAndBounded(page, viewport, 2);

    await gallery.getByRole("button", { name: "Light glass", exact: true }).click();
    await expect(gallery.locator(".theme-option")).toHaveCount(8);
    await gallery.getByRole("button", { name: /Pearl Lagoon/i }).click();
    await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("pearl-lagoon");
  });
}
