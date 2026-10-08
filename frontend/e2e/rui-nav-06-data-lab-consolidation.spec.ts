import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
const sample = [
  "longitude,latitude,depth_m,timestamp,variable,value,units,source,platform_id,sensor_type,qc_flag,dataset_id",
  "68.25,13.25,10,2024-01-02T00:00:00Z,temperature,28.2,degree_Celsius,Argo_GDAC,float_1,argo,1,argo_ds",
  "68.50,13.50,30,2024-01-03T00:00:00Z,salinity,35.1,PSU,INCOIS,platform_2,ctd,1,incois_ds",
  "68.75,13.75,50,2024-01-03T00:00:00Z,temperature,27.1,degree_Celsius,Argo_GDAC,float_1,argo,1,argo_ds"
].join("\n");

async function openLab(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for RUI-NAV-06 verification.");
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/data-lab", { waitUntil: "domcontentloaded" });
  const lab = page.locator('.data-lab-page[data-page="data-lab"]');
  await expect(lab).toBeVisible();
  await expect(page.getByTestId("rui-nav-06-data-lab-directory")).toBeVisible();
  return lab;
}

async function loadCsv(page: Page, content = sample) {
  await page.getByLabel("Ocean dataset file").setInputFiles({
    name: "verified-observations.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(content, "utf8")
  });
}

test("RUI-NAV-06 exposes the frozen eight uniquely addressable Data Lab homes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const lab = await openLab(page);
  const navigation = page.getByRole("navigation", { name: "Data Lab feature directory" });
  const homes = ["overview","sources","datasets","variables","filters","inspection","downloads","provenance"];
  await expect(navigation.locator("button[data-data-lab-directory]")).toHaveCount(homes.length);
  for (const home of homes) {
    await expect(lab.locator('[data-data-lab-home="' + home + '"]')).toHaveCount(1);
  }
  await expect(lab.locator("#data-lab-sources")).toContainText("Official data launchpad");
  await expect(lab.locator("#data-lab-sources")).toContainText("Registered source & protocol adapters");
  await expect(lab.locator("#data-lab-provenance")).toContainText("not independently authenticated");
  await navigation.getByRole("button", { name: "Downloads", exact: true }).click();
  await expect(lab.getByRole("button", { name: "Download import schema" })).toBeEnabled();
});

test("RUI-NAV-06 validates real local rows, filters inspection and exports exact scoped evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const lab = await openLab(page);
  await expect(lab.getByRole("button", { name: "Export filtered JSON" })).toBeDisabled();
  await loadCsv(page);
  await expect(lab).toHaveAttribute("data-validation-status", "validated");
  await expect(lab).toHaveAttribute("data-row-count", "3");
  await expect(lab.locator("#data-lab-inspection")).toContainText("No required-field missingness detected");
  await expect(lab.locator("#data-lab-variables")).toContainText("salinity");
  await expect(lab.locator("#data-lab-variables")).toContainText("temperature");

  await lab.getByLabel("Filter variable").selectOption("temperature");
  await expect(lab.locator("#data-lab-filters")).toHaveAttribute("data-filtered-count", "2");
  await lab.getByLabel("Maximum depth filter").fill("20");
  await expect(lab.locator("#data-lab-filters")).toHaveAttribute("data-filtered-count", "1");
  await expect(lab.locator("#data-lab-inspection .data-lab-preview-card tbody tr")).toHaveCount(1);
  await expect(lab.locator("#data-lab-provenance")).toContainText("Argo_GDAC");

  const downloadEvent = page.waitForEvent("download");
  await lab.getByRole("button", { name: "Export filtered JSON" }).click();
  const download = await downloadEvent;
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.filtered_validated_rows).toBe(1);
  expect(exported.records[0].value).toBe(28.2);
  expect(exported.records[0].depth_m).toBe(10);
  expect(exported.records[0].timestamp).toBe("2024-01-02T00:00:00.000Z");
  expect(exported.records[0].source).toBe("Argo_GDAC");

  await lab.getByRole("button", { name: "Reset filters" }).click();
  await expect(lab.locator("#data-lab-filters")).toHaveAttribute("data-filtered-count", "3");
  await expect(lab.locator("#data-lab-inspection .data-lab-preview-card tbody tr")).toHaveCount(3);
  await lab.getByRole("button", { name: "Clear dataset" }).click();
  await expect(lab).toHaveAttribute("data-validation-status", "empty");
  await expect(lab.getByRole("button", { name: "Export filtered JSON" })).toBeDisabled();
});

test("RUI-NAV-06 rejects invalid timestamps and locks validated-row exports", async ({ page }) => {
  const lab = await openLab(page);
  const invalid = sample.replace("2024-01-02T00:00:00Z", "2024-01-02T00:00:00");
  await loadCsv(page, invalid);
  await expect(lab).toHaveAttribute("data-validation-status", "rejected");
  await expect(lab.locator("#data-lab-inspection")).toContainText("explicit timezone");
  await expect(lab.getByRole("button", { name: "Export filtered JSON" })).toBeDisabled();
  await expect(lab.getByRole("button", { name: "Download validation report" })).toBeEnabled();
  await expect(lab.getByRole("button", { name: "Load validated profiles into 3D Explorer" })).toHaveCount(0);
});

test("RUI-NAV-06 retains directory, controls and accessible exports on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const lab = await openLab(page);
  const navigation = page.getByRole("navigation", { name: "Data Lab feature directory" });
  await expect(navigation.getByRole("button", { name: "Inspection", exact: true })).toBeVisible();
  await expect(lab.getByLabel("Ocean dataset file")).toBeAttached();
  await loadCsv(page);
  await expect(lab).toHaveAttribute("data-validation-status", "validated");
  await lab.getByLabel("Filter source").selectOption("INCOIS");
  await expect(lab.locator("#data-lab-filters")).toHaveAttribute("data-filtered-count", "1");
  await expect(lab.getByRole("button", { name: "Export filtered CSV" })).toBeEnabled();
  await navigation.getByRole("button", { name: "Provenance", exact: true }).click();
  await expect(lab.locator("#data-lab-provenance")).toContainText("INCOIS");
});
