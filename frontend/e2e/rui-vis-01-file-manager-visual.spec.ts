import { expect, test, type Page } from "@playwright/test";
const liveUrl = process.env.OCEANTWIN_LIVE_URL;
async function openLive(page: Page, hash = "#/explore") {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL required");
  await page.goto(liveUrl.replace(/#.*$/, "") + hash, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
}

test("RUI-VIS-01 adaptive rail leaves main content width stable while displaying readable directory", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLive(page);
  const rail = page.getByTestId("mpr-workspace-rail");
  const context = page.getByTestId("scientific-context-header");
  const workspace = page.locator(".workspace-frame > .workspace");
  const xBefore = await workspace.boundingBox();
  await expect(rail).toBeVisible();
  expect((await rail.boundingBox())!.width).toBeLessThanOrEqual(76);
  await rail.getByRole("button", { name: "Open Explore workspaces" }).click();
  const nav = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(nav).toBeVisible();
  const tree = nav.getByRole("tree", { name: "Ocean Canvas feature directory" });
  await expect(tree.locator("[role=treeitem]")).toHaveCount(6);
  await expect(tree.locator('[data-directory-view="explore"]')).toBeVisible();
  await expect(tree.getByRole("button", { name: "3D Explorer" })).toHaveAttribute("aria-current", "page");
  const desc = tree.getByRole("button", { name: "3D Explorer" }).locator(".rui-nav-copy small");
  await expect(desc).toBeVisible();
  const after = await workspace.boundingBox();
  expect(Math.abs((after?.width ?? 0) - (xBefore?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((after?.x ?? 0) - (xBefore?.x ?? 0))).toBeLessThanOrEqual(1);
  await expect(context).toBeAttached();
  await nav.getByRole("button", { name: "Close workspace directory" }).click();
  await expect(nav).toBeHidden();
});

test("RUI-VIS-01 tablet navigation preserves context, drawer width and focus", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/compare");
  const rail = page.getByTestId("mpr-workspace-rail");
  const root = page.getByTestId("app-navigation-root");
  await expect(root).toHaveAttribute("data-nav-directory", "analyse");
  expect((await root.boundingBox())!.width).toBeLessThanOrEqual(76);
  const trigger = rail.getByRole("button", { name: "Open Analyze workspaces" });
  await trigger.click();
  const directory = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(directory.getByRole("button", { name: "Model vs Observation" })).toBeVisible();
  const box = await directory.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(280);
  expect(box!.width).toBeLessThanOrEqual(330);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1024);
  await page.keyboard.press("Escape");
  await expect(directory).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("RUI-VIS-01 mobile navigation remains touch-friendly and scientific context stays separate", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/anomaly");
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  await expect(page.getByTestId("mobile-workspace-nav")).toContainText("Anomaly Screening");
  await trigger.click();
  const drawer = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await expect(drawer).toBeVisible();
  expect((await drawer.boundingBox())!.width).toBeLessThanOrEqual(340);
  await expect(drawer.getByRole("navigation", { name: "Workspace breadcrumb" })).toContainText("Anomaly Screening");
  const categoryButtons = drawer.locator(".mpr-drawer-category");
  await expect(categoryButtons).toHaveCount(4);
  for (const button of await categoryButtons.all()) {
    expect(await button.evaluate(el => Number.parseFloat(getComputedStyle(el).minHeight))).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByTestId("scientific-context-header")).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("RUI-VIS-01 selected categories adapt to both light and dark theme surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await openLive(page, "#/data-lab");
  const trigger = page.getByRole("button", { name: "Open Data workspaces" });
  const root = page.getByTestId("app-navigation-root");
  const accents: string[] = [];
  for (const theme of ["abyss-noir", "arctic-mist", "deep-sea-emerald", "rose-quartz"]) {
    await page.locator("html").evaluate((element, value) => element.setAttribute("data-glass-theme", value), theme);
    const accent = await root.evaluate(el => getComputedStyle(el.closest(".ocean-workbench")!).getPropertyValue("--mpr-accent").trim());
    expect(accent).not.toBe("");
    accents.push(accent);
    await expect(root).toHaveAttribute("data-nav-directory", "data");
    await expect(trigger).toHaveAttribute("aria-current", "true");
    await trigger.click();
    await expect(page.getByRole("navigation", { name: "Ocean Canvas workspaces" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  expect(new Set(accents).size).toBeGreaterThan(1);
});

test("RUI-VIS-01 320px drawer contains complete selected page labels without badge overlap", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await openLive(page);
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  const drawer = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  await drawer.getByRole("button", { name: "Analyze", exact: true }).click();
  const items = drawer.locator('.rui-nav-group:not([hidden]) .rui-nav-item');
  await expect(items).toHaveCount(3);
  for (const item of await items.all()) {
    const badge = await item.locator(".rui-nav-short").boundingBox();
    const copy = await item.locator(".rui-nav-copy").boundingBox();
    const button = await item.boundingBox();
    expect(badge).not.toBeNull(); expect(copy).not.toBeNull(); expect(button).not.toBeNull();
    expect(copy!.x).toBeGreaterThanOrEqual(badge!.x + badge!.width + 3);
    expect(copy!.x + copy!.width).toBeLessThanOrEqual(button!.x + button!.width + 1);
    expect(button!.x + button!.width).toBeLessThanOrEqual(320);
  }
});