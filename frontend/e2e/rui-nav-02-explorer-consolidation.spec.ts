import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openLive(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-02 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(`${base}#/explore`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible();
  await expect(page.getByTestId("rui-nav-02-explorer-directory")).toBeVisible();
}

test("RUI-NAV-02 exposes one canonical 3D Explorer directory with all frozen homes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const directory = page.getByRole("navigation", { name: "3D Explorer feature directory" });
  await expect(directory).toBeVisible();
  await expect(directory.locator("button[data-explorer-directory]")).toHaveCount(11);

  const expected = [
    "Overview",
    "Workspace",
    "Block System",
    "Scene Controls",
    "Variables",
    "Display Range",
    "Depth & Section",
    "Time",
    "Observations",
    "Render Quality",
    "Context & Info"
  ];
  for (const label of expected) await expect(directory.getByRole("button", { name: label })).toBeVisible();

  // The legacy header switcher remains only as an App-state delegate; the visible
  // canonical workspace control now lives in the Explorer directory.
  await expect(page.locator(".app-header > .header-status > .workspace-mode-switcher")).toBeHidden();
  const workspace = page.getByRole("group", { name: "Explorer workspace mode" });
  await expect(workspace).toBeVisible();

  await workspace.getByRole("button", { name: "Analysis Split workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "analysis");
  await workspace.getByRole("button", { name: "Explorer workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "explorer");
});

test("RUI-NAV-02 moves block launchers into the canonical Block System without changing their engines", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const blockSystem = page.getByTestId("rui-nav-02-block-system");
  await expect(blockSystem).toBeVisible();
  await expect(blockSystem.getByTestId("phase35-main-block-engine")).toBeVisible();
  await expect(blockSystem.getByTestId("phase3-arabian-atlas")).toBeVisible();

  const blockLauncher = blockSystem.getByTestId("phase35-block-launcher");
  const atlasLauncher = blockSystem.getByTestId("phase3-atlas-launcher");
  await expect(blockLauncher).toBeVisible();
  await expect(atlasLauncher).toBeVisible();
  await expect(blockLauncher).toHaveCSS("position", "static");
  await expect(atlasLauncher).toHaveCSS("position", "static");

  await blockLauncher.click();
  await expect(page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" })).toBeVisible();
  await expect(page.getByTestId("phase35-materialization-summary")).toBeVisible();
  await page.getByRole("button", { name: "Close main block engine" }).click();

  await atlasLauncher.click();
  await expect(page.getByRole("dialog", { name: /Arabian Sea 3D Sector Atlas/i })).toBeVisible();
  await page.getByRole("button", { name: "Close 3D sector atlas" }).click();
});

test("RUI-NAV-02 retains a usable directory and block home on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page);

  const directory = page.getByTestId("rui-nav-02-explorer-directory");
  await expect(directory).toBeVisible();
  await expect(page.getByRole("group", { name: "Explorer workspace mode" })).toBeVisible();
  await expect(page.getByTestId("rui-nav-02-block-system")).toBeVisible();
  await expect(page.getByTestId("phase35-block-launcher")).toBeVisible();
  await expect(page.getByTestId("phase3-atlas-launcher")).toBeVisible();
});
