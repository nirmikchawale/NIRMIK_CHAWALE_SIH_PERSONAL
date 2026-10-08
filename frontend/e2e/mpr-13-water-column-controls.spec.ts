import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";
const live=process.env.OCEANTWIN_LIVE_URL;
if(!live)test.skip(true,"OCEANTWIN_LIVE_URL required");

for(const width of [1440,1024,390,320]) {
 test("MPR-13 native Water Column controls share real source and remain reachable at "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const water=page.getByTestId("mpr-12-water-column-section");
  const dock=water.getByTestId("mpr-12-water-column-dock");
  await expect(dock).toHaveAttribute("data-mpr-phase","13");
  await expect(dock.getByTestId("mpr-13-water-column-controls")).toBeVisible();
  const groups=dock.locator("details.mpr-water-control-group");
  await expect(groups).toHaveCount(6);
  const titles=[
    "Variable and genuine model depth","Native time and observation",
    "Point opacity and vertical geometry","Scientific colour and display threshold",
    "Native isosurface and horizontal currents","Camera, provenance and workflow"
  ];
  for(const name of titles)await expect(dock.getByText(name,{exact:true})).toBeVisible();
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const native=await water.getAttribute("data-native-time");
  await expect(dock).toHaveAttribute("data-native-timestamp",native||"Native timestamp unavailable");
  await expect(dock.getByRole("combobox",{name:"Water column variable"})).toBeVisible();
  await expect(dock.getByRole("combobox",{name:"Water Column native depth level"})).toBeVisible();
  await expect(dock.getByRole("combobox",{name:"Water Column native timestamp"})).toBeVisible();
  await expect(dock.getByRole("slider",{name:"Water Column point opacity"})).toBeVisible();
  await expect(dock.getByRole("slider",{name:"Water Column vertical exaggeration"})).toBeVisible();
  await expect(dock.getByRole("combobox",{name:"Water Column colour palette"})).toBeVisible();
  const opacity=dock.getByRole("slider",{name:"Water Column point opacity"});
  if(await opacity.isEnabled()){
    await opacity.fill("65");
    await expect(water.locator(".water-column-shell")).toHaveAttribute("data-opacity","0.65");
  }
  const group=groups.nth(0);
  await group.locator("summary").click();
  await expect(group).not.toHaveAttribute("open","");
  await group.locator("summary").click();
  await expect(group).toHaveAttribute("open","");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source||"glorys");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
 });
}

test("MPR-13 numeric colour is shared with source-owned Geographic legend",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const water=page.getByTestId("mpr-12-water-column-section");
 const dock=water.getByTestId("mpr-12-water-column-dock");
 const palette=dock.getByRole("combobox",{name:"Water Column colour palette"});
 await palette.selectOption("viridis");
 await expect(page.locator("#mpr-3d-stage .globe-shell")).toHaveAttribute("data-color-palette","viridis");
 await expect(water.locator(".water-column-shell")).toHaveAttribute("data-color-palette","viridis");
 await expect(page.locator(".scientific-colorbar-hud")).toBeVisible();
 await palette.selectOption("icefire");
 await expect(water.locator(".water-column-shell")).toHaveAttribute("data-color-palette","icefire");
 await dock.getByRole("button",{name:/Sources & QC/}).click();
 await expect(page.getByRole("complementary",{name:"Scientific provenance and quality control"})).toBeVisible();
});

test("MPR-13 keeps source-native time and never creates chlorophyll depths",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const chl=page.getByTestId("mpr-06-ocean-intelligence").getByRole("button",{name:"INCOIS chlorophyll"});
 if(await chl.isEnabled()){
  await chl.click();
  const water=page.getByTestId("mpr-12-water-column-section");
  const dock=water.getByTestId("mpr-12-water-column-dock");
  await expect(water).toHaveAttribute("data-eligible","false");
  await expect(dock.getByRole("combobox",{name:"Water Column native depth level"})).toBeDisabled();
  await expect(water.locator(".water-column-canvas")).toHaveCount(0);
 }
});

test("MPR-13 inherits sixteen dark/light glass themes without changing numeric state",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 expect(GLASS_THEMES).toHaveLength(16);
 const dock=page.getByTestId("mpr-12-water-column-dock");
 const before=await dock.getAttribute("data-source-variable");
 for(const theme of GLASS_THEMES) {
  await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
  await page.getByRole("dialog",{name:"Glass appearance gallery"})
    .getByRole("button",{name:new RegExp(theme.label)}).click();
  await expect(page.locator("html")).toHaveAttribute("data-glass-theme",theme.id);
  await expect(dock).toHaveAttribute("data-source-variable",before||"thetao");
  const bg=await dock.locator(".mpr-water-control-group").first().evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
 }
});
