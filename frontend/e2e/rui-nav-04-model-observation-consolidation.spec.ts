import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openComparison(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-04 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(base + "#/compare", { waitUntil: "domcontentloaded" });
  const comparison = page.locator('.comparison-page[data-page="compare"]');
  await expect(comparison).toBeVisible();
  await expect(page.getByTestId("rui-nav-04-comparison-directory")).toBeVisible();
  return comparison;
}

test("RUI-NAV-04 exposes the frozen eight-home Model vs Observation directory", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const comparison = await openComparison(page);
  const directory = page.getByRole("navigation", { name: "Model vs Observation feature directory" });
  await expect(directory.locator("button[data-comparison-directory]")).toHaveCount(8);
  for (const label of ["Overview", "Observation Sources", "Matchups", "Profile Comparison", "Bias by Depth", "Metrics", "QC", "Evidence"]) {
    await expect(directory.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  for (const home of ["overview", "observation-sources", "matchups", "profile-comparison", "bias-by-depth", "metrics", "qc", "evidence"]) {
    await expect(comparison.locator('[data-comparison-home="' + home + '"]')).toHaveCount(1);
  }
});

test("RUI-NAV-04 preserves selector, matchup, profile, bias, metrics, QC and downloads", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const comparison = await openComparison(page);
  const selector = comparison.getByLabel("Verified Argo profile");
  await expect(selector).toBeEnabled({ timeout: 60000 });
  await expect(selector.locator("option")).toHaveCount(2);

  await expect(comparison.locator("#comparison-matchups .comparison-collocation-map svg")).toBeVisible();
  expect(await comparison.locator("#comparison-matchups .comparison-table-wrap tbody tr").count()).toBeGreaterThan(0);

  const depth = comparison.getByLabel("Matched comparison depth");
  const inspector = comparison.locator("#comparison-profile-comparison .comparison-depth-inspector");
  await expect(inspector).toBeVisible();
  const initialDepth = await inspector.locator(".comparison-card-heading > strong").textContent();
  await depth.focus();
  await depth.press("End");
  await expect(inspector.locator(".comparison-card-heading > strong")).not.toHaveText(initialDepth ?? "");

  await expect(comparison.locator("#comparison-profile-comparison")).toContainText("Observed vs interpolated model temperature");
  await expect(comparison.locator("#comparison-bias-by-depth")).toContainText("Model − Observation by depth");
  await expect(comparison.locator("#comparison-metrics")).toContainText("Matched levels");
  await expect(comparison.locator("#comparison-metrics .comparison-diagnostic-summary")).toContainText("Warm / cool split");
  await expect(comparison.locator("#comparison-qc .comparison-method-pipeline")).toContainText("Provider QC");
  await expect(comparison.locator("#comparison-qc .comparison-method-pipeline")).toContainText("No extrapolation");
  await expect(comparison.getByRole("button", { name: "Download comparison CSV" })).toBeEnabled();
  await expect(comparison.getByRole("button", { name: "Download evidence JSON" })).toBeEnabled();
  await expect(comparison.locator("#comparison-evidence")).toContainText("not independent validation");
});

test("RUI-NAV-04 preserves profile switching and scientific source context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const comparison = await openComparison(page);
  const selector = comparison.getByLabel("Verified Argo profile");
  await expect(selector).toBeEnabled({ timeout: 60000 });
  const initial = await comparison.locator(".comparison-selector-meta strong").textContent();
  await selector.selectOption({ index: 1 });
  await expect(comparison.locator(".comparison-selector-meta strong")).not.toHaveText(initial ?? "");
  await expect(comparison.locator("#comparison-observation-sources")).toContainText("Ifremer Argo GDAC");
  await expect(comparison.locator("#comparison-observation-sources")).toContainText("GLOBAL_MULTIYEAR_PHY_001_030");
});

test("RUI-NAV-04 retains directory and core evidence access on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const comparison = await openComparison(page);
  const directory = page.getByRole("navigation", { name: "Model vs Observation feature directory" });
  await expect(directory).toBeVisible();
  await expect(directory.getByRole("button", { name: "Profile Comparison", exact: true })).toBeVisible();
  await expect(comparison.getByLabel("Verified Argo profile")).toBeVisible();
  await expect(comparison.getByLabel("Matched comparison depth")).toBeVisible();
  await expect(comparison.getByRole("button", { name: "Download evidence JSON" })).toBeVisible();
});
