import { expect, test, type Page } from "@playwright/test";

// UIX-04A is a read-only keyboard/accessibility audit. No synthetic science,
// bypassed browser gestures, CSS changes, or UIX-03 release-branch edits.
const base = process.env.OCEANTWIN_LIVE_URL;

async function openNativeExplorer(page: Page, width: number) {
  if (!base || !/^https?:\/\//.test(base)) {
    throw new Error("UIX-04A requires the real absolute OCEANTWIN_LIVE_URL");
  }
  await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base.replace(/#.*$/, "") + "#/explore", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('.ocean-workbench[data-page="explore"]'))
    .toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.getByTestId("app-navigation-root")).toBeVisible();
}

function navigation(page: Page) {
  return page.locator("#ocean-canvas-workspace-navigation");
}

function launcher(page: Page, width: number) {
  return width <= 900
    ? page.getByRole("button", { name: "Open workspace navigation" })
    : page.getByRole("button", { name: "Open Analyze workspaces" });
}

async function expectClosedNavigation(page: Page) {
  const root = page.getByTestId("app-navigation-root");
  const drawer = navigation(page);
  await expect(root).toHaveAttribute("data-drawer-open", "false");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");
  await expect(drawer).toHaveAttribute("inert", "");
}

for (const width of [390, 1440]) {
  test("UIX04A opening and Escape restore real drawer focus at " + width + "px", async ({ page }) => {
    test.setTimeout(120_000);
    await openNativeExplorer(page, width);
    const root = page.getByTestId("app-navigation-root");
    const drawer = navigation(page);
    const trigger = launcher(page, width);

    await expectClosedNavigation(page);
    await trigger.focus();
    await page.keyboard.press("Enter");

    await expect(root).toHaveAttribute("data-drawer-open", "true");
    await expect(drawer).not.toHaveAttribute("aria-hidden", "true");
    await expect(drawer).not.toHaveAttribute("inert", "");
    await expect(drawer).toBeVisible();

    const selected = width <= 900 ? "Explore" : "Analyze";
    await expect(drawer.getByRole("button", { name: selected, exact: true }))
      .toBeFocused({ timeout: 10_000 });

    await page.keyboard.press("Escape");
    await expectClosedNavigation(page);
    await expect(trigger).toBeFocused();
  });

  test("UIX04A Tab and Shift+Tab remain inside visible workspace drawer at " + width + "px", async ({ page }) => {
    test.setTimeout(120_000);
    await openNativeExplorer(page, width);
    await launcher(page, width).click();
    const drawer = navigation(page);
    await expect(drawer).toBeVisible();
    const visibleButtons = drawer.locator('button:visible:not(:disabled):not([tabindex="-1"])');
    expect(await visibleButtons.count()).toBeGreaterThanOrEqual(5);

    await visibleButtons.last().focus();
    await page.keyboard.press("Tab");
    await expect(visibleButtons.first()).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(visibleButtons.last()).toBeFocused();

    await page.keyboard.press("Escape");
    await expectClosedNavigation(page);
  });

  test("UIX04A real keyboard route choice closes inert drawer and returns focus at " + width + "px", async ({ page }) => {
    test.setTimeout(120_000);
    await openNativeExplorer(page, width);
    await launcher(page, width).click();
    const drawer = navigation(page);
    await drawer.getByRole("button", { name: "Analyze", exact: true }).click();
    const target = drawer.getByRole("button", { name: "Telemetry", exact: true });
    await target.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#\/telemetry$/);
    await expect(page.locator('.ocean-workbench[data-page="telemetry"]')).toBeVisible();
    await expect(page.locator(".telemetry-page")).toBeVisible();
    await expectClosedNavigation(page);

    const recovery = width <= 900
      ? page.getByRole("button", { name: "Open workspace navigation" })
      : page.getByRole("button", { name: "Open Analyze workspaces" });
    await expect(recovery).toBeFocused();
  });
}
