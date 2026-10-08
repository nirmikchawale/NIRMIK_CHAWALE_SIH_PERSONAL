import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

for (const width of [1440, 1024, 390, 320]) {
  test("MPR-06 source card layout and availability at " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    const region = page.getByTestId("mpr-06-ocean-intelligence");
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { name: "Choose your ocean." })).toBeVisible();
    const choices = region.locator(".source-workbench-choices");
    await expect(choices.locator("button")).toHaveCount(3);
    for (const label of ["GLORYS baseline", "INCOIS multi-time", "INCOIS chlorophyll"]) {
      await expect(choices.getByRole("button", { name: label, exact: true })).toHaveCount(1);
    }
    const actions = region.getByRole("navigation", { name: "Scientific workflow actions" });
    await expect(actions.getByRole("button")).toHaveCount(3);
    const headingBox = await region.locator(".source-workbench-title").boundingBox();
    const cardsBox = await choices.boundingBox();
    const actionsBox = await actions.boundingBox();
    expect(headingBox && cardsBox && actionsBox).toBeTruthy();
    expect(headingBox!.y + headingBox!.height).toBeLessThan(cardsBox!.y);
    expect(cardsBox!.y + cardsBox!.height).toBeLessThan(actionsBox!.y);
    if (width >= 1024) {
      const b0 = await choices.locator("button").nth(0).boundingBox();
      const b1 = await choices.locator("button").nth(1).boundingBox();
      const b2 = await choices.locator("button").nth(2).boundingBox();
      expect(Math.abs(b0!.y - b1!.y)).toBeLessThan(3);
      expect(Math.abs(b1!.y - b2!.y)).toBeLessThan(3);
    }
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )).toBeLessThanOrEqual(2);
    await expect(choices.getByRole("button", { name: "GLORYS baseline" })).toBeEnabled();
    for (const label of ["INCOIS multi-time", "INCOIS chlorophyll"]) {
      const button = choices.getByRole("button", { name: label });
      if (await button.isDisabled()) await expect(button).toContainText("Source unavailable");
    }
  });
}

test("MPR-06 source selection remains unchanged across all 16 glass themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(live!);
  expect(GLASS_THEMES).toHaveLength(16);
  const source = page.getByTestId("mpr-06-ocean-intelligence");
  const original = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  for (const theme of GLASS_THEMES) {
    await page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ }).click();
    await page.getByRole("dialog", { name: "Glass appearance gallery" })
      .getByRole("button", { name: new RegExp(theme.label) }).click();
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme", theme.id);
    const bg = await source.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.locator(".ocean-workbench")).toHaveAttribute(
      "data-explore-source", original || "glorys"
    );
  }
});
