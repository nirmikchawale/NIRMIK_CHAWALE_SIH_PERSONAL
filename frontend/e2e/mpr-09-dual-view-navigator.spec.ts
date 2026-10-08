import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

for (const width of [1440, 1024, 390, 320]) {
  test("MPR-09 chooses actual 3D stage at " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    const nav = page.getByTestId("mpr-09-dual-view-navigator");
    const stage = page.locator("#mpr-3d-stage");
    const globe = nav.locator("button").nth(0);
    const column = nav.locator("button").nth(1);
    await expect(nav).toBeVisible();
    await expect(nav.locator("button")).toHaveCount(2);
    await expect(stage).toHaveCount(1);
    await expect(globe).toHaveAttribute("aria-controls", "mpr-3d-stage");
    await expect(column).toHaveAttribute("aria-controls", "mpr-3d-stage");
    await expect(globe).toHaveAttribute("aria-pressed", "true");
    await expect(column).toHaveAttribute("aria-pressed", "false");
    const originalSource = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
    if (await column.isEnabled()) {
      await column.click();
      await expect(stage).toHaveAttribute("data-visualization-mode", "water-column");
      await expect(column).toHaveAttribute("aria-pressed", "true");
      await expect(nav).toHaveAttribute("data-active-view", "water-column");
      await page.getByRole("button", { name: "Switch to Geographic 3D" }).click();
      await expect(stage).toHaveAttribute("data-visualization-mode", "globe");
      await expect(globe).toHaveAttribute("aria-pressed", "true");
    } else {
      await expect(page.getByRole("button", { name: "Switch to Water Column 3D" })).toBeDisabled();
    }
    await globe.click();
    await expect(stage).toHaveAttribute("data-visualization-mode", "globe");
    await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", originalSource || "glorys");
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )).toBeLessThanOrEqual(2);
  });
}

test("MPR-09 navigation inherits all 16 glass themes, preserving source", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(live!);
  expect(GLASS_THEMES).toHaveLength(16);
  const nav = page.getByTestId("mpr-09-dual-view-navigator");
  const original = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  for (const theme of GLASS_THEMES) {
    await page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ }).click();
    await page.getByRole("dialog", { name: "Glass appearance gallery" })
      .getByRole("button", { name: new RegExp(theme.label) }).click();
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme", theme.id);
    const background = await nav.locator("button").first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", original || "glorys");
  }
});
