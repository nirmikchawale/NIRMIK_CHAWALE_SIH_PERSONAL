import { expect, test } from "@playwright/test";

const base = process.env.OCEANTWIN_LIVE_URL?.replace(/#.*$/, "");

for (const width of [1440, 390]) {
  test(`pilot comparison explains its scope and recovers the baseline at ${width}px`, async ({ page }) => {
    if (!base) throw new Error("OCEANTWIN_LIVE_URL required");
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "#/compare?block=IO-001", { waitUntil: "domcontentloaded" });
    const workspace = page.locator('.comparison-page');
    const notice = workspace.locator('.comparison-unavailable');
    await expect(notice).toContainText('No Argo comparisons are attached to IO-001');
    await expect(notice).toContainText('cannot be used to validate this block');
    await expect(workspace.getByLabel('Verified Argo profile')).toBeDisabled();
    await expect(workspace.locator('.comparison-depth-inspector')).toHaveCount(0);
    await expect(workspace.getByRole('button', { name: 'Download comparison CSV' })).toHaveCount(0);
    await expect(workspace).not.toContainText('Select a verified Argo comparison profile.');
    const recovery = notice.getByRole('button', { name: 'View verified baseline Argo comparisons' });
    await expect(recovery).toBeEnabled();
    expect(await recovery.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    const bounds = await workspace.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
    expect(bounds.content).toBeLessThanOrEqual(bounds.width + 1);
    // Native keyboard activation must switch the shared block and load real baseline evidence.
    await recovery.press('Enter');
    await expect(page).toHaveURL(/block=BASE-GLORYS-001/);
    await expect(workspace.getByLabel('Verified Argo profile')).toBeEnabled();
    await expect(workspace.locator('.comparison-selector-meta')).toContainText('2 verified comparison profiles');
    await expect(workspace.locator('.comparison-depth-inspector')).toBeVisible();
    await expect(notice).toHaveCount(0);
    await expect(workspace.getByRole('button', { name: 'Download comparison CSV' })).toBeEnabled();
    // Baseline selection persists on refresh; switching back to a pilot must hide its metrics.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(workspace.getByLabel('Verified Argo profile')).toBeEnabled();
    await page.getByRole('button', { name: 'Scientific context details', exact: true }).click();
    await page.getByLabel('Active materialized scientific block', { exact: true }).selectOption('IO-016');
    await expect(notice).toContainText('No Argo comparisons are attached to IO-016');
    await expect(workspace.locator('.comparison-depth-inspector')).toHaveCount(0);
  });
}
