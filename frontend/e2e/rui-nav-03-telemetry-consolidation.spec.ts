import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

async function openTelemetry(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-03 verification.");
  const base = liveUrl.replace(/#.*$/, "");
  await page.goto(base + "#/telemetry", { waitUntil: "domcontentloaded" });
  const telemetry = page.locator('.telemetry-page[data-page="telemetry"]');
  await expect(telemetry).toBeVisible();
  await expect(page.getByTestId("rui-nav-03-telemetry-directory")).toBeVisible();
  return telemetry;
}

test("RUI-NAV-03 exposes the frozen seven-home Telemetry directory and removes the generic toolbar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const telemetry = await openTelemetry(page);

  const directory = page.getByRole("navigation", { name: "Telemetry feature directory" });
  await expect(directory.locator("button[data-telemetry-directory]")).toHaveCount(7);
  for (const label of ["Overview", "Time Series", "Depth Series", "Sensors", "Variable Comparison", "Statistics", "Export / Evidence"]) {
    await expect(directory.getByRole("button", { name: label, exact: true })).toBeVisible();
  }

  await expect(telemetry.locator(".telemetry-toolbar")).toHaveCount(0);
  for (const home of ["overview", "time-series", "depth-series", "sensors", "variable-comparison", "statistics", "export-evidence"]) {
    await expect(telemetry.locator('[data-telemetry-home="' + home + '"]')).toHaveCount(1);
  }
});

test("RUI-NAV-03 keeps variable, depth, time, statistics and evidence controls scientifically functional", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const telemetry = await openTelemetry(page);

  await expect(telemetry).toHaveAttribute("data-depth-count", "31");
  const depth = telemetry.getByRole("slider", { name: "Telemetry depth", exact: true });
  const initialDepth = await telemetry.getAttribute("data-selected-depth");
  await depth.focus();
  await depth.press("Home");
  await expect(telemetry).not.toHaveAttribute("data-selected-depth", initialDepth ?? "");

  await telemetry.getByRole("button", { name: "Salinity telemetry", exact: true }).click();
  await expect(telemetry).toHaveAttribute("data-variable", "so");
  await expect(telemetry.locator(".telemetry-depth-card")).toContainText("Salinity");

  const time = telemetry.getByRole("slider", { name: "Telemetry time", exact: true });
  await expect(time).toBeDisabled();
  await expect(telemetry.locator("#telemetry-time-series")).toContainText("TIME SERIES LOCKED");

  await expect(telemetry.locator("#telemetry-statistics .telemetry-selected-card")).toBeVisible();
  await expect(telemetry.locator("#telemetry-statistics .telemetry-current-card")).toContainText("HORIZONTAL CURRENT TELEMETRY");
  await expect(telemetry.getByRole("button", { name: "Download depth telemetry CSV", exact: true })).toBeEnabled();
  await expect(telemetry.locator("#telemetry-export-evidence")).toContainText("Full-grid finite-cell summaries");
});

test("RUI-NAV-03 gives Sensors a first-class home using the existing shared observation inventory", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const telemetry = await openTelemetry(page);

  const sensors = telemetry.getByTestId("rui-nav-03-sensors");
  await expect(sensors).toBeVisible();
  await expect.poll(async () => Number(await sensors.getAttribute("data-imported-profile-count")), { timeout: 20000 }).toBeGreaterThan(0);
  await expect(sensors).toContainText("Glider");
  await expect(sensors).toContainText("CTD / XCTD");
  await expect(sensors).toContainText("BGC");
  await expect(sensors).toContainText("no synthetic measurements or timestamps");
});

test("RUI-NAV-03 retains Telemetry directory and contextual controls on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const telemetry = await openTelemetry(page);

  const directory = page.getByRole("navigation", { name: "Telemetry feature directory" });
  await expect(directory).toBeVisible();
  await expect(directory.getByRole("button", { name: "Depth Series", exact: true })).toBeVisible();
  await expect(telemetry.getByRole("slider", { name: "Telemetry depth", exact: true })).toBeVisible();
  await expect(telemetry.getByRole("button", { name: "Temperature telemetry", exact: true })).toBeVisible();
  await expect(telemetry.getByRole("button", { name: "Download depth telemetry CSV", exact: true })).toBeVisible();
});
