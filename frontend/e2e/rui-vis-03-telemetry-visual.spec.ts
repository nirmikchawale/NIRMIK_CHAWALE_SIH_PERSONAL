import { expect, test } from "@playwright/test";

const base = process.env.OCEANTWIN_LIVE_URL?.replace(/#.*$/, "");

for (const width of [1440, 768, 390, 360]) {
  test(`RUI-VIS-03 readable, contained telemetry at ${width}px`, async ({ page }) => {
    if (!base) throw new Error("OCEANTWIN_LIVE_URL required");
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "#/telemetry", { waitUntil: "domcontentloaded" });
    const workspace = page.locator('.telemetry-page');
    await expect(workspace).toHaveAttribute("data-depth-count", "31");
    await expect(workspace).toHaveAttribute("data-time-count", "1");
    const directory = page.getByRole("navigation", { name: "Telemetry feature directory" });
    await expect(directory.getByRole("button")).toHaveCount(7);
    const geometry = await directory.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1);
    const controls = await directory.getByRole("button").evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
    expect(Math.min(...controls)).toBeGreaterThanOrEqual(width <= 600 ? 44 : 40);
    await expect(workspace.getByRole("slider", { name: "Telemetry time", exact: true })).toBeDisabled();
    const lock = workspace.locator('.telemetry-time-lock');
    await expect(lock).toContainText("does not synthesize");
    expect(await lock.evaluate(el => getComputedStyle(el).position)).toBe("static");
    const firstDepth = workspace.getByRole("button", { name: "Select telemetry depth 0.49 m", exact: true });
    await firstDepth.click();
    await expect(firstDepth).toHaveAttribute("aria-pressed", "true");
    await expect(workspace).toHaveAttribute("data-selected-depth", "0.49");
    await firstDepth.press("Tab");
    const focus = await page.locator(':focus').evaluate(el => getComputedStyle(el).outlineWidth);
    expect(parseFloat(focus)).toBeGreaterThanOrEqual(2);
    await workspace.getByRole("button", { name: "Salinity telemetry", exact: true }).click();
    await expect(workspace).toHaveAttribute("data-variable", "so");
    await expect(workspace.locator('.telemetry-depth-card')).toContainText("Salinity");
    const bounds = await workspace.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
    expect(bounds.content).toBeLessThanOrEqual(bounds.width + 1);
    // Theme presentation only: use the same DOM attribute that the appearance UI publishes.
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
      const colors = await workspace.locator('.telemetry-source-card').evaluate(el => ({
        surface: getComputedStyle(el).backgroundColor,
        text: getComputedStyle(el.querySelector('strong')!).color
      }));
      expect(colors.surface).not.toBe(colors.text);
      await expect(workspace.locator('.telemetry-source-card')).toBeVisible();
    }
    await expect(workspace.getByRole("button", { name: "Download depth telemetry CSV", exact: true })).toBeEnabled();
  });
}
