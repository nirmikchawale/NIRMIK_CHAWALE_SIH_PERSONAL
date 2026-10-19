import { expect, test, type Page } from "@playwright/test";

/**
 * M008 development-only regression: verify the CURRENT rendered MPR contract.
 * Old shard-1 assertions were bound to removed 3DB water-column shells and a
 * pre-Arctic-Mist default theme. Never mock source measurements or skip a real
 * failed assertion to get a green report.
 */
const baseUrl = process.env.OCEANTWIN_LIVE_URL;

function requirePreviewUrl(): string {
  if (!baseUrl) throw new Error("M008 requires OCEANTWIN_LIVE_URL pointing to a real preview of THIS build.");
  return baseUrl.split("#")[0] + "#/explore";
}

async function chooseGlassTheme(page: Page, name: string) {
  const appearance = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  await expect(appearance).toBeVisible();
  await appearance.click();
  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await expect(gallery).toBeVisible();
  await gallery.getByRole("button", { name: new RegExp(name, "i") }).click();
  await expect(gallery).toBeHidden();
}

test("M008 default/light-to-dark theme regression uses real appearance controls", async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(requirePreviewUrl(), { waitUntil: "domcontentloaded" });

  const root = page.locator("html");
  const workbench = page.locator('.ocean-workbench[data-page="explore"]');
  await expect(workbench).toBeVisible({ timeout: 45_000 });
  await expect(root).toHaveAttribute("data-glass-theme", "arctic-mist");
  await expect(root).toHaveAttribute("data-theme", "light");

  const originalBlock = await root.getAttribute("data-active-main-block");
  const originalScientificSource = await workbench.getAttribute("data-explore-source");
  const colourbar = page.locator(".colorbar-interactive-track");
  await expect(colourbar).toBeAttached();
  const originalScientificPalette = await colourbar.evaluate(el => getComputedStyle(el).backgroundImage);

  await chooseGlassTheme(page, "Aurora Borealis");
  await expect(root).toHaveAttribute("data-glass-theme", "aurora-borealis");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await chooseGlassTheme(page, "Arctic Mist");
  await expect(root).toHaveAttribute("data-glass-theme", "arctic-mist");
  await expect(root).toHaveAttribute("data-theme", "light");

  await expect(root).toHaveAttribute("data-active-main-block", originalBlock ?? "BASE-GLORYS-001");
  await expect(workbench).toHaveAttribute("data-explore-source", originalScientificSource ?? "glorys");
  expect(await colourbar.evaluate(el => getComputedStyle(el).backgroundImage))
    .toBe(originalScientificPalette);
  await info.attach("m008-theme-browser-contract.json", {
    body: Buffer.from(JSON.stringify({
      preview: page.url(), oldFailure: "Expected dark, got light (obsolete test)",
      verifiedDefault: "arctic-mist/light", verifiedSwitch: "aurora-borealis/dark -> arctic-mist/light",
      source: originalScientificSource, blockId: originalBlock
    }, null, 2)),
    contentType: "application/json"
  });
});

test("M008 planned block remains visible but holds back nonexistent 3D science", async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const url = requirePreviewUrl() + "?block=IO-003";
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const context = page.getByTestId("scientific-context-bar");
  await expect(context).toHaveAttribute("data-block-id", "IO-003", { timeout: 45_000 });
  const openWater = page.getByRole("button", { name: "Open in Water Column 3D" }).first();
  await expect(openWater).toBeEnabled({ timeout: 30_000 });
  await openWater.click();

  // The current UI uses the scroll-owned MPR-12 section, NOT a retired
  // ".planned-main-block-shell" or an artificial WaterColumn3D canvas.
  const water = page.getByTestId("mpr-12-water-column-section");
  await expect(water).toBeVisible({ timeout: 30_000 });
  await expect(water).toHaveAttribute("data-linked-block", "IO-003");
  await expect(water).toHaveAttribute("data-linked-evidence", "planned");
  const withheld = water.locator(".mpr-water-column-unavailable");
  await expect(withheld).toBeVisible();
  await expect(withheld).toContainText("Planned block · water-column evidence withheld");
  await expect(withheld).toContainText("No copied, extrapolated or synthetic ocean values");
  await expect(water.locator(".water-column-canvas")).toHaveCount(0);
  await expect(page.locator(".planned-main-block-shell")).toHaveCount(0);
  await info.attach("m008-planned-block-browser-contract.json", {
    body: Buffer.from(JSON.stringify({
      preview: page.url(), block: "IO-003",
      DOM: "mpr-12-water-column-section",
      evidenceState: await water.getAttribute("data-linked-evidence"),
      measuredWaterColumnCanvasCount: await water.locator(".water-column-canvas").count(),
      originalFailure: "Expected retired planned-main-block-shell"
    }, null, 2)),
    contentType: "application/json"
  });
});
