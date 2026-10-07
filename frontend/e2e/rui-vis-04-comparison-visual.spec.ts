import { expect, test } from "@playwright/test";
const base = process.env.OCEANTWIN_LIVE_URL?.replace(/#.*$/, "");

for (const width of [1440, 768, 390, 360]) {
  test(`RUI-VIS-04 comparison evidence remains readable and usable at ${width}px`, async ({ page }) => {
    if (!base) throw new Error("OCEANTWIN_LIVE_URL required");
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "#/compare", { waitUntil: "domcontentloaded" });
    const workspace = page.locator('.comparison-page');
    const selector = workspace.getByLabel('Verified Argo profile');
    await expect(selector).toBeEnabled();
    await expect(workspace.locator('[data-comparison-home]')).toHaveCount(8);
    const directory = page.getByRole('navigation', { name: 'Model vs Observation feature directory' });
    await expect(directory.getByRole('button')).toHaveCount(8);
    const nav = await directory.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
    expect(nav.content).toBeLessThanOrEqual(nav.width + 1);
    const heights = await directory.getByRole('button').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(width <= 600 ? 44 : 40);
    const oldProfile = await workspace.locator('.comparison-selector-meta strong').textContent();
    await selector.selectOption({ index: 1 });
    await expect(workspace.locator('.comparison-selector-meta strong')).not.toHaveText(oldProfile ?? '');
    const depth = workspace.getByLabel('Matched comparison depth');
    await depth.press('Home');
    const readout = workspace.locator('.comparison-depth-inspector .comparison-card-heading > strong');
    const initialDepth = await readout.textContent();
    await depth.press('End');
    await expect(readout).not.toHaveText(initialDepth ?? '');
    expect(parseFloat(await depth.evaluate(el => getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
    await expect(workspace.locator('.comparison-depth-values')).toContainText('Bias M−O');
    await expect(workspace.locator('.comparison-bias-meter')).toContainText('MODEL COOLER');
    await expect(workspace.locator('.comparison-bias-meter')).toContainText('MODEL WARMER');
    expect(await workspace.locator('.bias-meter-point').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
    await expect(workspace.locator('#comparison-qc')).toContainText('No extrapolation');
    await expect(workspace.locator('#comparison-evidence')).toContainText('not independent validation');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
      const colors = await workspace.locator('.comparison-depth-inspector').evaluate(el => ({
        bg: getComputedStyle(el).backgroundColor, fg: getComputedStyle(el.querySelector('strong')!).color
      }));
      expect(colors.bg).not.toBe(colors.fg);
      const bounds = await workspace.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
      expect(bounds.content).toBeLessThanOrEqual(bounds.width + 1);
    }
    await expect(workspace.getByRole('button', { name: 'Download comparison CSV' })).toBeEnabled();
    await expect(workspace.getByRole('button', { name: 'Download evidence JSON' })).toBeEnabled();
  });
}
