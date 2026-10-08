import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

test("MPR-03 compact navigator inherits all 16 themes without changing selected source", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(live!);
  const root = page.getByTestId("app-navigation-root");
  const shell = page.locator(".ocean-workbench");
  const rail = page.getByTestId("mpr-workspace-rail");
  await expect(rail).toBeVisible();
  expect(GLASS_THEMES).toHaveLength(16);
  const originalSource = await shell.getAttribute("data-explore-source");
  for (const theme of GLASS_THEMES) {
    await page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ }).click();
    await page.getByRole("dialog", { name: "Glass appearance gallery" })
      .getByRole("button", { name: new RegExp(theme.label) }).click();
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme", theme.id);
    const values = await rail.evaluate(el => {
      const css = getComputedStyle(el);
      return { color: css.color, surface: css.backgroundColor, width: el.getBoundingClientRect().width };
    });
    expect(values.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(values.surface).not.toBe("rgba(0, 0, 0, 0)");
    expect(values.width).toBeLessThanOrEqual(76);
    await expect(root).toHaveAttribute("data-nav-directory", "explore");
    await expect(shell).toHaveAttribute("data-explore-source", originalSource || "glorys");
  }
});

test("MPR-03 directory keyboard trap and dismissal preserves underlying 3D width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(live!);
  const scene = page.locator(".workspace-frame > .workspace");
  const width = (await scene.boundingBox())!.width;
  const trigger = page.getByRole("button", { name: "Open Analyze workspaces" });
  await trigger.click();
  const nav = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("button", { name: "Analyze", exact: true })).toBeFocused();
  // Wrap backward only when focus is on the first available directory control.
  await nav.getByRole("button", { name: "Close workspace directory" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(nav.getByRole("button", { name: "Anomaly Screening" })).toBeFocused();
  expect(Math.abs((await scene.boundingBox())!.width - width)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/#\/explore$/);
});

test("MPR-03 mobile directory never clips its category actions at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto(live!);
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  const nav = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(nav).toBeVisible();
  for (const btn of await nav.locator(".mpr-drawer-category").all()) {
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await nav.getByRole("button", { name: "Science", exact: true }).click();
  await nav.getByRole("button", { name: "Science System" }).click();
  await expect(page).toHaveURL(/#\/about$/);
});