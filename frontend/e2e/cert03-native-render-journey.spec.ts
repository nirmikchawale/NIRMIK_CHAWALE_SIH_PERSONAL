import { expect, test, type Page } from "@playwright/test";

/**
 * CERT-03 verifies current, real browser rendering/navigation, not a mock
 * three-dimensional result. The preview server must bundle genuine GLORYS
 * static science and original checksum-verified pilot files.
 */
function previewUrl() {
  const base = process.env.OCEANTWIN_LIVE_URL;
  if (!base) throw new Error("CERT-03 needs the built local preview URL");
  return base.replace(/#.*$/, "") + "#/explore";
}
async function openRealExplorer(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(previewUrl(), { waitUntil: "domcontentloaded" });
  const workbench = page.locator('.ocean-workbench[data-page="explore"]');
  await expect(workbench).toBeVisible({timeout: 45_000});
  await expect(page.locator("#mpr-3d-stage")).toBeVisible();
  return workbench;
}
test("CERT-03 real source-backed IO-001 links geographic and depth-resolved water column", async ({page}, info) => {
  test.setTimeout(180_000);
  await openRealExplorer(page);
  const hud=page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await hud.getByLabel("Active main block").selectOption("IO-001");
  const geo=page.locator("#mpr-3d-stage");
  const water=page.getByTestId("mpr-12-water-column-section");
  await expect(geo).toHaveAttribute("data-linked-block","IO-001",{timeout:45_000});
  await expect(water).toHaveAttribute("data-linked-block","IO-001",{timeout:45_000});
  await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:45_000});
  await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:45_000});
  await expect(geo).toHaveAttribute("data-linked-variable","thetao");
  await expect(water).toHaveAttribute("data-linked-variable","thetao");
  const geoTime=await geo.getAttribute("data-linked-time");
  const waterTime=await water.getAttribute("data-native-time");
  expect(geoTime).toBe(waterTime);
  expect(waterTime).toMatch(/^2004-03-15T/);
  await expect(water.locator(".water-column-shell")).toBeVisible();
  await expect(water.locator(".water-column-shell")).toContainText("IO-001");
  await expect(water.getByLabel("Water Column native depth level")).toHaveCount(1);
  await expect(water.getByLabel("Water Column native timestamp")).toBeDisabled();
  await expect(water.getByLabel("Water Column native depth level").locator("option")).toHaveCount(31);
  await expect(page.getByTestId("mpr-15-inspector-access")).toBeVisible();
  await info.attach("cert03-original-native-pilot-evidence.json",{
    body:Buffer.from(JSON.stringify({
      block:"IO-001", sourceTime:waterTime,
      geographicEvidence:await geo.getAttribute("data-linked-evidence"),
      waterEvidence:await water.getAttribute("data-linked-evidence"),
      nativeDepthOptions:await water.getByLabel("Water Column native depth level").locator("option").count(),
      independentArgoValidationClaimed:false,
      syntheticMeasurementsIntroduced:false
    },null,2)),contentType:"application/json"
  });
});

test("CERT-03 planned IO-003 withholds unacquired water column science", async({page})=>{
  test.setTimeout(180_000);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(previewUrl()+"?block=IO-003",{waitUntil:"domcontentloaded"});
  const context=page.getByTestId("scientific-context-bar");
  await expect(context).toHaveAttribute("data-block-id","IO-003",{timeout:45_000});
  const water=page.getByTestId("mpr-12-water-column-section");
  await expect(water).toHaveAttribute("data-linked-block","IO-003",{timeout:45_000});
  await expect(water).toHaveAttribute("data-linked-evidence","planned");
  await expect(water.locator(".mpr-water-column-unavailable")).toContainText(
    "Planned block · water-column evidence withheld"
  );
  await expect(water.locator(".water-column-shell")).toHaveCount(0);
});
