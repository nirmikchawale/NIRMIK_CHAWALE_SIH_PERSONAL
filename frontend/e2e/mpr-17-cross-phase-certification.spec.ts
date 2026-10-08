import { expect, test } from "@playwright/test";

const live=process.env.OCEANTWIN_LIVE_URL;
if(!live)test.skip(true,"Real hosted frontend required");

for(const width of [320,390,768,1024,1366,1440]) {
 test("MPR-17 integrated two-renderer and inspector smoke: "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const root=page.locator('.ocean-workbench[data-page="explore"]');
  const geo=page.locator("#mpr-3d-stage");
  const water=page.getByTestId("mpr-12-water-column-section");
  const geographicControls=page.locator(".station-workspace > .control-panel");
  const waterControls=water.getByTestId("mpr-12-water-column-dock");
  const inspectors=page.getByTestId("mpr-15-inspector-access");
  await expect(root).toBeVisible();
  await expect(geo).toBeVisible();
  await expect(water).toBeVisible();
  await expect(geographicControls).toBeVisible();
  await expect(waterControls).toBeVisible();
  await expect(inspectors).toBeVisible();
  await expect(page.locator(".station-workspace > .control-panel")).toHaveCount(1);
  await expect(page.getByTestId("mpr-09-dual-view-navigator")).toBeVisible();
  await expect(geo).toHaveAttribute("data-linked-variable",await water.getAttribute("data-linked-variable")||"thetao");
  await expect(geo).toHaveAttribute("data-linked-block",await water.getAttribute("data-linked-block")||"BASE-GLORYS-001");
  await expect(geo).toHaveAttribute("data-linked-time",await water.getAttribute("data-native-time")||"Unavailable");
  const g=await geo.boundingBox(),w=await water.boundingBox();
  expect(g&&w).toBeTruthy();
  expect(w!.y).toBeGreaterThanOrEqual(g!.y+g!.height-2);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,"page should fit viewport "+width).toBeLessThanOrEqual(2);
  await expect(inspectors.getByRole("button",{name:"Open scientific provenance drawer"})).toBeEnabled();
  await inspectors.getByRole("button",{name:"Open scientific provenance drawer"}).click();
  await expect(page.locator(".provenance-drawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".provenance-drawer")).toHaveCount(0);
  const geoState=await geo.getAttribute("data-linked-evidence");
  const waterState=await water.getAttribute("data-linked-evidence");
  expect(["verified","loading","planned","unavailable","mismatch"]).toContain(geoState);
  expect(["verified","loading","planned","unavailable","mismatch"]).toContain(waterState);
  // A missing or unmatched model volume must never look like successful measured geometry.
  if(waterState!=="verified")await expect(water.locator(".water-column-canvas")).toHaveCount(0);
 });
}

test("MPR-17 source selection updates both scientific sections without synthetic depth",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const root=page.locator('.ocean-workbench[data-page="explore"]');
 const geo=page.locator("#mpr-3d-stage");
 const water=page.getByTestId("mpr-12-water-column-section");
 const source=page.getByTestId("mpr-06-ocean-intelligence");
 const chlorophyll=source.getByRole("button",{name:"INCOIS chlorophyll"});
 if(await chlorophyll.isEnabled()) {
  await chlorophyll.click();
  await expect(root).toHaveAttribute("data-explore-source","chlorophyll");
  await expect(geo).toHaveAttribute("data-linked-source","chlorophyll");
  await expect(water).toHaveAttribute("data-scientific-source","chlorophyll");
  await expect(water).toHaveAttribute("data-eligible","false");
  await expect(water).toHaveAttribute("data-linked-evidence","unavailable");
  await expect(water.locator(".water-column-canvas")).toHaveCount(0);
  await expect(water.getByTestId("mpr-12-water-column-dock").getByRole("combobox",{name:"Water Column native depth level"})).toBeDisabled();
 }
});

test("MPR-17 appearance cannot overwrite the actual model-science colour ramp",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const gradient=page.locator(".colorbar-interactive-track");
 const initial=await gradient.evaluate(x=>getComputedStyle(x).backgroundImage);
 const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
 await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
 await page.getByRole("dialog",{name:"Glass appearance gallery"})
  .getByRole("button",{name:/Glacier Mint/}).click();
 await expect(page.locator("html")).toHaveAttribute("data-glass-theme","glacier-mint");
 expect(await gradient.evaluate(x=>getComputedStyle(x).backgroundImage)).toBe(initial);
 await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source??"glorys");
});


test("MPR-17 default verified GLORYS baseline must actually materialize in BOTH 3D views",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const geo=page.locator("#mpr-3d-stage");
 const water=page.getByTestId("mpr-12-water-column-section");
 await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source","glorys");
 await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:45000});
 await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:45000});
 await expect(geo.locator(".globe-shell")).toBeVisible();
 await expect(water.locator(".water-column-canvas")).toBeVisible();
 await expect(water.locator(".mpr-water-column-unavailable")).toHaveCount(0);
 const depth=await water.getAttribute("data-native-depth");
 expect(Number(depth)).toBeGreaterThanOrEqual(0);
 await expect(geo).toHaveAttribute("data-linked-time",await water.getAttribute("data-native-time")||"Unavailable");
});
