import { expect, test } from "@playwright/test";

// UIX-03: the actual pilot provenance launcher belongs to the dedicated
// Block Details area rather than remaining fixed over the Explorer globe.
test("source-backed pilot details launcher is inside canonical Block Details and not viewport-fixed", async ({ page }) => {
  test.setTimeout(180_000);
  const origin = process.env.OCEANTWIN_LIVE_URL;
  if (!origin?.startsWith("http")) throw new Error("An actual candidate URL is required");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  await page.getByTestId("phase35-block-launcher").click();
  const chooser = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  const pilot = chooser.locator('[data-block-id="IO-001"]');
  await expect(pilot).toHaveAttribute("data-materialization", "pilot", { timeout: 30_000 });
  await pilot.click();
  await page.getByTestId("phase35-activate-pilot").click();
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-001", { timeout: 40_000 });

  const nav = page.getByTestId("mpr-block-details-workspace").getByRole("navigation", { name: "Block navigation and evidence actions" });
  const trigger = page.getByTestId("pilot-block-details-trigger");
  await expect(trigger).toBeVisible({ timeout: 30_000 });
  await expect(nav.locator('[data-testid="pilot-block-details-trigger"]')).toHaveCount(1);
  await expect(page.locator(".pilot-block-details-control > .pilot-block-details-trigger")).toHaveCount(0);
  const geometry = await trigger.evaluate(node => {
    const own = node.getBoundingClientRect();
    const parent = node.parentElement!.getBoundingClientRect();
    return {
      position: getComputedStyle(node).position,
      withinX: own.x >= parent.x - 2 && own.right <= parent.right + 2,
      withinY: own.y >= parent.y - 2 && own.bottom <= parent.bottom + 2
    };
  });
  expect(geometry.position).not.toBe("fixed");
  expect(geometry.withinX).toBe(true);
  expect(geometry.withinY).toBe(true);
  await trigger.click();
  const evidence = page.getByTestId("pilot-renderer-bridge");
  await expect(evidence).toContainText("SOURCE-BACKED MAIN BLOCK LIVE");
  await expect(evidence).toContainText("No synthetic values");
  await page.getByRole("button", { name: "Close source-backed main block details" }).last().click();
  await expect(evidence).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
