import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";

// UIX-04B: actual browser downloads from native Ocean Canvas pages.
// The only local fixture is explicitly user-supplied Data Lab content; it is
// never described as an authenticated Argo, INCOIS, or GLORYS measurement.
const live = process.env.OCEANTWIN_LIVE_URL;

async function openNativePage(page: Page, route: string, width: number) {
  if (!live || !/^https?:\/\//.test(live)) {
    throw new Error("UIX-04B requires a real absolute OCEANTWIN_LIVE_URL");
  }
  await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(live.replace(/#.*$/, "") + "#/" + route, { waitUntil: "domcontentloaded" });
  await expect(page.locator('.ocean-workbench[data-page="' + route + '"]'))
    .toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}
async function textOf(download: Download) {
  const path = await download.path();
  expect(path, "A genuine browser download must write its actual bytes").not.toBeNull();
  const result = await readFile(path!, "utf8");
  expect(Buffer.byteLength(result)).toBeGreaterThan(80);
  return result;
}

test("UIX04B native 31-depth salinity telemetry CSV exports real source and time", async ({ page }) => {
  test.setTimeout(120_000);
  await openNativePage(page, "telemetry", 1440);
  const tele = page.locator('.telemetry-page[data-page="telemetry"]');
  await expect(tele).toHaveAttribute("data-depth-count", "31");
  await tele.getByRole("button", { name: "Salinity telemetry" }).click();
  await expect(tele).toHaveAttribute("data-variable", "so");
  const button = tele.getByRole("button", { name: "Download depth telemetry CSV" });
  await expect(button).toBeEnabled({ timeout: 45_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toMatch(/^OceanCanvas_so_depth_telemetry_t0\.csv$/);
  const lines = (await textOf(download)).trim().split(/\r?\n/);
  expect(lines[0].split(",")).toEqual([
    "depth_index", "depth_m", "count", "mean", "minimum", "p10",
    "median_p50", "p90", "maximum", "std", "units", "time_utc"
  ]);
  expect(lines).toHaveLength(32); // one header + genuine 31 GLORYS model depths
  const values = lines.slice(1).map(row => row.split(","));
  expect(values.every(v => v.length === 12 && Number.isFinite(Number(v[1])))).toBe(true);
  expect(new Set(values.map(v => v[0])).size).toBe(31);
  expect(new Set(values.map(v => v[11])).size).toBe(1); // no synthetic playback times
});

test("UIX04B Argo comparison JSON preserves diagnostic status and provider provenance", async ({ page }) => {
  test.setTimeout(120_000);
  await openNativePage(page, "compare", 1440);
  const comp = page.locator('.comparison-page[data-page="compare"]');
  const button = comp.getByRole("button", { name: "Download evidence JSON" });
  await expect(button).toBeEnabled({ timeout: 60_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toMatch(/^OceanCanvas_Argo_.+_cycle_\d+_evidence\.json$/);
  const payload = JSON.parse(await textOf(download));
  expect(payload.evidence_type).toBe("diagnostic model-observation consistency");
  expect(payload.exported_by).toContain("Ocean Canvas");
  expect(payload.comparison.summary.platform_id).toBeTruthy();
  expect(payload.comparison.levels.length).toBeGreaterThan(0);
  expect(payload.provenance.model.dataset_id).toBeTruthy();
  expect(payload.provenance.model.doi).toBeTruthy();
  expect(payload.provenance.observations.doi).toBeTruthy();
  await expect(comp.locator("#comparison-evidence")).toContainText("not independent validation");
});

test("UIX04B anomaly export preserves locked temporal capability and non-event interpretation", async ({ page }) => {
  test.setTimeout(120_000);
  await openNativePage(page, "anomaly", 390);
  const anomaly = page.locator('.anomaly-page[data-page="anomaly"]');
  const button = anomaly.getByRole("button", { name: "Download screening evidence" });
  await expect(button).toBeEnabled({ timeout: 60_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toMatch(/^OceanCanvas_anomaly_screen_(thetao|so)_d\d+\.json$/);
  const payload = JSON.parse(await textOf(download));
  expect(payload.interpretation_guardrail).toBeTruthy();
  expect(payload.temporal_screen.status).toBe("locked");
  expect(payload.method).toBeTruthy();
  expect(["thetao", "so"]).toContain(payload.selected_model_context.variable);
  expect(payload.spatial_screen).toBeTruthy();
  expect(payload.residual_screen).toBeTruthy();
  expect(payload.provenance.product).toBeTruthy();
  await expect(anomaly.locator("#anomaly-detected-flags")).toContainText("Flags are not confirmed events");
});

test("UIX04B user-file Data Lab JSON preserves exact measurements and local provenance", async ({ page }) => {
  test.setTimeout(120_000);
  await openNativePage(page, "data-lab", 390);
  const lab = page.locator('.data-lab-page[data-page="data-lab"]');
  const filename = "uix04b-user-observations.csv";
  const input = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source,platform_id,sensor_type,qc_flag,dataset_id",
    "68.25,13.25,10,2024-01-02T00:00:00Z,temperature,28.2,degree_Celsius,local_user_file,sensor_a,argo,1,user_data",
    "68.50,13.50,30,2024-01-03T00:00:00Z,salinity,35.1,PSU,local_user_file,sensor_b,ctd,1,user_data"
  ].join("\n");
  const exportButton = lab.getByRole("button", { name: "Export filtered JSON" });
  await expect(exportButton).toBeDisabled();
  await page.getByLabel("Ocean dataset file").setInputFiles({
    name: filename, mimeType: "text/csv", buffer: Buffer.from(input, "utf8")
  });
  await expect(lab).toHaveAttribute("data-validation-status", "validated", { timeout: 45_000 });
  await expect(lab).toHaveAttribute("data-row-count", "2");
  await expect(exportButton).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
  expect(download.suggestedFilename()).toBe("OceanCanvas_uix04b-user-observations_filtered.json");
  const payload = JSON.parse(await textOf(download));
  expect(payload.processed_locally).toBe(true);
  expect(payload.source_filename).toBe(filename);
  expect(payload.filtered_validated_rows).toBe(2);
  expect(payload.records).toHaveLength(2);
  const sourceRows = payload.records.map((r: {variable:string,value:number,source:string,timestamp:string,depth_m:number}) =>
    [r.variable, Number(r.value), r.source, new Date(r.timestamp).getTime(), Number(r.depth_m)]);
  expect(sourceRows).toEqual([
    ["temperature", 28.2, "local_user_file", Date.parse("2024-01-02T00:00:00Z"), 10],
    ["salinity", 35.1, "local_user_file", Date.parse("2024-01-03T00:00:00Z"), 30]
  ]);
  await expect(lab.locator("#data-lab-provenance")).toContainText("not independently authenticated");
});
