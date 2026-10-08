import { expect, test, type Locator, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openLive(page: Page, hash = "#/explore") {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-VIS-01 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(`${base}${hash}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
}

async function numericStyle(locator: Locator, property: "fontSize" | "minHeight") {
  return locator.evaluate((element, key) => Number.parseFloat(getComputedStyle(element)[key]), property);
}

test("RUI-VIS-01 gives the frozen NAV-01 tree readable desktop hierarchy and deliberate collapsed state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLive(page, "#/explore");

  const root = page.getByTestId("app-navigation-root");
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  const tree = page.getByRole("tree", { name: "Ocean Canvas feature directory" });
  const breadcrumb = page.getByRole("navigation", { name: "Workspace breadcrumb" });
  const explorer = tree.getByRole("button", { name: "3D Explorer" });

  await expect(root).toHaveAttribute("data-collapsed", "false");
  await expect(root).toHaveAttribute("data-nav-directory", "explore");
  await expect(tree.locator("[role=treeitem]")).toHaveCount(6);

  const expandedBox = await root.boundingBox();
  expect(expandedBox).not.toBeNull();
  expect(expandedBox!.width).toBeGreaterThanOrEqual(260);
  expect(expandedBox!.width).toBeLessThanOrEqual(280);

  expect(await numericStyle(breadcrumb.locator("li").first(), "fontSize")).toBeGreaterThanOrEqual(10);
  expect(await numericStyle(explorer, "minHeight")).toBeGreaterThanOrEqual(48);
  expect(await numericStyle(explorer.locator(".rui-nav-copy strong"), "fontSize")).toBeGreaterThanOrEqual(13);
  expect(await numericStyle(explorer.locator(".rui-nav-copy small"), "fontSize")).toBeGreaterThanOrEqual(10);
  await expect(explorer.locator(".rui-nav-copy small")).toBeVisible();

  const activeBackground = await explorer.evaluate((element) => getComputedStyle(element).backgroundColor);
  const inactiveBackground = await tree.getByRole("button", { name: "Telemetry" }).evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(activeBackground).not.toBe(inactiveBackground);

  const sidebarBox = await sidebar.boundingBox();
  const contextBox = await page.locator(".scientific-context-header").boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(contextBox).not.toBeNull();
  expect(contextBox!.x).toBeGreaterThanOrEqual(sidebarBox!.x + sidebarBox!.width - 1);

  await sidebar.getByRole("button", { name: "Collapse workspace sidebar" }).click();
  await expect(root).toHaveAttribute("data-collapsed", "true");
  await expect.poll(async () => (await root.boundingBox())?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(76);
  await expect(breadcrumb).toBeHidden();
  await expect(explorer.locator(".rui-nav-copy")).toBeHidden();
  await expect(explorer.locator(".rui-nav-short")).toBeVisible();
  expect(await numericStyle(explorer, "minHeight")).toBeGreaterThanOrEqual(48);

  await sidebar.getByRole("button", { name: "Expand workspace sidebar" }).click();
  await expect(root).toHaveAttribute("data-collapsed", "false");
  await tree.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(root).toHaveAttribute("data-nav-directory", "analyse");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Telemetry");
});

test("RUI-VIS-01 preserves readable tablet density and truncates shell chrome without changing hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/compare");

  const root = page.getByTestId("app-navigation-root");
  const tree = page.getByRole("tree", { name: "Ocean Canvas feature directory" });
  const breadcrumb = page.getByRole("navigation", { name: "Workspace breadcrumb" });

  const rootBox = await root.boundingBox();
  expect(rootBox).not.toBeNull();
  expect(rootBox!.width).toBeGreaterThanOrEqual(220);
  expect(rootBox!.width).toBeLessThanOrEqual(245);
  await expect(tree.locator("[data-nav-group]")).toHaveCount(4);
  await expect(tree.locator("[role=treeitem]")).toHaveCount(6);
  await expect(tree.getByRole("button", { name: "Model vs Observation" })).toHaveClass(/active/);

  const breadcrumbOverflow = await breadcrumb.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(breadcrumbOverflow).toBeLessThanOrEqual(1);
  expect(await numericStyle(tree.getByRole("button", { name: "Model vs Observation" }), "minHeight")).toBeGreaterThanOrEqual(48);
  const tabletDescription = tree.getByRole("button", { name: "Model vs Observation" }).locator(".rui-nav-copy small");
  await expect(tabletDescription).toBeVisible();
  await expect(tabletDescription).toHaveCSS("white-space", "normal");
  expect(await tabletDescription.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBeTruthy();

  const transition = await tree.getByRole("button", { name: "Model vs Observation" }).evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transition.split(",").every((value) => value.trim() === "0s")).toBeTruthy();
});

test("RUI-VIS-01 mobile drawer keeps touch targets, breadcrumb context, Escape recovery and scientific-context separation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/anomaly");

  const root = page.getByTestId("app-navigation-root");
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  const mobileCurrent = page.getByTestId("mobile-workspace-nav");
  expect(await numericStyle(trigger, "minHeight")).toBeGreaterThanOrEqual(40);
  await expect(mobileCurrent).toContainText("ANALYSE");
  await expect(mobileCurrent).toContainText("Anomaly Screening");

  await trigger.click();
  await expect(root).toHaveAttribute("data-mobile-open", "true");

  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  const breadcrumb = page.getByRole("navigation", { name: "Workspace breadcrumb" });
  const items = sidebar.locator(".rui-nav-item");
  const drawerBox = await sidebar.boundingBox();
  expect(drawerBox).not.toBeNull();
  expect(drawerBox!.width).toBeLessThanOrEqual(340);
  expect(drawerBox!.x).toBeGreaterThanOrEqual(0);
  expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(390);

  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Anomaly Screening");
  const breadcrumbOverflow = await breadcrumb.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(breadcrumbOverflow).toBeLessThanOrEqual(1);

  const itemCount = await items.count();
  expect(itemCount).toBe(6);
  for (let index = 0; index < itemCount; index += 1) {
    expect(await numericStyle(items.nth(index), "minHeight")).toBeGreaterThanOrEqual(48);
  }
  expect(await numericStyle(sidebar.getByRole("button", { name: "Close workspace navigation" }), "minHeight")).toBeGreaterThanOrEqual(42);

  // The scientific context remains a separate shell surface; the drawer contains hierarchy only.
  await expect(page.getByTestId("scientific-context-header")).toBeVisible();
  await expect(sidebar.getByRole("tree", { name: "Ocean Canvas feature directory" })).not.toContainText("GLORYS12V1");

  await page.keyboard.press("Escape");
  await expect(root).toHaveAttribute("data-mobile-open", "false");
  await expect(trigger).toBeFocused();
});

test("RUI-VIS-01 shell remains legible in both theme surfaces without mutating navigation semantics", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/data-lab");

  const root = page.getByTestId("app-navigation-root");
  const active = page.getByRole("button", { name: "Data Lab" });
  const tree = page.getByRole("tree", { name: "Ocean Canvas feature directory" });

  for (const theme of ["dark", "light"] as const) {
    await page.locator("html").evaluate((element, value) => element.setAttribute("data-theme", value), theme);
    const surface = await page.getByRole("navigation", { name: "Ocean Canvas workspaces" }).evaluate((element) => getComputedStyle(element).backgroundColor);
    const text = await active.evaluate((element) => getComputedStyle(element).color);
    expect(surface).not.toBe("rgba(0, 0, 0, 0)");
    expect(text).not.toBe("rgba(0, 0, 0, 0)");
    await expect(root).toHaveAttribute("data-nav-directory", "data");
    await expect(tree.locator("[role=treeitem]")).toHaveCount(6);
  }
});


test("RUI-VIS-01 sidebar icon badges and text stay in separate columns on narrow phones", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, "#/explore");

  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  const sidebar = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
  const items = sidebar.locator(".rui-nav-item");
  await expect(items).toHaveCount(6);

  // The legacy feature-rail button style centers grid children; long subtitles
  // must remain constrained to their own column rather than cover the icon.
  for (const width of [320, 368, 390]) {
    await page.setViewportSize({ width, height: 760 });
    await expect(sidebar).toBeVisible();

    for (const item of await items.all()) {
      const badge = await item.locator(".rui-nav-short").boundingBox();
      const copy = await item.locator(".rui-nav-copy").boundingBox();
      const button = await item.boundingBox();
      expect(badge).not.toBeNull();
      expect(copy).not.toBeNull();
      expect(button).not.toBeNull();

      // Allow a 1px tolerance for fractional layout and device pixel rounding.
      expect(copy!.x).toBeGreaterThanOrEqual(badge!.x + badge!.width + 5);
      expect(copy!.x + copy!.width).toBeLessThanOrEqual(button!.x + button!.width - 4);
      for (const selector of [".rui-nav-copy strong", ".rui-nav-copy small"]) {
        const text = item.locator(selector);
        const textBox = await text.boundingBox();
        expect(textBox).not.toBeNull();
        expect(textBox!.x).toBeGreaterThanOrEqual(copy!.x - 1);
        expect(textBox!.x + textBox!.width).toBeLessThanOrEqual(copy!.x + copy!.width + 1);
        expect(textBox!.y + textBox!.height).toBeLessThanOrEqual(button!.y + button!.height - 3);
      }
      const title = item.locator(".rui-nav-copy strong");
      await expect(title).toHaveCSS("white-space", "nowrap");
      const description = item.locator(".rui-nav-copy small");
      await expect(description).toHaveCSS("white-space", "normal");
      await expect(description).toHaveCSS("text-overflow", "clip");
      const metrics = await description.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      }));
      expect(metrics.height).toBeGreaterThan(metrics.lineHeight * 1.5);
      expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 3 + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
    }
  }
});
