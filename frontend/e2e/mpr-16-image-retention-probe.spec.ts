import { expect, test } from "@playwright/test";

// One real Chromium PNG only; never generate 96 screenshots just to diagnose
// the artifact-copy mechanism. Scientific runtime is the known verified build.
test("MPR-16 one genuine 3D screenshot is preserved in CI artifact", async ({ page }, info) => {
  test.setTimeout(120_000);
  const url = process.env.OCEANTWIN_LIVE_URL;
  expect(url, "Require live local server hosting the verified science artifact").toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });

  const geographic = page.locator("#mpr-3d-stage");
  const water = page.getByTestId("mpr-12-water-column-section");
  await expect(geographic).toBeVisible({ timeout: 30_000 });
  await expect(water).toBeVisible({ timeout: 30_000 });
  await geographic.scrollIntoViewIfNeeded();

  const path = info.outputPath("single-real-geographic-1440.png");
  const bytes = await page.screenshot({ path, animations: "disabled", timeout: 45_000 });
  expect(bytes.length, "This must be a non-empty real Chromium screenshot").toBeGreaterThan(1024);
  expect(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))).toBeTruthy();
  await info.attach("single-real-geographic-1440", { path, contentType: "image/png" });
  console.log("ONE_REAL_CHROMIUM_PNG_BYTES=" + bytes.length);
});
