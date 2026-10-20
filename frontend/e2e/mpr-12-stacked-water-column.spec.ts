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

const url=process.env.OCEANTWIN_LIVE_URL;
test("Water Column science tooltip never changes the canvas/control-row geometry",async({page})=>{
  test.setTimeout(180000);
  if(!url||!/^https?:\/\//.test(url)) throw Error("actual browser URL required");
  await page.setViewportSize({width:1440,height:900});
  await page.goto(url.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const skip=page.getByRole("button",{name:"Skip journey"});
  if(await skip.isVisible().catch(()=>false)) await skip.click();
  const area=page.getByTestId("mpr-12-water-column-section");
  const shell=area.locator(".water-column-shell:not(.water-column-loading)");
  const canvas=shell.locator("canvas.water-column-canvas");
  await expect(canvas).toBeVisible({timeout:60000});
  await canvas.scrollIntoViewIfNeeded();
  const tools=shell.locator(".renderer-tools");
  const tooltip=shell.locator(".water-column-hover");
  const nativeDepth=await area.getAttribute("data-native-depth");
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const initial=await Promise.all([canvas.boundingBox(),tools.boundingBox()]);
  const c=initial[0];if(!c||!initial[1])throw Error("real canvas/tools missing");
  let found=false;
  for(let ix=1;ix<=13&&!found;ix++){
    for(let iy=1;iy<=11&&!found;iy++){
      await page.mouse.move(c.x+c.width*ix/14,c.y+c.height*iy/12);
      if(await tooltip.count()===1){found=true;break;}
    }
  }
  expect(found,"a real scientific hovered model point must be inspectable").toBe(true);
  await expect(tooltip).toContainText("Scientific inspection");
  const position=await tooltip.evaluate(node=>getComputedStyle(node).position);
  expect(position,"hover must not enter or resize renderer-tools flex layout").toBe("absolute");
  const hovered=await Promise.all([canvas.boundingBox(),tools.boundingBox()]);
  expect(Math.abs(hovered[0]!.height-c.height)).toBeLessThanOrEqual(2);
  expect(Math.abs(hovered[1]!.height-initial[1]!.height)).toBeLessThanOrEqual(2);
  await page.mouse.move(2,2);
  await expect(tooltip).toHaveCount(0);
  const cleared=await tools.boundingBox();
  expect(Math.abs(cleared!.height-initial[1]!.height)).toBeLessThanOrEqual(2);
  await expect(area).toHaveAttribute("data-native-depth",nativeDepth??"");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source??"glorys");
});
