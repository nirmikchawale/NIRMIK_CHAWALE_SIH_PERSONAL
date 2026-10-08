import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
const homes = [
  "overview", "scientific-context", "data-provenance", "quality-control",
  "source-integrity", "architecture", "system-health", "capabilities",
  "limitations", "demo-guide"
];

async function openScience(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-07 acceptance.");
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/about", { waitUntil: "domcontentloaded" });
  const science = page.locator('.info-page[data-page="about"]');
  await expect(science).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("rui-nav-07-science-directory")).toBeVisible();
  return science;
}

test("RUI-NAV-07 exposes all ten canonical Science System homes with deep-link routing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const science = await openScience(page);
  const directory = page.getByRole("navigation", { name: "Science System feature directory" });
  await expect(directory.locator("[data-science-directory]")).toHaveCount(10);
  await expect(science.locator("[data-science-home]")).toHaveCount(10);
  for (const id of homes) {
    await expect(science.locator(`[data-science-home="${id}"]`)).toHaveCount(1);
    await expect(science.locator(`#science-${id}`)).toHaveCount(1);
  }
  await directory.getByRole("button", { name: "Quality Control", exact: true }).click();
  await expect(page).toHaveURL(/#\/about\?section=quality-control$/);
  await expect(science.getByTestId("science-quality-control")).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#science-quality-control")).toBeVisible();
  await expect(page).toHaveURL(/#\/about\?section=quality-control$/);
});

test("RUI-NAV-07 keeps reference provenance distinct from active block and exposes QC and integrity", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("oceancanvas-active-main-block-v1"));
  const science = await openScience(page);
  const block = science.getByTestId("science-active-block-provenance");
  await expect(block).toHaveAttribute("data-block-id", "BASE-GLORYS-001", { timeout: 40_000 });
  await expect(block).toHaveAttribute("data-evidence-class", "immutable-verified-baseline");
  await expect(science.locator("#science-data-provenance")).toContainText("VERIFIED REFERENCE MODEL");
  await expect(science.getByTestId("science-integrity-contract")).toBeVisible();
  await expect(science.getByTestId("science-block-integrity")).toBeVisible();
  await expect(science.locator("#science-quality-control")).toContainText("Model − observation");
  await expect(science.locator("#science-system-health")).toHaveAttribute("data-health-state", /degraded|no-reported-warnings/);
});

test("RUI-NAV-07 fail-closes planned-block provenance instead of inheriting baseline evidence", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL required.");
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.removeItem("oceancanvas-active-main-block-v1"));
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const selector = page.getByTestId("integrated-main-block-hud").getByLabel("Active main block");
  await expect(selector).toBeAttached({ timeout: 40_000 });
  await selector.selectOption("IO-087", { force: true });
  await expect(page.locator(".globe-visualization-layer.active .globe-shell")).toHaveAttribute("data-active-main-block", "IO-087", { timeout: 40_000 });
  await page.evaluate(() => { window.location.hash = "#/about"; });
  const science = page.locator('.info-page[data-page="about"]');
  await expect(science).toBeVisible();
  await expect(science.getByTestId("science-active-block-provenance")).toHaveAttribute("data-evidence-availability", "withheld");
  await expect(science.getByTestId("science-active-block-provenance")).toContainText("No materialized scientific model payload");
  await expect(science.getByTestId("science-block-integrity")).toContainText("Not claimed");
  await expect(science.locator("#science-system-health")).toContainText("Verified reference fallback is not selected-block evidence");
  await expect(science.locator("#science-data-provenance")).toContainText("VERIFIED REFERENCE MODEL");
});

test("RUI-NAV-07 directory and evidence panels remain keyboard- and mobile-accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const science = await openScience(page);
  const directory = page.getByRole("navigation", { name: "Science System feature directory" });
  await expect(directory.getByRole("button", { name: "System Health" })).toBeVisible();
  await directory.getByRole("button", { name: "System Health" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/section=system-health$/);
  await expect(science.locator("#science-system-health")).toBeVisible();
  await expect(science.locator("#science-limitations")).toContainText("Source-defined scientific disclaimer");
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewportWidth + 5);
});
