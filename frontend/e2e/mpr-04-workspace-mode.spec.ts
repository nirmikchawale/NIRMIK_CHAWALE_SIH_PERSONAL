import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
async function openExplorer(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL required for MPR-04 acceptance.");
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench[data-page='explore']")).toBeVisible();
}

test("MPR-04 places Workspace Mode above the separate feature directory and source island", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExplorer(page);
  const islands = page.getByTestId("explorer-landing-islands");
  const mode = islands.getByTestId("mpr-04-workspace-mode-island");
  const dir = islands.getByTestId("rui-nav-02-explorer-directory");
  const source = islands.getByRole("region", { name: "Scientific source workspace" });
  await expect(mode).toBeVisible();
  await expect(dir).toBeVisible();
  await expect(source).toBeVisible();
  const [a, b, c] = await Promise.all([mode.boundingBox(), dir.boundingBox(), source.boundingBox()]);
  expect(a).not.toBeNull(); expect(b).not.toBeNull(); expect(c).not.toBeNull();
  expect(a!.y + a!.height).toBeLessThan(b!.y - 12);
  expect(b!.y + b!.height).toBeLessThan(c!.y - 12);
  await expect(mode.getByRole("group", { name: "Explorer workspace mode" }).getByRole("button")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Focus 3D" })).toHaveCount(1);
  await expect(dir.getByRole("group", { name: "Explorer workspace mode" })).toHaveCount(0);
  await expect(dir.getByRole("navigation", { name: "3D Explorer feature directory" }).locator("button[data-explorer-directory]")).toHaveCount(11);
});

test("MPR-04 mode changes preserve scientific source and verified block context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplorer(page);
  const shell = page.locator(".ocean-workbench");
  const mode = page.getByTestId("mpr-04-workspace-mode-island");
  const group = mode.getByRole("group", { name: "Explorer workspace mode" });
  const source = await shell.getAttribute("data-explore-source");
  const block = await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
  await group.getByRole("button", { name: "Analysis Split workspace" }).click();
  await expect(shell).toHaveAttribute("data-workspace-mode", "analysis");
  await expect(mode).toHaveAttribute("data-active-mode", "analysis");
  await expect(shell).toHaveAttribute("data-explore-source", source || "glorys");
  await group.getByRole("button", { name: "Explorer workspace" }).click();
  await expect(shell).toHaveAttribute("data-workspace-mode", "explorer");
  await expect(shell).toHaveAttribute("data-explore-source", source || "glorys");
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", block || "BASE-GLORYS-001");
});

test("MPR-04 presentation and focus exits preserve existing return paths", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplorer(page);
  const shell = page.locator(".ocean-workbench");
  const mode = page.getByTestId("mpr-04-workspace-mode-island");
  await mode.getByRole("button", { name: "Presentation workspace" }).click();
  await expect(shell).toHaveAttribute("data-workspace-mode", "presentation");
  await expect(page.getByRole("button", { name: "Exit presentation workspace" })).toBeVisible();
  await expect(mode).toBeHidden();
  await page.getByRole("button", { name: "Exit presentation workspace" }).click();
  await expect(shell).toHaveAttribute("data-workspace-mode", "explorer");
  await expect(mode).toBeVisible();
  await mode.getByRole("button", { name: "Focus 3D" }).click();
  await expect(shell).toHaveClass(/focus-mode/);
  await expect(mode).toBeHidden();
  await page.getByRole("button", { name: "Show panels" }).click();
  await expect(shell).not.toHaveClass(/focus-mode/);
  await expect(mode).toBeVisible();
});

for (const width of [320, 390, 1024]) {
  test(`MPR-04 workspace strip is responsive and keyboard accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openExplorer(page);
    const shell = page.locator(".ocean-workbench");
    const mode = page.getByTestId("mpr-04-workspace-mode-island");
    await expect(mode).toBeVisible();
    const buttons = mode.locator("button");
    await expect(buttons).toHaveCount(4);
    const island = await mode.boundingBox();
    expect(island).not.toBeNull();
    expect(island!.width).toBeGreaterThan(250);
    const rects = await buttons.evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, width: rect.width, height: rect.height };
    }));
    for (const box of rects) {
      expect(box.x).toBeGreaterThanOrEqual(island!.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(island!.x + island!.width + 1);
      expect(box.height).toBeGreaterThanOrEqual(43);
    }
    const analyze = mode.getByRole("button", { name: "Analysis Split workspace" });
    await analyze.focus();
    await page.keyboard.press("Enter");
    await expect(shell).toHaveAttribute("data-workspace-mode", "analysis");
    await expect(mode.getByRole("button", { name: "Analysis Split workspace" })).toHaveAttribute("aria-pressed", "true");
    await mode.getByRole("button", { name: "Explorer workspace" }).click();
    await expect(shell).toHaveAttribute("data-workspace-mode", "explorer");
  });
}

test("MPR-04 mode island derives accent from the existing glass theme without changing selection", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExplorer(page);
  const mode = page.getByTestId("mpr-04-workspace-mode-island");
  const selected = mode.getByRole("button", { name: "Explorer workspace" });
  const baseline = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  for (const preset of ["arctic-mist", "abyss-noir", "rose-quartz"]) {
    await page.locator("html").evaluate((root, theme) => { root.setAttribute("data-glass-theme", theme); }, preset);
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    const style = await mode.evaluate(node => {
      const css = getComputedStyle(node);
      return { radius: parseFloat(css.borderTopLeftRadius), color: css.color, background: css.backgroundColor };
    });
    expect(style.radius).toBeGreaterThanOrEqual(16);
    expect(style.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", baseline || "glorys");
  }
});
