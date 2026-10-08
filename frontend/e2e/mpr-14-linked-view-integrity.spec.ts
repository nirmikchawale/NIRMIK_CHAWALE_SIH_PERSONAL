import { expect, test } from "@playwright/test";
import { linkedSelectionKey, matchesGeographicPayload, matchesWaterColumnPayload, sameNativeTimestamp } from "../src/linked-view-integrity";
import type { FieldResponse, VolumeResponse } from "../src/types";

const selection={
  sourceId:"native-provider",mainBlockId:"BASE-GLORYS-001",mainBlockRevision:0,
  variable:"thetao",timeIndex:0,time:"2024-01-02T00:00:00Z",depthIndex:2,depthM:10
};
const geographic:FieldResponse={
  variable:"thetao",label:"Temperature",units:"degrees_c",time_index:0,
  time:"2024-01-02T00:00:00Z",depth_index:2,depth_m:10,
  longitude:[68],latitude:[13],values:[[24]],minimum:24,maximum:24,
  provenance:{product:"model",dataset_id:"native-provider",freshness_class:"verified",runtime_mode:"static"}
};
const water:VolumeResponse={
  variable:"thetao",label:"Temperature",units:"degrees_c",time_index:0,
  time:"2024-01-02T00:00:00Z",points:[[68,13,10,24]],minimum:24,maximum:24,
  depth_positive:"down",rendering_note:"Native model grid"
};

test("MPR-14: matching source-time-depth accepts only coherent source payloads",()=>{
 expect(matchesGeographicPayload(geographic,selection)).toBe(true);
 expect(matchesWaterColumnPayload(water,selection)).toBe(true);
 expect(sameNativeTimestamp("2024-01-02","2024-01-02T00:00:00Z")).toBe(true);
 expect(matchesGeographicPayload({...geographic,depth_index:4},selection)).toBe(false);
 expect(matchesGeographicPayload({...geographic,depth_m:400},selection)).toBe(false);
 expect(matchesGeographicPayload({...geographic,time:"2024-01-03T00:00:00Z"},selection)).toBe(false);
 expect(matchesGeographicPayload({...geographic,provenance:{...geographic.provenance,dataset_id:"other-provider"}},selection)).toBe(false);
 expect(matchesWaterColumnPayload({...water,time_index:1},selection)).toBe(false);
 expect(matchesWaterColumnPayload({...water,depth_positive:"up"},selection)).toBe(false);
 expect(matchesWaterColumnPayload({...water,points:[]},selection)).toBe(false);
 expect(linkedSelectionKey({...selection,mainBlockRevision:1})).not.toBe(linkedSelectionKey(selection));
 expect(linkedSelectionKey({...selection,mainBlockId:"other"})).not.toBe(linkedSelectionKey(selection));
 expect(linkedSelectionKey({...selection,timeIndex:1})).not.toBe(linkedSelectionKey(selection));
});

const live=process.env.OCEANTWIN_LIVE_URL;
if(!live)test.skip(true,"OCEANTWIN_LIVE_URL required");

for(const width of [1440,390,320]){
 test("MPR-14 rendered views never expose different linked variables at "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const geo=page.locator("#mpr-3d-stage");
  const water=page.getByTestId("mpr-12-water-column-section");
  await expect(geo).toBeVisible();
  await expect(water).toBeVisible();
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const variable=await water.getAttribute("data-linked-variable");
  await expect(geo).toHaveAttribute("data-linked-variable",variable||"thetao");
  await expect(geo).toHaveAttribute("data-linked-source",source||"glorys");
  await expect(water).toHaveAttribute("data-scientific-source",source||"glorys");
  await expect(geo).toHaveAttribute("data-linked-block",await water.getAttribute("data-linked-block")||"BASE-GLORYS-001");
  await expect(geo).toHaveAttribute("data-linked-time",await water.getAttribute("data-native-time")||"2024-01-02T00:00:00Z");
  for(const status of [geo,water]){
    const state=await status.getAttribute("data-linked-evidence");
    expect(["verified","loading","planned","unavailable","mismatch"]).toContain(state);
  }
  await expect(water.locator(".water-column-canvas")).toHaveCount(
    (await water.getAttribute("data-linked-evidence"))==="verified"?1:0
  );
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
 });
}
test("MPR-14 source switch never exposes previous volume under a new source",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const root=page.locator(".ocean-workbench");
 const water=page.getByTestId("mpr-12-water-column-section");
 const chl=page.getByTestId("mpr-06-ocean-intelligence").getByRole("button",{name:"INCOIS chlorophyll"});
 if(await chl.isEnabled()) {
  await chl.click();
  await expect(root).toHaveAttribute("data-explore-source","chlorophyll");
  await expect(water).toHaveAttribute("data-linked-evidence","unavailable");
  await expect(water.locator(".water-column-canvas")).toHaveCount(0);
  await expect(water).toHaveAttribute("data-eligible","false");
 }
});
