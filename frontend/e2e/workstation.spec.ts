import { expect, test, type Page } from "@playwright/test";

async function assertSeparateAreas(page: Page) {
  const collisions = await page.locator('.station-workspace').evaluate(root => {
    const areas = [...root.children].filter((e): e is HTMLElement => e instanceof HTMLElement)
      .filter(e => {
        const style = getComputedStyle(e);
        // Fixed mobile trays/sheets are intentional overlays. The grid collision audit
        // applies to normal workstation regions only.
        return style.position !== 'fixed' &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          e.getBoundingClientRect().height > 0;
      })
      .map(e => ({ name: e.className, r: e.getBoundingClientRect() }));
    const overlaps: string[] = [];
    for (let a = 0; a < areas.length; a++) for (let b = a + 1; b < areas.length; b++) {
      const x = Math.min(areas[a].r.right, areas[b].r.right) - Math.max(areas[a].r.left, areas[b].r.left);
      const y = Math.min(areas[a].r.bottom, areas[b].r.bottom) - Math.max(areas[a].r.top, areas[b].r.top);
      if (x > 2 && y > 2) overlaps.push(`${areas[a].name} / ${areas[b].name}`);
    }
    return overlaps;
  });
  expect(collisions).toEqual([]);
}

for (const width of [1440, 1024, 390]) test(`workstation reserves separate areas at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!);
  const sources = page.getByLabel('Explore scientific source');
  await expect(sources.getByRole('button', { name: 'GLORYS baseline', exact: true })).toBeVisible();
  const sourceBox = await sources.boundingBox();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(sourceBox!.y + sourceBox!.height).toBeLessThanOrEqual(viewport!.height + 1);
  await assertSeparateAreas(page);
  const stage = page.locator('.visualization-stage');
  const range = page.getByRole('region', { name: 'Interactive scientific colorbar' });
  expect((await range.boundingBox())!.y).toBeGreaterThanOrEqual((await stage.boundingBox())!.y + (await stage.boundingBox())!.height);
  await page.getByRole('button', { name: 'Field overview ↗', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Field overview', exact: true })).toBeVisible();
  await assertSeparateAreas(page);
  await page.getByRole('button', { name: 'Close evidence inspector' }).click();
  await page.getByRole('button', { name: 'Analysis Split workspace', exact: true }).click();
  await assertSeparateAreas(page);
  await page.getByRole('button', { name: 'Explorer workspace', exact: true }).click();
  await sources.getByRole('button', { name: 'INCOIS chlorophyll', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Water Column 3D', exact: true })).toBeDisabled();
  await assertSeparateAreas(page);
  expect(await page.locator('html').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
});
