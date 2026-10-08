import { expect, test } from "@playwright/test";
const live=process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true,"OCEANTWIN_LIVE_URL required");

for (const width of [1440,1280,1024,768,390,320]){
 test("MPR-10 real Cesium geographic scene reflows with one original control panel at "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const root=page.locator('.ocean-workbench[data-page="explore"]');
  const header=page.getByTestId("mpr-10-geographic-heading");
  const stage=page.locator("#mpr-3d-stage");
  const control=page.locator(".station-workspace > .control-panel");
  const dock=page.locator(".station-workspace > .visualization-dock");
  await expect(header).toBeVisible();
  await expect(header).toContainText("Explore the ocean in three dimensions");
  await expect(stage).toBeVisible();
  await expect(stage).toHaveAttribute("data-visualization-mode","globe");
  await expect(dock).toBeVisible();
  await expect(page.locator(".station-workspace > .control-panel")).toHaveCount(1);
  await expect(stage.locator(".globe-shell")).toBeVisible();
  const h=await header.boundingBox(),s=await stage.boundingBox(),d=await dock.boundingBox();
  expect(h&&s&&d).toBeTruthy();
  expect(d!.y+d!.height).toBeLessThanOrEqual(h!.y+3);
  expect(h!.y+h!.height).toBeLessThanOrEqual(s!.y+3);
  expect(s!.width).toBeGreaterThan(width>=1121?500:265);
  expect(s!.height).toBeGreaterThanOrEqual(395);
  if(width>=1121){
    const c=await control.boundingBox();
    expect(c).not.toBeNull();
    expect(s!.x+s!.width).toBeLessThanOrEqual(c!.x+4);
    expect(Math.abs(s!.y-c!.y)).toBeLessThan(5);
    const fraction=s!.width/(s!.width+c!.width);
    expect(fraction).toBeGreaterThan(.71);
    expect(fraction).toBeLessThan(.79);
    const cs=await control.evaluate(el=>getComputedStyle(el));
    expect(cs.overflowY).toMatch(/auto|scroll/);
  } else if(width > 760) {
    // Tablet: native controls are vertically stacked below the real globe.
    const c=await control.boundingBox();
    expect(c).not.toBeNull();
    expect(c!.y).toBeGreaterThanOrEqual(s!.y+s!.height-3);
  } else {
    // Mobile intentionally keeps its native control sheet closed until the
    // quick-control tray opens it. Its DOM is present before the globe in
    // flow, so checking its hidden bounding box below the globe is invalid.
    await expect(control).toHaveAttribute("data-mobile-open","false");
    await expect(control).toBeHidden();
    await page.locator(".mobile-explore-tray button").first().click();
    await expect(control).toHaveAttribute("data-mobile-open","true");
    await expect(control).toBeVisible();
    await expect(control.getByRole("navigation",{name:"Geographic tools"}).getByRole("button")).toHaveCount(4);
    await control.getByRole("button",{name:"Close explorer controls"}).click();
    await expect(control).toHaveAttribute("data-mobile-open","false");
    await expect(stage).toBeVisible();
  }
  const source=await root.getAttribute("data-explore-source");
  await expect(root).toHaveAttribute("data-explore-source",source||"glorys");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
 });
}

test("MPR-10 keeps the existing authentic globe and water-column modes",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const stage=page.locator("#mpr-3d-stage");
 await expect(stage.locator(".globe-visualization-layer")).toHaveClass(/active/);
 const water=page.getByTestId("mpr-09-dual-view-navigator").getByRole("button",{name:"Water Column 3D"});
 if(await water.isEnabled()){
  await water.click();
  await expect(page.getByTestId("mpr-12-water-column-section")).toBeVisible();
  await expect(page.getByTestId("mpr-12-water-column-section").locator(".water-column-visualization-layer")).toHaveClass(/active/);
  await page.getByTestId("mpr-09-dual-view-navigator").getByRole("button",{name:"Geographic View"}).click();
  await expect(stage).toHaveAttribute("data-visualization-mode","globe");
 }
});
