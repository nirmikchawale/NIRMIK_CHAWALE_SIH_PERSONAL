import { expect, test } from "@playwright/test";

// UIX-03: one physical Chromium PNG at the exact MPR-16 viewport.
// Diagnoses the 45-second screenshot stall without repeating 16-theme/96-PNG CI.
test("UIX03 single genuine wide-desktop Geographic screenshot", async ({ page }, info) => {
  test.setTimeout(120_000);
  const base = process.env.OCEANTWIN_LIVE_URL;
  if (!base?.startsWith("https://")) throw new Error("Use actual HTTPS production, no mocked source");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const geo = page.locator("#mpr-3d-stage");
  const water = page.getByTestId("mpr-12-water-column-section");
  await expect(geo).toBeVisible({ timeout: 30_000 });
  await expect(water).toBeVisible();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source", /^(glorys|incois)/);
  await geo.scrollIntoViewIfNeeded();
  const started = Date.now();
  const png = await page.screenshot({
    path: info.outputPath("uix03-wide-geographic.png"),
    animations: "disabled",
    timeout: 45_000
  });
  console.log("UIX03 live screenshot elapsed ms:", Date.now() - started, "bytes:", png.length);
  expect(png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))).toBe(true);
  expect(png.readUInt32BE(16)).toBe(1440);
  expect(png.readUInt32BE(20)).toBe(900);
  await info.attach("uix03-genuine-geographic", { body: png, contentType: "image/png" });
});
