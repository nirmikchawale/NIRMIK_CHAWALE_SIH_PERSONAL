import { expect, test } from "@playwright/test";
test("3DB-15 stage switch never obstructs genuine globe basemap controls", async ({ page }) => {
  test.setTimeout(90_000);
  const url = process.env.OCEANTWIN_LIVE_URL;
  if (!url) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible({ timeout: 30_000 });
  const shell = page.locator(".app-shell");
  if ((await shell.getAttribute("data-control-dock")) === "open") {
    await page.getByRole("button", { name: "Hide explorer controls" }).click();
  }
  const stage = page.getByRole("button", { name: "Switch to Water Column 3D" });
  await expect(stage).toBeVisible();
  const globe = page.locator(".globe-shell").first();
  const offline = page.getByRole("button", { name: "Offline", exact: true });
  await expect(offline).toBeVisible();
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
  await offline.click({ timeout: 10_000 });
  await expect(globe).toHaveAttribute("data-imagery-preference", "offline");
  await page.getByRole("button", { name: "High-res auto" }).click({ timeout: 10_000 });
  await expect(globe).toHaveAttribute("data-imagery-preference", "auto");
});
