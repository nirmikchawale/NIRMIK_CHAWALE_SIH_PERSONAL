import { expect, test } from "@playwright/test";
test("3DB-15 stage switch never obstructs genuine globe basemap controls", async ({ page }) => {
  // Cesium software-rendered imagery can saturate the CI worker; preserve
  // genuine clickable basemap assertions rather than timing out mid-render.
  test.setTimeout(240_000);
  const url = process.env.OCEANTWIN_LIVE_URL;
  if (!url) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible({ timeout: 30_000 });
  // MPR relocated Explorer controls to a genuine dock rather than an
  // overlapping legacy hide/show overlay. Verify the active dock is mounted
  // and retain all pixel-overlap + accessible imagery checks below.
  const dock = page.locator(".station-workspace > .control-panel");
  await expect(dock).toHaveAttribute("data-mpr-geographic-dock", "true");
  const stage = page.getByRole("button", { name: "Switch to Water Column 3D" });
  await expect(stage).toBeVisible();
  const globe = page.locator(".globe-shell").first();
  const imagery = globe.locator(".imagery-control");
  await expect(imagery).toBeVisible({ timeout: 45_000 });
  const offline = imagery.getByRole("button", { name: "Offline", exact: true });
  await expect(offline).toBeVisible({ timeout: 45_000 });
  const stageBox = await stage.boundingBox();
  const offlineBox = await offline.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(offlineBox).not.toBeNull();
  const overlapWidth = Math.max(0,
    Math.min(stageBox!.x + stageBox!.width, offlineBox!.x + offlineBox!.width) -
    Math.max(stageBox!.x, offlineBox!.x));
  const overlapHeight = Math.max(0,
    Math.min(stageBox!.y + stageBox!.height, offlineBox!.y + offlineBox!.height) -
    Math.max(stageBox!.y, offlineBox!.y));
  expect(overlapWidth * overlapHeight).toBe(0);
  await offline.click({ timeout: 30_000 });
  await expect(globe).toHaveAttribute("data-imagery-preference", "offline");
  await imagery.getByRole("button", { name: "High-res auto" }).click({ timeout: 30_000 });
  await expect(globe).toHaveAttribute("data-imagery-preference", "auto");
});
