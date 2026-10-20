import { expect, test, type Page } from "@playwright/test";

// UIX-02-D: genuine native Analysis Split/Focus 3D responsive audit.
// No mocked observations, source data or science fixtures.
const live = process.env.OCEANTWIN_LIVE_URL;
if (!live || !(live.startsWith("http://") || live.startsWith("https://"))) {
  throw new Error("UIX-02-D needs an absolute OCEANTWIN_LIVE_URL");
}
async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("mpr-block-details-workspace")).toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

for (const width of [320, 768, 1440]) {
  test(`UIX02-D Analysis Split has accessible, non-occluding native panels at ${width}px`, async ({ page }) => {
    test.setTimeout(150_000);
    await open(page, width);
    const root = page.locator(".ocean-workbench");
    const source = await root.getAttribute("data-explore-source");
    const block = await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
    const mode = page.getByTestId("mpr-04-workspace-mode-island");
    const analysis = mode.getByRole("button", { name: "Analysis Split workspace" });
    await analysis.focus();
    await page.keyboard.press("Enter");
    await expect(root).toHaveAttribute("data-workspace-mode", "analysis");
    await expect(analysis).toHaveAttribute("aria-pressed", "true");
    const panel = page.getByRole("complementary", { name: "Analysis Split workspace" });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Source");
    await expect(panel).toContainText("Verified time");
    const stage = page.locator("#mpr-3d-stage");
    await expect(stage).toBeVisible();
    const a = await panel.boundingBox();
    const g = await stage.boundingBox();
    expect(a && g).toBeTruthy();
    console.log("UIX02D Analysis geometry", width, a, g);
    for (const rectangle of [a!,g!]) {
      expect(rectangle.width).toBeGreaterThan(240);
      expect(rectangle.x).toBeGreaterThanOrEqual(-2);
      expect(rectangle.x + rectangle.width).toBeLessThanOrEqual(width + 3);
    }
    const overlapW = Math.max(0, Math.min(a!.x+a!.width, g!.x+g!.width)-Math.max(a!.x,g!.x));
    const overlapH = Math.max(0, Math.min(a!.y+a!.height, g!.y+g!.height)-Math.max(a!.y,g!.y));
    expect(overlapW*overlapH, "Real analytic panel must not cover the native globe stage").toBeLessThanOrEqual(8);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow, "No horizontal viewport loss").toBeLessThanOrEqual(3);
    await expect(root).toHaveAttribute("data-explore-source", source || "glorys");
    await mode.getByRole("button", { name: "Explorer workspace" }).click();
    await expect(root).toHaveAttribute("data-workspace-mode", "explorer");
    await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute(
      "data-block-id", block || "BASE-GLORYS-001");
  });
}

for (const width of [390, 1440]) {
  test(`UIX02-D Focus 3D maximizes real renderer and keyboard Escape restores panels at ${width}px`, async ({ page }) => {
    test.setTimeout(150_000);
    await open(page, width);
    const root = page.locator(".ocean-workbench");
    const source = await root.getAttribute("data-explore-source");
    const block = await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
    const mode = page.getByTestId("mpr-04-workspace-mode-island");
    const focus = mode.getByRole("button", { name: "Focus 3D" });
    await focus.focus();
    await page.keyboard.press("Enter");
    await expect(root).toHaveClass(/focus-mode/);
    await expect(mode).toBeHidden();
    const stage = page.locator("#mpr-3d-stage");
    await expect(stage).toBeVisible();
    const rect = await stage.boundingBox();
    console.log("UIX02D Focus geometry", width, rect);
    expect(rect).toBeTruthy();
    expect(rect!.width).toBeGreaterThan(width * .70);
    expect(rect!.x).toBeGreaterThanOrEqual(-2);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 3);
    await expect(root).toHaveAttribute("data-explore-source", source || "glorys");
    await page.keyboard.press("Escape");
    await expect(root).not.toHaveClass(/focus-mode/);
    await expect(mode).toBeVisible();
    await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute(
      "data-block-id", block || "BASE-GLORYS-001");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))
      .toBeLessThanOrEqual(3);
  });
}
