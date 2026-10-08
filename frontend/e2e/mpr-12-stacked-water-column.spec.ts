import { expect, test } from "@playwright/test";
const live=process.env.OCEANTWIN_LIVE_URL;
if(!live)test.skip(true,"OCEANTWIN_LIVE_URL required");
for(const width of [1440,1024,390,320]){
 test("MPR-12 two actual 3D renderer sections stay stacked and source linked at "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const geographic=page.locator("#mpr-3d-stage");
  const water=page.getByTestId("mpr-12-water-column-section");
  const renderer=water.locator(".water-column-visualization-layer");
  const dock=water.getByTestId("mpr-12-water-column-dock");
  await expect(geographic.locator(".globe-visualization-layer")).toHaveClass(/active/);
  await expect(geographic.locator(".globe-shell")).toBeVisible();
  await expect(water).toBeVisible();
  await expect(renderer).toBeVisible();
  await expect(dock).toBeVisible();
  await expect(water.locator("[data-renderer-mounted]")).toHaveAttribute("data-renderer-mounted","true");
  const g=await geographic.boundingBox(),w=await water.boundingBox();
  expect(g&&w).toBeTruthy();
  expect(w!.y).toBeGreaterThanOrEqual(g!.y+g!.height-2);
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  await expect(water).toHaveAttribute("data-scientific-source",source||"glorys");
  const nav=page.getByTestId("mpr-09-dual-view-navigator");
  await expect(nav.getByRole("button",{name:"Geographic View"})).toHaveAttribute("aria-controls","mpr-3d-stage");
  await expect(nav.getByRole("button",{name:"Water Column 3D"})).toHaveAttribute("aria-controls","mpr-water-column-section");
  if(width>=1121){
   const s=await water.locator(".mpr-water-column-visualization").boundingBox();
   const d=await dock.boundingBox();
   expect(s&&d).toBeTruthy();
   expect(s!.x+s!.width).toBeLessThanOrEqual(d!.x+4);
   expect(Math.abs(s!.y-d!.y)).toBeLessThan(4);
   expect(s!.width/(s!.width+d!.width)).toBeGreaterThan(.70);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
 });
}
test("MPR-12 two sections never fabricate satellite chlorophyll depth",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const water=page.getByTestId("mpr-12-water-column-section");
 const satellite=page.getByTestId("mpr-06-ocean-intelligence").getByRole("button",{name:"INCOIS chlorophyll"});
 if(await satellite.isEnabled()){
  await satellite.click();
  await expect(water).toHaveAttribute("data-eligible","false");
  await expect(water.getByRole("status")).toContainText("surface-only");
  await expect(water.locator(".water-column-canvas")).toHaveCount(0);
  await expect(page.locator("#mpr-3d-stage .globe-shell")).toBeVisible();
 }
});
test("MPR-12 navigator selects real section without unmounting geographic Cesium",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const water=page.getByTestId("mpr-12-water-column-section");
 const globe=page.locator("#mpr-3d-stage .globe-shell");
 const nav=page.getByTestId("mpr-09-dual-view-navigator");
 if(await nav.getByRole("button",{name:"Water Column 3D"}).isEnabled()){
   await nav.getByRole("button",{name:"Water Column 3D"}).click();
   await expect(water).toBeInViewport();
   await expect(globe).toBeAttached();
   await water.getByRole("button",{name:"Return to Geographic 3D"}).click();
   await expect(page.locator("#mpr-3d-stage")).toBeInViewport();
   await expect(globe).toBeVisible();
 }
});
