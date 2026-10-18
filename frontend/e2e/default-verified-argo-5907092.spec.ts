import { expect, test } from "@playwright/test";

// Exercise actual static-hosted or local API science rather than mocking model
// measurements; a default observation must be provider-QC accepted in reality.
const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL is required");

const url = live!.replace(/#.*$/, "") + "#/explore";

test("Fresh Geographic View defaults to BASE-GLORYS-001 and genuine Argo 5907092 Cycle 13", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const stage = page.locator('[aria-label="Connected geographic and water-column visualization stage"]');
  await expect(stage).toHaveAttribute("data-linked-block", "BASE-GLORYS-001", { timeout: 60000 });
  await expect(stage).toHaveAttribute("data-selected-argo-float", "5907092", { timeout: 60000 });
  await expect(page.locator('[data-testid="scientific-context-bar"]')).toHaveAttribute(
    "data-block-id", "BASE-GLORYS-001"
  );
  // Source health and a selected observation are separate contracts: never
  // assert a healthy badge merely because a real float was selected.
  await expect(page.locator(".system-pill")).toContainText(/VERIFIED SNAPSHOT|DEGRADED MODE/);
});

test("An explicit valid Argo profile deep link overrides the Cycle 13 default", async ({ page }) => {
  await page.goto(url + "?block=BASE-GLORYS-001&profile=20240102_indian_ocean_prof%3A26", {
    waitUntil: "domcontentloaded"
  });
  const stage = page.locator('[aria-label="Connected geographic and water-column visualization stage"]');
  await expect(stage).toHaveAttribute("data-selected-argo-profile", "20240102_indian_ocean_prof:26", { timeout: 60000 });
  await expect(stage).toHaveAttribute("data-selected-argo-cycle", "12");
  await expect(stage).toHaveAttribute("data-selected-argo-float", "5907092");
});

test("Selecting a genuine pilot does not mislabel baseline Argo as pilot validation", async ({ page }) => {
  await page.goto(url + "?block=IO-001", { waitUntil: "domcontentloaded" });
  const stage = page.locator('[aria-label="Connected geographic and water-column visualization stage"]');
  await expect(stage).toHaveAttribute("data-linked-block", "IO-001", { timeout: 60000 });
  await expect(stage).toHaveAttribute("data-selected-argo-float", "");
});

test("A genuinely failing ancillary health endpoint remains degraded despite the verified float", async ({ page }) => {
  await page.route("**/science-static/health.json", (route) => route.abort("failed"));
  await page.route("**/api/health", (route) => route.abort("failed"));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".system-pill")).toContainText("DEGRADED MODE", { timeout: 60000 });
});
