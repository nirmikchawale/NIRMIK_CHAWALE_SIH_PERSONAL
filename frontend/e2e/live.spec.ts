import { expect, test, type Page } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
const GLASS_THEME_KEY = "oceantwin-glass-theme-v2";

async function switchToLightGlassTheme(page: Page) {
  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await expect(gallery).toBeVisible();
  await gallery.getByRole("button", { name: /Lavender Haze/i }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), GLASS_THEME_KEY)).toBe("lavender-haze");
}

async function revealCanvasTools(page: Page) {
  const shell = page.locator(".ocean-workbench").first();
  await expect(shell).toHaveAttribute("data-control-dock", /^(open|closed)$/);
  if ((await shell.getAttribute("data-control-dock")) === "open") {
    await page.getByRole("button", { name: "Hide explorer controls" }).click();
    await expect(shell).toHaveAttribute("data-control-dock", "closed");
  }
}

test("live Ocean Canvas judge flow renders and core interactions work", async ({ page }) => {
  test.setTimeout(240_000);
  if (!liveUrl) {
    throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  }

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();
  const teamLogoButton = page.getByRole("button", { name: "Open The Optimizers Argo Compass logo" });
  await expect(teamLogoButton).toBeVisible();
  const headerLogo = teamLogoButton.locator("img");
  await expect(headerLogo).toHaveAttribute("src", /^data:image\/png;base64,iVBORw0KGgo/);
  await teamLogoButton.click();
  const logoDialog = page.getByRole("dialog", { name: "The Optimizers Argo Compass logo" });
  await expect(logoDialog).toBeVisible();
  const dialogLogo = logoDialog.getByRole("img", { name: "The Optimizers Argo Compass logo" });
  await expect(dialogLogo).toBeVisible();
  await expect(dialogLogo).toHaveAttribute("src", /^data:image\/png;base64,iVBORw0KGgo/);
  await logoDialog.getByRole("button", { name: "Close team logo" }).click();
  await expect(logoDialog).toBeHidden();
  // The current canvas-first UI deliberately hides duplicate map tools while
  // the Explorer drawer is open. Close the drawer before testing basemap tools.
  await page.getByRole("button", { name: "Hide explorer controls" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-control-dock", "closed");
  const imageryGlobeShell = page.locator(".globe-shell").first();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "auto");
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-failsafe", "online-hd+offline-natural-earth");
  await expect(page.getByRole("button", { name: "High-res auto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Offline", exact: true })).toBeVisible();
  await expect.poll(async () => (await imageryGlobeShell.getAttribute("data-imagery-status")) ?? "")
    .toMatch(/^(online|offline|grid)$/);

  await page.getByRole("button", { name: "Offline", exact: true }).click();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "offline");
  await expect.poll(async () => (await imageryGlobeShell.getAttribute("data-imagery-status")) ?? "")
    .toMatch(/^(offline|grid)$/);

  await page.getByRole("button", { name: "High-res auto" }).click();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "auto");
  await expect.poll(async () => (await imageryGlobeShell.getAttribute("data-imagery-status")) ?? "")
    .toMatch(/^(online|offline|grid)$/);

  await page.getByRole("button", { name: "Show explorer controls" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-control-dock", "open");

  const documentRoot = page.locator("html");
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await switchToLightGlassTheme(page);
  await expect(documentRoot).toHaveAttribute("data-theme", "light");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();
  await expect(documentRoot).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  const telemetryPage = page.locator('.telemetry-page[data-page="telemetry"]');
  await expect(telemetryPage).toBeVisible();
  await expect(telemetryPage).toContainText("Depth & telemetry workspace");
  await expect(telemetryPage).toHaveAttribute("data-depth-count", "31");
  await expect(telemetryPage).toHaveAttribute("data-time-count", "1");
  await expect(telemetryPage).toContainText("31");
  await expect(telemetryPage).toContainText("genuine model depths");
  await expect(telemetryPage).toContainText("1");
  await expect(telemetryPage).toContainText("genuine timestamps");
  await expect(telemetryPage).toContainText("TIME SERIES LOCKED");
  await expect(telemetryPage.locator(".telemetry-current-card")).toContainText("Mean speed");
  const depthLadder = telemetryPage.locator(".telemetry-depth-ladder");
  await expect(depthLadder).toBeVisible();
  await expect(depthLadder).toContainText("Jump to any verified model depth");
  await expect(depthLadder.locator("button")).toHaveCount(31);
  const depthNeighborhood = telemetryPage.locator(".telemetry-neighborhood-card");
  await expect(depthNeighborhood).toBeVisible();
  await expect(depthNeighborhood).toContainText("Local mean gradient");
  await expect(depthNeighborhood).toContainText("Selected P10–P90 span");
  await expect(depthNeighborhood).toContainText("descriptive vertical-change diagnostic");

  const telemetryInitialDepth = await telemetryPage.getAttribute("data-selected-depth");
  const telemetryDepth = telemetryPage.getByRole("slider", { name: "Telemetry depth", exact: true });
  await telemetryDepth.focus();
  await telemetryDepth.press("Home");
  await expect(telemetryPage).not.toHaveAttribute("data-selected-depth", telemetryInitialDepth ?? "");

  const firstDepthFromSlider = await telemetryPage.getAttribute("data-selected-depth");
  await depthLadder.getByRole("button", { name: /Select telemetry depth/ }).nth(10).click();
  await expect(telemetryPage).not.toHaveAttribute("data-selected-depth", firstDepthFromSlider ?? "");
  await expect(depthNeighborhood.locator("tbody tr.selected")).toHaveCount(1);

  await telemetryPage.getByRole("button", { name: "Salinity telemetry" }).click();
  await expect(telemetryPage).toHaveAttribute("data-variable", "so");
  await expect(telemetryPage.locator(".telemetry-depth-card")).toContainText("Salinity");

  await page.getByRole("button", { name: "Anomaly Screening" }).click();
  await expect(page).toHaveURL(/#\/anomaly$/);
  const anomalyPage = page.locator('.anomaly-page[data-page="anomaly"]');
  await expect(anomalyPage).toBeVisible();
  await expect(anomalyPage).toContainText("Anomaly screening");
  await expect(anomalyPage).toContainText("|robust z| ≥ 3.5");
  await expect(anomalyPage).toContainText("TEMPORAL SCREEN LOCKED");
  await expect(anomalyPage).toContainText("not proof of an ocean event");
  await expect(anomalyPage.locator(".anomaly-residual-table tbody tr").first()).toBeVisible();
  const anomalyInspector = anomalyPage.locator(".anomaly-explainable-workspace");
  await expect(anomalyInspector).toBeVisible();
  await expect(anomalyInspector).toHaveAttribute("data-focus-screen", "spatial");
  await expect(anomalyInspector).toContainText("Why is this point flagged?");
  await expect(anomalyInspector).toContainText("Magnitude bands describe statistical departure only");
  await expect(anomalyPage.getByRole("button", { name: "Download screening evidence" })).toBeEnabled();
  const anomalySpatialContext = anomalyPage.locator(".anomaly-context-card").first();
  await expect(anomalySpatialContext).toBeVisible();
  await expect(anomalySpatialContext).toContainText(/Flagged-cell constellation|No flagged model cells/);
  await anomalyPage.getByRole("button", { name: "Argo residual" }).click();
  await expect(anomalyInspector).toHaveAttribute("data-focus-screen", "residual");
  await expect(anomalyInspector).toContainText("Residual flags by depth");
  await expect(anomalyPage.locator(".anomaly-residual-ranks")).toBeVisible();
  await anomalyPage.getByRole("button", { name: "Model cell" }).click();
  await expect(anomalyInspector).toHaveAttribute("data-focus-screen", "spatial");

  const anomalyInitialDepth = await anomalyPage.getAttribute("data-depth-index");
  const anomalyDepth = anomalyPage.getByLabel("Anomaly depth");
  await anomalyDepth.focus();
  await anomalyDepth.press("Home");
  await expect(anomalyPage).not.toHaveAttribute("data-depth-index", anomalyInitialDepth ?? "");

  await anomalyPage.getByRole("button", { name: "Salinity" }).click();
  await expect(anomalyPage).toHaveAttribute("data-variable", "so");
  await expect(anomalyPage).toContainText("Salinity spatial statistical extremes");

  await page.getByRole("button", { name: "Data Lab", exact: true }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);
  const dataLabPage = page.locator('.data-lab-page[data-page="data-lab"]');
  await expect(dataLabPage).toBeVisible();
  await expect(dataLabPage).toContainText("Additional dataset lab");
  await expect(dataLabPage).toContainText("Data stays in this browser session");
  await expect(dataLabPage).toContainText("Official data launchpad");
  await expect(dataLabPage.locator(".data-source-card")).toHaveCount(3);
  await expect(dataLabPage).toContainText("GLORYS12V1 global ocean physics reanalysis");
  await expect(dataLabPage).toContainText("Argo global profiling-float observations");
  await expect(dataLabPage).toContainText("Indian Ocean official data access portal");
  await expect(dataLabPage).toContainText("Reshape to Ocean Canvas schema");
  const officialLinks = dataLabPage.locator(".data-source-actions a");
  await expect(officialLinks).toHaveCount(3);
  await expect(officialLinks.nth(0)).toHaveAttribute("href", /data\.marine\.copernicus\.eu/);
  await expect(officialLinks.nth(1)).toHaveAttribute("href", /data-argo\.ifremer\.fr/);
  await expect(officialLinks.nth(2)).toHaveAttribute("href", /las\.incois\.gov\.in/);
  await expect(officialLinks.nth(0)).toHaveAttribute("target", "_blank");

  const validCsv = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source,platform_id,sensor_type",
    "68.10,13.10,10,2020-07-01T00:00:00Z,temperature,28.2,degree_Celsius,judge_sample,glider_demo_01,glider",
    "68.10,13.10,50,2020-07-01T00:00:00Z,temperature,25.4,degree_Celsius,judge_sample,glider_demo_01,glider",
    "68.10,13.10,10,2020-07-01T00:00:00Z,salinity,35.1,1e-3,judge_sample,glider_demo_01,glider",
    "68.10,13.10,50,2020-07-01T00:00:00Z,salinity,35.0,1e-3,judge_sample,glider_demo_01,glider"
  ].join("\n");

  await dataLabPage.getByLabel("Ocean dataset file").setInputFiles({
    name: "judge_valid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(validCsv)
  });
  await expect(dataLabPage.locator(".data-lab-status.valid")).toContainText("VALIDATED");
  await expect(dataLabPage).toHaveAttribute("data-row-count", "4");
  await expect(dataLabPage).toContainText("Only one genuine timestamp is present");
  await expect(dataLabPage.locator(".data-lab-variable-grid article")).toHaveCount(2);
  await expect(dataLabPage.getByRole("button", { name: "Download validation report" })).toBeEnabled();
  await expect(dataLabPage.getByRole("button", { name: "Load validated profiles into 3D Explorer" })).toBeEnabled();
  await dataLabPage.getByRole("button", { name: "Load validated profiles into 3D Explorer" }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  const importedGlobeShell = page.locator(".globe-shell:not(.water-column-shell)");
  await expect.poll(async () => Number(await importedGlobeShell.getAttribute("data-imported-profile-count"))).toBeGreaterThanOrEqual(4);
  // The integrated 140-block judge summary now reports block-field provenance.
  // Imported-session evidence is verified on its dedicated selector instead of
  // requiring obsolete summary copy.
  await revealCanvasTools(page);
  const importedSelector = page.locator(".imported-observation-chips");
  await expect(importedSelector).toBeVisible();
  await importedSelector.getByRole("button", { name: /^Sensor profiles/ }).click();
  await expect(importedSelector).toBeVisible();
  await expect(importedSelector).toContainText("GLIDER");
  await expect(importedSelector).toContainText("CTD");
  await expect(importedSelector).toContainText("BGC");
  await importedSelector.getByRole("button", { name: /GLIDER.*glider_demo_01/i }).click();
  await expect(page.locator(".imported-profile-panel")).toBeVisible();
  await expect(page.locator(".imported-profile-panel")).toContainText("Glider");
  await expect(page.locator(".imported-profile-panel")).toContainText("temperature vs depth");
  await page.getByRole("button", { name: "Data Lab", exact: true }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);

  const netcdfFixtureUrl = new URL("samples/cf-profile-fixture.nc", page.url()).toString();
  const netcdfResponse = await page.request.get(netcdfFixtureUrl);
  expect(netcdfResponse.ok()).toBeTruthy();
  const netcdfBuffer = await netcdfResponse.body();
  await dataLabPage.getByLabel("Ocean dataset file").setInputFiles({
    name: "cf-profile-fixture.nc",
    mimeType: "application/x-netcdf",
    buffer: netcdfBuffer
  });
  await expect(dataLabPage.locator(".netcdf-inspection-card")).toBeVisible();
  await expect(dataLabPage.locator(".netcdf-inspection-card")).toContainText("CF-1.10");
  await expect(dataLabPage.locator(".netcdf-inspection-card")).toContainText("8 canonical rows");
  await expect(dataLabPage.locator(".data-lab-status.valid")).toContainText("VALIDATED");
  await expect(dataLabPage).toHaveAttribute("data-row-count", "8");
  await expect(dataLabPage.getByRole("button", { name: "Load validated profiles into 3D Explorer" })).toBeEnabled();
  await dataLabPage.getByRole("button", { name: "Load validated profiles into 3D Explorer" }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await revealCanvasTools(page);
  await expect(page.locator(".imported-observation-chips")).toContainText("test-ctd-profile-001");
  await page.locator(".imported-observation-chips").getByRole("button", { name: /^Sensor profiles/ }).click();
  await page.locator(".imported-observation-chips").getByRole("button", { name: /CTD.*test-ctd-profile-001/i }).click();
  await expect(page.locator(".imported-profile-panel")).toContainText("CTD");
  await expect(page.locator(".imported-profile-panel")).toContainText("sea_water_temperature vs depth");
  await page.getByRole("button", { name: "Data Lab", exact: true }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);

  const invalidCsv = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source",
    "68.10,95,10,2020-07-01T00:00:00Z,temperature,28.2,,judge_sample"
  ].join("\n");
  await dataLabPage.getByLabel("Ocean dataset file").setInputFiles({
    name: "judge_invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(invalidCsv)
  });
  await expect(dataLabPage.locator(".data-lab-status.invalid")).toContainText("REJECTED");
  await expect(dataLabPage).toContainText("Latitude must be between -90 and 90 degrees.");
  await expect(dataLabPage).toContainText("Units are required.");

  await page.getByRole("button", { name: "Model vs Observation" }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  const comparisonPage = page.locator('.comparison-page[data-page="compare"]');
  await expect(comparisonPage).toBeVisible();
  await expect(comparisonPage).toContainText("Argo–GLORYS12V1 profile comparison");
  await expect(comparisonPage).toContainText("Matched levels");
  await expect(comparisonPage).toContainText("Observed vs interpolated model temperature");
  await expect(comparisonPage).toContainText("Model − Observation by depth");
  await expect(comparisonPage).toContainText("Depth-by-depth evidence table");
  await expect(comparisonPage).toContainText("not independent validation");
  const comparisonInspector = comparisonPage.locator(".comparison-depth-inspector");
  await expect(comparisonInspector).toBeVisible();
  await expect(comparisonInspector).toContainText("Depth-resolved inspector");
  await expect(comparisonPage.locator(".comparison-diagnostic-summary")).toContainText("Warm / cool split");
  await expect(comparisonPage.locator(".comparison-collocation-map svg")).toBeVisible();
  await expect(comparisonPage.locator(".comparison-method-pipeline")).toContainText("Provider QC");
  await expect(comparisonPage.locator(".comparison-method-pipeline")).toContainText("No extrapolation");

  const comparisonDepth = comparisonPage.getByLabel("Matched comparison depth");
  const initialInspectedDepth = await comparisonInspector.locator(".comparison-card-heading > strong").textContent();
  await comparisonDepth.focus();
  await comparisonDepth.press("End");
  await expect(comparisonInspector.locator(".comparison-card-heading > strong")).not.toHaveText(initialInspectedDepth ?? "");
  await expect(comparisonInspector).toContainText("Argo observed");
  await expect(comparisonInspector).toContainText("Model interpolated");
  await expect(comparisonInspector).toContainText("Bias M−O");

  const comparisonSelect = comparisonPage.locator("select");
  const initialComparisonProfile = await comparisonPage.locator(".comparison-selector-meta strong").textContent();
  await comparisonSelect.selectOption({ index: 1 });
  await expect(comparisonPage.locator(".comparison-selector-meta strong")).not.toHaveText(initialComparisonProfile ?? "");
  expect(await comparisonPage.locator(".comparison-table-wrap tbody tr").count()).toBeGreaterThan(0);
  await expect(comparisonPage.getByRole("button", { name: "Download comparison CSV" })).toBeEnabled();
  await expect(comparisonPage.getByRole("button", { name: "Download evidence JSON" })).toBeEnabled();

  await page.getByRole("button", { name: "Science & System", exact: true }).first().click();
  await expect(page).toHaveURL(/#\/about$/);
  const infoPage = page.locator('.info-page[data-page="about"]');
  await expect(infoPage).toBeVisible();
  await expect(infoPage).toHaveAttribute("data-info-status", "implemented");
  await expect(infoPage).toContainText("SIH26067");
  await expect(infoPage).toContainText("What the final MVP actually does");
  await expect(infoPage).toContainText("Water-Column 3D");
  await expect(infoPage).toContainText("No synthetic timestamps");
  await expect(infoPage).toContainText("RECOMMENDED DEMO FLOW");

  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas explorer and evidence flow works", async ({ page }) => {
  // This test deliberately exercises the longest judge path against the
  // deployed GitHub Pages site. Keep all assertions, but allow live-network
  // rendering and camera transitions more time than the default 90 seconds.
  test.setTimeout(360_000);
  if (!liveUrl) {
    throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  }

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const documentRoot = page.locator("html");
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await switchToLightGlassTheme(page);
  await expect(documentRoot).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-page", "explore");
  await expect(page.locator(".cesium-host canvas")).toBeVisible();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);
  const globeShell = page.locator(".globe-shell:not(.water-column-shell)");
  await expect(globeShell).toHaveAttribute("data-render-quality", "high");
  await expect.poll(async () => Number(await globeShell.getAttribute("data-render-scale"))).toBeGreaterThanOrEqual(1.5);
  await expect(globeShell).toHaveAttribute("data-antialiasing", /MSAA|FXAA/);
  await expect(page.locator(".render-quality-line")).toContainText("HD canvas");
  await expect(page.locator(".judge-summary")).toContainText("INDIAN OCEAN");
  await expect(page.locator(".judge-summary")).toContainText("Argo comparison profiles");
  await expect(page.locator(".profile-panel")).toHaveAttribute("data-context-open", "false");

  const modeDock = page.locator('.visualization-dock[data-visualization-mode="globe"]');
  await expect(modeDock).toBeVisible();
  await expect(modeDock).toContainText("DUAL 3D VISUALIZATION");
  await expect(modeDock.getByRole("button", { name: /Geographic View/ })).toBeVisible();
  await expect(modeDock.getByRole("button", { name: /Water Column 3D/ })).toBeVisible();

  await expect(globeShell).toHaveAttribute("data-journey-phase", "region");
  // Camera HUD and smooth zoom are progressively disclosed when the Explorer
  // control drawer is closed.
  await page.getByRole("button", { name: "Hide explorer controls" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-control-dock", "closed");
  await expect.poll(async () => Number(await globeShell.getAttribute("data-camera-height"))).toBeGreaterThan(0);
  const initialGlobeHeight = Number(await globeShell.getAttribute("data-camera-height"));
  await page.getByRole("button", { name: "Zoom in Ocean Globe" }).click();
  await expect.poll(async () => Number(await globeShell.getAttribute("data-camera-height"))).toBeLessThan(initialGlobeHeight);

  const globeCameraHud = globeShell.locator(".camera-orientation-hud");
  await expect(globeCameraHud).toBeVisible();
  await expect(globeCameraHud.getByRole("button", { name: "Nadir plan view" })).toBeVisible();
  await globeCameraHud.getByRole("button", { name: "Nadir plan view" }).click();
  await expect(globeShell).toHaveAttribute("data-camera-preset", "nadir");
  await globeCameraHud.getByRole("button", { name: "Perspective 45 degree view" }).click();
  await expect(globeShell).toHaveAttribute("data-camera-preset", "perspective");
  await globeCameraHud.getByRole("button", { name: "Equatorial cross-section view" }).click();
  await expect(globeShell).toHaveAttribute("data-camera-preset", "cross-section");
  await globeCameraHud.getByRole("button", { name: "Basin framing view" }).click();
  await expect(globeShell).toHaveAttribute("data-camera-preset", "basin");
  await globeCameraHud.getByRole("button", { name: "Face Ocean Globe camera due north" }).click();
  await expect(globeShell).toHaveAttribute("data-camera-preset", "north");

  await page.getByRole("button", { name: "Show explorer controls" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-control-dock", "open");

  await expect(page.locator(".play-button")).toHaveCount(0);
  await expect(page.locator(".static-time-row")).toContainText("2024-01-02");
  await expect(page.locator(".static-time-row")).toContainText("One genuine model timestamp");
  await expect(page.locator(".static-time-row")).toContainText("never duplicated to simulate time");

  const sourceSelector = page.getByLabel("Explore scientific source");
  const incoisSource = sourceSelector.getByRole("button", { name: "INCOIS multi-time" });
  await expect(incoisSource).toBeEnabled();
  await incoisSource.click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-explore-source", "incois");
  await expect(page.locator(".visualization-dock")).toContainText("INCOIS operational analysis snapshot");
  const genuineTimeSlider = page.getByLabel("Explore genuine timestamp");
  const genuinePlay = page.getByRole("button", { name: "Play genuine Explore time playback" });
  await expect(genuineTimeSlider).toBeVisible();
  await expect(genuinePlay).toBeVisible();
  const initialOperationalTime = await genuineTimeSlider.inputValue();
  await genuinePlay.click();
  await expect.poll(async () => await genuineTimeSlider.inputValue(), { timeout: 7000 }).not.toBe(initialOperationalTime);
  await page.getByRole("button", { name: "Pause genuine Explore time playback" }).click();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  const chlorophyllSource = sourceSelector.getByRole("button", { name: "INCOIS chlorophyll" });
  await expect(chlorophyllSource).toBeEnabled();
  await chlorophyllSource.click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-explore-source", "chlorophyll");
  await expect(page.locator(".visualization-dock")).toContainText("INCOIS satellite ocean-colour chlorophyll");
  await expect(page.getByRole("button", { name: /Chlorophyll-a/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".legend-card")).toContainText("Chlorophyll-a");
  await expect(page.locator(".legend-card")).toContainText(/mg\/m(\^3|³)/);
  await expect(page.locator(".surface-only-control")).toContainText("Surface field only");
  await expect(page.locator(".evidence-readout")).toContainText("SURFACE");
  const chlorophyllWaterColumn = page.getByRole("button", { name: "Water Column 3D", exact: true });
  await expect(chlorophyllWaterColumn).toBeDisabled();
  const chlorophyllTime = page.getByLabel("Explore genuine timestamp");
  await expect(chlorophyllTime).toBeVisible();
  const chlorophyllInitialTime = await chlorophyllTime.inputValue();
  await chlorophyllTime.focus();
  await chlorophyllTime.press("End");
  await expect.poll(async () => await chlorophyllTime.inputValue()).not.toBe(chlorophyllInitialTime);
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await sourceSelector.getByRole("button", { name: "GLORYS baseline" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-explore-source", "glorys");
  await expect(page.locator(".play-button")).toHaveCount(0);
  await expect(page.locator(".static-time-row")).toContainText("2024-01-02");

  await page.getByRole("button", { name: /Salinity/i }).click();
  await expect(page.locator(".legend-card")).toContainText("Salinity");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: /Currents/i }).click();
  await expect(page.locator(".current-note")).toContainText("HORIZONTAL u/v FLOW");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);
  const currentWaterColumnButton = page.getByRole("button", { name: "Water Column 3D", exact: true });
  await expect(currentWaterColumnButton).toBeEnabled();
  await currentWaterColumnButton.click();
  const currentWaterColumnShell = page.locator(".water-column-shell");
  await expect(currentWaterColumnShell).toHaveAttribute("data-current-depth-count", "31");
  await expect.poll(async () => Number(await currentWaterColumnShell.getAttribute("data-current-vector-count"))).toBeGreaterThan(0);
  await expect(page.locator(".water-column-note")).toContainText("NO VERTICAL w INFERRED");
  await page.getByRole("button", { name: /Geographic View/ }).click();

  await page.getByRole("button", { name: /Temperature/i }).click();
  const waterColumnButton = page.getByRole("button", { name: "Water Column 3D", exact: true });
  await expect(waterColumnButton).toBeEnabled();
  await waterColumnButton.click();

  const waterColumnShell = page.locator(".water-column-shell");
  await expect(waterColumnShell).toBeVisible();
  await expect(page.locator(".water-column-canvas")).toBeVisible();
  await expect(waterColumnShell).toHaveAttribute("data-depth-count", "31");
  await expect(page.locator(".water-column-selected")).toContainText("Depth (m, positive down)");
  await expect(page.locator(".water-column-selected")).toContainText("SELECTED LAYER");
  await expect(page.locator(".water-column-axis-key")).toContainText("Depth m ↓");
  await expect(page.locator(".water-column-smooth-zoom")).toBeVisible();

  const waterExplorerShell = page.locator(".app-shell");
  if ((await waterExplorerShell.getAttribute("data-control-dock")) === "open") {
    await page.getByRole("button", { name: "Hide explorer controls" }).click();
    await expect(waterExplorerShell).toHaveAttribute("data-control-dock", "closed");
  }
  const waterCameraHud = waterColumnShell.locator(".camera-orientation-hud");
  await expect(waterCameraHud).toBeVisible();
  await waterCameraHud.getByRole("button", { name: "Equatorial cross-section view" }).click();
  await expect(waterColumnShell).toHaveAttribute("data-camera-preset", "cross-section");
  await waterCameraHud.getByRole("button", { name: "Perspective 45 degree view" }).click();
  await expect(waterColumnShell).toHaveAttribute("data-camera-preset", "perspective");
  await waterCameraHud.getByRole("button", { name: "Face Water-Column 3D camera due north" }).click();
  await expect(waterColumnShell).toHaveAttribute("data-camera-preset", "north");

  const initialWaterZoom = Number(await waterColumnShell.getAttribute("data-zoom"));
  await page.getByRole("button", { name: "Zoom in Water-Column 3D" }).click();
  await expect.poll(async () => Number(await waterColumnShell.getAttribute("data-zoom"))).toBeGreaterThan(initialWaterZoom);

  const waterWorkbench = page.locator(".ocean-workbench").first();
  if ((await waterWorkbench.getAttribute("data-control-dock")) === "closed") {
    await page.getByRole("button", { name: "Show explorer controls" }).click();
    await expect(waterWorkbench).toHaveAttribute("data-control-dock", "open");
  }
  const viewSettings = page.locator(".advanced-control-group");
  const viewSettingsSummary = viewSettings.locator("summary");
  await viewSettingsSummary.scrollIntoViewIfNeeded();
  await expect(viewSettingsSummary).toBeVisible();
  if (!(await viewSettings.getAttribute("open"))) {
    await viewSettingsSummary.click();
  }
  const opacitySlider = page.getByLabel("Point opacity");
  await expect(opacitySlider).toBeVisible();
  await opacitySlider.focus();
  await opacitySlider.press("End");
  await expect(waterColumnShell).toHaveAttribute("data-opacity", "0.95");

  const waterColumnCanvas = page.locator(".water-column-canvas");
  const initialYaw = await waterColumnShell.getAttribute("data-yaw");
  await waterColumnCanvas.focus();
  await waterColumnCanvas.press("ArrowLeft");
  await expect(waterColumnShell).not.toHaveAttribute("data-yaw", initialYaw ?? "");

  const selectedLayer = page.locator(".water-column-selected");
  const initialSelectedLayer = await selectedLayer.textContent();
  const waterColumnDepthSlider = page.getByLabel("Model depth");
  await expect(waterColumnDepthSlider).toBeVisible();
  await waterColumnDepthSlider.focus();
  await waterColumnDepthSlider.press("Home");
  await expect(selectedLayer).not.toHaveText(initialSelectedLayer ?? "");

  await page.getByRole("button", { name: /Geographic View/ }).click();
  await expect(page.locator(".cesium-host canvas")).toBeVisible();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: "3D field" }).click();
  await expect(page.locator(".volume-note")).toContainText("3D WATER COLUMN");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: "Depth slice" }).click();
  const depthIndicator = page.locator(".depth-indicator");
  const initialDepth = await depthIndicator.textContent();
  const depthSlider = page.getByLabel("Model depth");
  await expect(depthSlider).toBeVisible();

  const bathymetricController = page.locator(".bathymetric-depth-controller");
  await expect(bathymetricController).toBeVisible();
  await expect(bathymetricController).toHaveAttribute("data-track-allocation", "40-35-25");
  await expect(page.locator(".depth-zone-track button")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Epipelagic zone 0 to 200 metres" })).toBeEnabled();
  await page.getByRole("button", { name: "Epipelagic zone 0 to 200 metres" }).click();
  await expect(bathymetricController).toHaveAttribute("data-depth-zone", "epipelagic");

  await depthSlider.focus();
  await depthSlider.press("End");
  await expect(depthIndicator).not.toHaveText(initialDepth ?? "");

  const profileSelect = page.getByLabel("Argo profile");
  await expect(profileSelect).toBeVisible();
  await profileSelect.selectOption({ index: 1 });
  await expect(page.locator(".profile-panel")).toBeVisible();
  await expect(page.locator(".evidence-rail")).toHaveAttribute("data-open", "false");
  await expect(page.locator(".profile-panel")).toContainText("Argo");
  await expect(page.locator(".profile-panel")).toContainText("Matched levels");
  await expect(page.locator(".profile-panel")).toContainText("Bias by depth");
  await expect(page.locator(".profile-panel").getByText("Diagnostic model–observation consistency, not independent validation.")).toBeVisible();
  await expect(page.locator(".qc-pill")).toHaveText("QC ACCEPTED");

  await page.getByRole("button", { name: "Sources & QC" }).click();
  await expect(page.locator(".provenance-drawer")).toBeVisible();
  await expect(page.locator(".provenance-drawer")).toContainText("Copernicus");
  await expect(page.locator(".provenance-drawer")).toContainText("Ifremer Argo GDAC");
  await page.locator(".drawer-heading button").click();
  await expect(page.locator(".provenance-drawer")).toHaveCount(0);

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/^OceanCanvas_Argo_.*_comparison\.csv$/);

  await page.getByRole("button", { name: "Focus 3D" }).click();
  await expect(page.locator(".app-shell")).toHaveClass(/focus-mode/);
  await expect(page.getByRole("button", { name: "Show panels" })).toBeVisible();
  await page.getByRole("button", { name: "Show panels" }).click();
  await expect(page.locator(".app-shell")).not.toHaveClass(/focus-mode/);

  const darkAppearanceTrigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  await darkAppearanceTrigger.click();
  const darkAppearanceGallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await expect(darkAppearanceGallery).toBeVisible();
  await darkAppearanceGallery.getByRole("button", { name: /Graphite Clear/i }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), GLASS_THEME_KEY)).toBe("graphite-clear");

  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas canvas-first HUD controls work", async ({ page }) => {
  if (!liveUrl) {
    throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  }

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const appShell = page.locator(".app-shell");
  await expect(page.locator(".feature-rail-right")).toHaveCount(0);
  await expect(appShell).toHaveAttribute("data-control-dock", "open");
  await expect(appShell).toHaveAttribute("data-evidence-inspector", "closed");
  await expect(page.getByRole("button", { name: "Open evidence inspector" })).toBeVisible();

  await page.getByRole("button", { name: "Hide explorer controls" }).click();
  await expect(appShell).toHaveAttribute("data-control-dock", "closed");
  await page.getByRole("button", { name: "Show explorer controls" }).click();
  await expect(appShell).toHaveAttribute("data-control-dock", "open");

  await page.keyboard.press("Control+b");
  await expect(appShell).toHaveAttribute("data-control-dock", "closed");
  await page.keyboard.press("Control+b");
  await expect(appShell).toHaveAttribute("data-control-dock", "open");

  await page.getByRole("button", { name: "Open evidence inspector" }).click();
  await expect(appShell).toHaveAttribute("data-evidence-inspector", "open");
  await expect(page.locator(".profile-panel")).toHaveAttribute("data-context-open", "false");
  await expect(page.locator(".evidence-rail")).toBeVisible();
  await page.getByRole("button", { name: "Close evidence inspector" }).click();
  await expect(appShell).toHaveAttribute("data-evidence-inspector", "closed");

  const imageryGlobeShell = page.locator(".globe-shell").first();
  // Progressive disclosure: basemap/camera tools are intentionally hidden
  // while the Explorer drawer is open.
  await page.getByRole("button", { name: "Hide explorer controls" }).click();
  await expect(appShell).toHaveAttribute("data-control-dock", "closed");
  await page.getByRole("button", { name: "Offline", exact: true }).click();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "offline");
  await page.getByRole("button", { name: "High-res auto" }).click();

  await page.getByRole("button", { name: "Water Column 3D", exact: true }).click();
  const waterColumnShell = page.locator(".water-column-shell");
  await expect(waterColumnShell).toBeVisible();
  const initialZoom = Number(await waterColumnShell.getAttribute("data-zoom"));
  await page.getByRole("button", { name: "Zoom in Water-Column 3D" }).click();
  await expect.poll(async () => Number(await waterColumnShell.getAttribute("data-zoom"))).toBeGreaterThan(initialZoom);

  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas workspace modes switch cleanly", async ({ page }) => {
  if (!liveUrl) {
    throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  }

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const appShell = page.locator(".app-shell");
  await expect(appShell).toHaveAttribute("data-workspace-mode", "explorer");
  await expect(page.getByRole("button", { name: "Explorer workspace" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Analysis Split workspace" }).click();
  await expect(appShell).toHaveAttribute("data-workspace-mode", "analysis");
  await expect(appShell).toHaveAttribute("data-control-dock", "closed");
  await expect(page.locator(".analysis-split-panel")).toBeVisible();
  await expect(page.locator(".analysis-split-panel")).toContainText("Analysis Split");
  await expect(page.locator(".cesium-host canvas")).toBeVisible();

  await page.getByRole("button", { name: "Explorer workspace" }).click();
  await expect(appShell).toHaveAttribute("data-workspace-mode", "explorer");
  await expect(appShell).toHaveAttribute("data-control-dock", "open");

  await page.getByRole("button", { name: "Presentation workspace" }).click();
  await expect(appShell).toHaveAttribute("data-workspace-mode", "presentation");
  await expect(page.locator(".app-header")).toBeHidden();
  await expect(page.locator(".globe-shell").first()).toHaveAttribute("data-presentation-active", "true");
  await expect(page.getByRole("button", { name: "Exit presentation workspace" })).toBeVisible();

  await page.getByRole("button", { name: "Exit presentation workspace" }).click();
  await expect(appShell).toHaveAttribute("data-workspace-mode", "explorer");
  await expect(page.locator(".app-header")).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas variable pills and interactive colorbar work", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const variableButtons = page.locator(".variable-switcher-rich button");
  await expect(variableButtons).toHaveCount(3);
  await expect(variableButtons.first()).toContainText(/Temperature/i);
  await expect(variableButtons.first()).toContainText(/°C/);

  const colorbar = page.getByRole("region", { name: "Interactive scientific colorbar" });
  await expect(colorbar).toBeVisible();
  await expect(colorbar.locator(".colorbar-histogram rect")).toHaveCount(24);

  const globe = page.locator(".globe-shell").first();
  const minSlider = page.getByRole("slider", { name: "Color minimum threshold" });
  const maxSlider = page.getByRole("slider", { name: "Color maximum threshold" });
  await expect(minSlider).toBeVisible();
  await expect(maxSlider).toBeVisible();

  const initialMinimum = await minSlider.inputValue();
  await minSlider.focus();
  await minSlider.press("ArrowRight");
  await expect(minSlider).not.toHaveValue(initialMinimum);

  await page.getByRole("combobox", { name: "Color palette" }).selectOption("viridis");
  await expect(globe).toHaveAttribute("data-color-palette", "viridis");

  const scaleButton = page.getByRole("button", { name: "Toggle linear logarithmic color scale" });
  if (await scaleButton.isEnabled()) {
    await scaleButton.click();
    await expect(globe).toHaveAttribute("data-color-scale", "log");
  }

  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas dedicated genuine timeline scrubber works", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const sourceSelector = page.getByLabel("Explore scientific source");
  await sourceSelector.getByRole("button", { name: "INCOIS multi-time" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-explore-source", "incois");

  const scrubber = page.getByLabel("Genuine ocean timeline scrubber");
  await expect(scrubber).toBeVisible();
  await expect(scrubber).toHaveAttribute("data-playback-speed", "1");
  await expect(page.getByRole("group", { name: "Timeline playback controls" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Timeline playback speed" })).toBeVisible();
  await expect(page.getByLabel("Verified Argo surfacing date markers")).toBeVisible();

  const slider = page.getByLabel("Explore genuine timestamp");
  const initial = Number(await slider.inputValue());
  await page.getByRole("button", { name: "Next genuine time step" }).click();
  await expect.poll(async () => Number(await slider.inputValue())).not.toBe(initial);
  await page.getByRole("button", { name: "Previous genuine time step" }).click();
  await expect(slider).toHaveValue(String(initial));

  await page.getByRole("button", { name: "Playback speed 2 times" }).click();
  await expect(scrubber).toHaveAttribute("data-playback-speed", "2");
  await expect(page.getByRole("button", { name: "Playback speed 2 times" })).toHaveAttribute("aria-pressed", "true");

  const play = page.getByRole("button", { name: "Play genuine Explore time playback" });
  await play.click();
  await expect(page.getByRole("button", { name: "Pause genuine Explore time playback" })).toBeVisible();
  await page.getByRole("button", { name: "Pause genuine Explore time playback" }).click();

  await expect(scrubber.locator(".timeline-footer")).toContainText(/verified Argo surfacing/i);
  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas anchored Argo billboard exposes verified evidence", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const journey = page.locator(".globe-shell[data-journey-phase]");
  if ((await journey.getAttribute("data-journey-phase")) !== "region") {
    const skip = page.getByRole("button", { name: "Skip journey", exact: true });
    if (await skip.isVisible()) await skip.click();
    await expect(journey).toHaveAttribute("data-journey-phase", "region", { timeout: 15_000 });
  }

  const profileSelect = page.getByLabel("Argo profile");
  await expect(profileSelect).toBeVisible();
  await profileSelect.selectOption({ index: 1 });

  const callout = page.getByLabel(/Anchored Argo profile callout for/);
  await expect(callout).toBeVisible();
  await expect(callout).toContainText("Matched levels");
  await expect(callout).toContainText("MAE");
  await expect(callout).toContainText("RMSE");
  await expect(callout).toContainText("Diagnostic model–observation evidence");
  await expect(callout.getByRole("button", { name: "Inspect Profile ↗" })).toBeVisible();

  await callout.getByRole("button", { name: "Inspect Profile ↗" }).click();
  await expect(page.locator(".profile-panel")).toBeVisible();

  await callout.getByRole("button", { name: "Close anchored Argo callout" }).click();
  await expect(page.getByLabel(/Anchored Argo profile callout for/)).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("live Ocean Canvas synchronized T-Z profile drives the genuine 3D depth plane", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const profileSelect = page.getByLabel("Argo profile");
  await expect(profileSelect).toBeVisible();
  await profileSelect.selectOption({ index: 1 });
  await expect(page.locator(".profile-panel")).toBeVisible();

  await page.getByRole("button", { name: "Analysis Split workspace" }).click();
  const appShell = page.locator(".app-shell");
  await expect(appShell).toHaveAttribute("data-workspace-mode", "analysis");

  const split = page.getByRole("complementary", { name: "Analysis Split workspace", exact: true });
  const chart = page.getByRole("application", {
    name: "Interactive synchronized model and Argo temperature profile"
  });
  await expect(chart).toBeVisible();
  await expect.poll(async () => page.locator(".analysis-observation-diamond").count()).toBeGreaterThan(10);
  await expect(page.locator(".analysis-model-line")).toHaveCount(1);

  const initialDepth = await split.getAttribute("data-synced-model-depth");
  // Analysis is scrollable; a visible SVG can still extend below the viewport.
  await chart.scrollIntoViewIfNeeded();
  const bounds = await chart.boundingBox();
  if (!bounds) throw new Error("Synchronized T-Z chart missing");

  await page.mouse.move(
    bounds.x + bounds.width * 0.55,
    bounds.y + bounds.height * 0.90
  );

  await expect.poll(async () => split.getAttribute("data-synced-model-depth")).not.toBe(initialDepth);
  await expect(page.locator(".depth-indicator")).toContainText("DEPTH PLANE");
  await expect(page.locator(".analysis-sync-readout")).toContainText("model plane");
  await expect(page.locator(".analysis-sync-readout")).toContainText("nearest genuine model depth");

  expect(pageErrors).toEqual([]);
});
