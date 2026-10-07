import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openAnomaly(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-05 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(base + "#/anomaly", { waitUntil: "domcontentloaded" });
  const anomaly = page.locator('.anomaly-page[data-page="anomaly"]');
  await expect(anomaly).toBeVisible();
  await expect(page.getByTestId("rui-nav-05-anomaly-directory")).toBeVisible();
  await expect(anomaly.locator(".anomaly-explainable-workspace")).toBeVisible({ timeout: 60000 });
  return anomaly;
}

test("RUI-NAV-05 exposes the frozen seven-home Anomaly Screening directory", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const anomaly = await openAnomaly(page);
  const directory = page.getByRole("navigation", { name: "Anomaly Screening feature directory" });
  await expect(directory.locator("button[data-anomaly-directory]")).toHaveCount(7);
  for (const label of ["Overview","Spatial Anomalies","Temporal Anomalies","Depth Anomalies","Thresholds","Detected Flags","Explainability"]) {
    await expect(directory.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  for (const home of ["overview","spatial-anomalies","temporal-anomalies","depth-anomalies","thresholds","detected-flags","explainability"]) {
    await expect(anomaly.locator('[data-anomaly-home="' + home + '"]')).toHaveCount(1);
  }
  await expect(anomaly.locator("#anomaly-overview")).toContainText("Detected Flags");
});

test("RUI-NAV-05 preserves spatial, temporal and depth scientific context controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const anomaly = await openAnomaly(page);
  await anomaly.getByRole("button", { name: "Salinity", exact: true }).click();
  await expect(anomaly).toHaveAttribute("data-variable", "so");
  await expect(anomaly.locator("#anomaly-spatial")).toContainText("Salinity spatial statistical extremes");
  const depth = anomaly.getByLabel("Anomaly depth");
  const initialDepth = await anomaly.getAttribute("data-depth-index");
  await depth.focus(); await depth.press("Home");
  await expect(anomaly).not.toHaveAttribute("data-depth-index", initialDepth ?? "");
  const time = anomaly.getByLabel("Anomaly time");
  await expect(time).toBeDisabled();
  await expect(anomaly.locator("#anomaly-temporal")).toContainText("TEMPORAL SCREEN LOCKED");
});

test("RUI-NAV-05 keeps thresholds, Detected Flags and explainability truthful and interactive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const anomaly = await openAnomaly(page);
  await expect(anomaly.locator("#anomaly-thresholds")).toContainText("|robust z| ≥ 3.5");
  await expect(anomaly.locator("#anomaly-detected-flags")).toContainText("Flags are not confirmed events");
  await expect(anomaly.getByRole("button", { name: "Download screening evidence" })).toBeEnabled();
  const inspector = anomaly.locator(".anomaly-explainable-workspace");
  await expect(inspector).toHaveAttribute("data-focus-screen", "spatial");
  await expect(anomaly.locator("#anomaly-explainability")).toContainText("Why is this point flagged?");
  await anomaly.getByRole("button", { name: "Argo residual", exact: true }).click();
  await expect(inspector).toHaveAttribute("data-focus-screen", "residual");
  await expect(anomaly.locator(".anomaly-residual-ranks")).toBeVisible();
  await anomaly.getByRole("button", { name: "Model cell", exact: true }).click();
  await expect(inspector).toHaveAttribute("data-focus-screen", "spatial");
  await expect(anomaly.locator("#anomaly-explainability")).toContainText("Magnitude bands describe statistical departure only");
});

test("RUI-NAV-05 keeps spatial and residual detected evidence discoverable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const anomaly = await openAnomaly(page);
  const spatialState = anomaly.locator(".anomaly-context-card").locator(".anomaly-flag-map svg, .anomaly-empty");
  await expect(spatialState).toBeVisible();
  await expect(anomaly.locator(".anomaly-residual-table tbody tr").first()).toBeVisible();
  await expect(anomaly.locator("#anomaly-depth")).toContainText("Temperature-only because that is the bundled verified Argo comparison evidence");
});

test("RUI-NAV-05 retains directory and contextual controls on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const anomaly = await openAnomaly(page);
  const directory = page.getByRole("navigation", { name: "Anomaly Screening feature directory" });
  await expect(directory).toBeVisible();
  await expect(directory.getByRole("button", { name: "Detected Flags", exact: true })).toBeVisible();
  await expect(anomaly.getByLabel("Anomaly depth")).toBeVisible();
  await expect(anomaly.getByRole("button", { name: "Salinity", exact: true })).toBeVisible();
  await expect(anomaly.getByRole("button", { name: "Download screening evidence" })).toBeVisible();
});
