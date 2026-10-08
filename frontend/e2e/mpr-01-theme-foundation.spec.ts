import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";

/** RUI-MPR-01: smoke all 16 persisted theme choices against one shared token system. */
test("all 16 glass presets inherit the rounded presentation foundation without changing science", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);

  expect(GLASS_THEMES).toHaveLength(16);
  expect(GLASS_THEMES.filter((t) => t.scheme === "dark")).toHaveLength(8);
  expect(GLASS_THEMES.filter((t) => t.scheme === "light")).toHaveLength(8);

  const root = page.locator(".ocean-workbench");
  const sourceBefore = await root.getAttribute("data-explore-source");
  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  const island = page.locator(".explorer-landing-islands > .source-workbench");
  await expect(island).toBeVisible();

  for (const theme of GLASS_THEMES) {
    await trigger.click();
    const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
    await expect(gallery).toBeVisible();
    await gallery.getByRole("button", { name: new RegExp(theme.label) }).click();

    await expect(page.locator("html")).toHaveAttribute("data-glass-theme", theme.id);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.scheme);
    const css = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      const island = el.querySelector<HTMLElement>(".explorer-landing-islands > .source-workbench");
      return {
        accent: s.getPropertyValue("--mpr-accent").trim(),
        glassAccent: s.getPropertyValue("--glass-accent").trim(),
        radius: island ? parseFloat(getComputedStyle(island).borderTopLeftRadius) : 0,
        controlRadius: s.getPropertyValue("--mpr-radius-control").trim()
      };
    });
    expect(css.accent).toBe(css.glassAccent);
    expect(css.accent.length).toBeGreaterThan(2);
    expect(css.radius).toBeGreaterThanOrEqual(16);
    expect(css.controlRadius.length).toBeGreaterThan(2);
    await expect(root).toHaveAttribute("data-explore-source", sourceBefore ?? "glorys");
  }
});
