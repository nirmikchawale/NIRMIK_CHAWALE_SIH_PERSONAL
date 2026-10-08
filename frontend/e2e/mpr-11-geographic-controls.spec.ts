import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";
const live=process.env.OCEANTWIN_LIVE_URL;
if(!live)test.skip(true,"OCEANTWIN_LIVE_URL required");

for(const width of [1440,1024,390,320]){
 test("MPR-11 geographic control groups retain original native controls at "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const dock=page.locator(".station-workspace > .control-panel");
  if(width<=760){
    await expect(dock).toHaveAttribute("data-mobile-open","false");
    await page.locator(".mobile-explore-tray button").first().click();
    await expect(dock).toHaveAttribute("data-mobile-open","true");
  }
  await expect(dock).toHaveAttribute("data-mpr-geographic-dock","true");
  await expect(dock.getByTestId("mpr-11-geographic-dock")).toContainText("Explore controls");
  const links=dock.getByRole("navigation",{name:"Geographic tools"});
  await expect(links.getByRole("button")).toHaveCount(4);
  const selectors=[
   "Variables & field layers",
   "Depth & section",
   "Native time",
   "Observations & Argo",
   "Source status & scientific quality"
  ];
  const groups=dock.locator("details.mpr-geographic-control-group");
  await expect(groups).toHaveCount(5);
  for (const title of selectors){
   await expect(dock.getByText(title,{exact:true})).toBeVisible();
  }
  for(const sectionId of ["explore-variables","explore-depth","explore-time","explore-observations"]){
   await expect(dock.locator("#"+sectionId)).toBeVisible();
  }
  const depthGroup=groups.nth(1);
  await depthGroup.locator("summary").click();
  await expect(depthGroup).not.toHaveAttribute("open","");
  await dock.getByRole("navigation",{name:"Jump to exploration controls"}).getByRole("button",{name:"Depth"}).click();
  await expect(depthGroup).toHaveAttribute("open","");
  await expect(dock.locator("#explore-depth")).toBeVisible();
  await expect(dock.locator(".variable-switcher button").first()).toBeEnabled();
  await expect(dock.locator("#explore-time")).toContainText(/2024|2025|2026|UTC|timestamp|time/i);
  const currentSource=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  await links.getByRole("button",{name:/Display range/}).click();
  await expect(page.locator(".scientific-colorbar-hud")).toBeVisible();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",currentSource||"glorys");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
 });
}

test("MPR-11 tool links target real camera/basemap, not duplicate command panels",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const dock=page.locator(".station-workspace > .control-panel");
 const toolLinks=dock.getByRole("navigation",{name:"Geographic tools"});
 await expect(page.locator("#mpr-3d-stage .camera-control-stack")).toHaveCount(1);
 await expect(page.locator("#mpr-3d-stage .imagery-control")).toHaveCount(1);
 await expect(toolLinks.getByRole("button",{name:/Camera/})).toBeEnabled();
 await expect(toolLinks.getByRole("button",{name:/Basemap/})).toBeEnabled();
 await toolLinks.getByRole("button",{name:/Camera/}).click();
 await expect(page.locator("#mpr-3d-stage .camera-control-stack")).toBeVisible();
 await toolLinks.getByRole("button",{name:/Basemap/}).click();
 await expect(page.locator("#mpr-3d-stage .imagery-control")).toBeVisible();
 await expect(page.locator(".station-workspace > .control-panel")).toHaveCount(1);
});

test("MPR-11 theme-derived progressive dock preserves all sixteen themes",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(live!);
 expect(GLASS_THEMES).toHaveLength(16);
 const dock=page.locator(".station-workspace > .control-panel");
 const selection=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
 for(const theme of GLASS_THEMES){
  await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
  await page.getByRole("dialog",{name:"Glass appearance gallery"})
   .getByRole("button",{name:new RegExp(theme.label)}).click();
  await expect(page.locator("html")).toHaveAttribute("data-glass-theme",theme.id);
  const bg=await dock.locator(".mpr-geographic-control-group").first().evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",selection||"glorys");
 }
});
