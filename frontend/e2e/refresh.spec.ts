import { expect, test } from "@playwright/test";

test('desktop refresh supports click, keyboard and a deliberate pull', async ({ page }) => {
  await page.goto(process.env.OCEANTWIN_LIVE_URL!.split('#')[0] + '#/about');
  const refresh = page.getByRole('button', { name: 'Refresh workspace', exact: true });
  await expect(refresh).toBeVisible();
  await Promise.all([page.waitForEvent('load'), refresh.click()]);
  await expect(page).toHaveURL(/#\/about$/);
  await expect(refresh).toBeEnabled();
  await Promise.all([page.waitForEvent('load'), refresh.press('Enter')]);
  await expect(refresh).toBeEnabled();
  const box = (await refresh.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  // A short drag is cancelled rather than accidentally becoming a click.
  let loads = 0;
  page.on('load', () => loads++);
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x, y + 25, { steps: 4 }); await page.mouse.up();
  await expect(refresh).toHaveAttribute('data-pull-ready', 'false');
  expect(loads).toBe(0);
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x, y + 90, { steps: 6 });
  await expect(refresh).toHaveAttribute('data-pull-ready', 'true');
  await Promise.all([page.waitForEvent('load'), page.mouse.up()]);
  await expect(refresh).toBeEnabled();
  await expect(page).toHaveURL(/#\/about$/);
});

test('mobile refresh accepts a touch pull without stealing document scrolling', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(process.env.OCEANTWIN_LIVE_URL!.split('#')[0] + '#/about');
  const refresh = page.getByRole('button', { name: 'Refresh workspace', exact: true });
  await expect(refresh).toBeVisible();
  const box = (await refresh.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  const touch = await context.newCDPSession(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 95 }] });
  await expect(refresh).toHaveAttribute('data-pull-ready', 'true');
  await Promise.all([page.waitForEvent('load'), touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })]);
  await expect(refresh).toBeEnabled();
  await expect(page).toHaveURL(/#\/about$/);

  const contextHeader = page.getByTestId('scientific-context-header');
  await expect(contextHeader).toBeVisible();
  await expect(contextHeader).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);
});
