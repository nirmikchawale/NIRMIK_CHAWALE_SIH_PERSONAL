import { expect, test, type Page } from "@playwright/test";
import { GLASS_THEMES, DEFAULT_GLASS_THEME } from "../src/theme";

// UIX-02-F: targeted, real-source route/evidence/interaction & 16-theme
// acceptance on the exact UIX-02-E draft application; NO mocks or screenshots.
const origin = process.env.OCEANTWIN_LIVE_URL;
if (!origin || !(origin.startsWith("http://") || origin.startsWith("https://"))) {
  throw new Error("UIX-02-F requires an actual absolute OCEANTWIN_LIVE_URL");
}
const base = origin.replace(/#.*$/, "");
type Route = "explore"|"telemetry"|"compare"|"anomaly"|"data-lab"|"about";
async function open(page: Page, route: Route, width: number) {
  await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "#/" + route, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-page",route,{timeout:60_000});
  const skip=page.getByRole("button",{name:"Skip journey"});
  if(await skip.isVisible().catch(()=>false))await skip.click();
}
async function noOverflow(page: Page, width: number) {
  const dx = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(dx, "No horizontal root overflow at "+width+"px").toBeLessThanOrEqual(5);
}
const directory = (page:Page)=>page.getByRole("navigation",{name:"Ocean Canvas workspaces"});

for (const width of [390,1440]) {
  test("UIX02-F navigation routes five scientific workspaces with keyboard, "+width+"px", async ({page})=>{
    test.setTimeout(180_000);
    await open(page,"explore",width);
    const routeGroups=[
      {group:"Analyze",pages:[["Telemetry","telemetry"],["Model vs Observation","compare"],["Anomaly Screening","anomaly"]]},
      {group:"Data",pages:[["Data Lab","data-lab"]]},
      {group:"Science",pages:[["Science System","about"]]}
    ] as const;
    for(const entry of routeGroups)for(const [label,route]of entry.pages){
      if(width<900){
        await page.getByRole("button",{name:"Open workspace navigation"}).click();
      }else{
        await page.getByRole("button",{name:"Open "+entry.group+" workspaces"}).click();
      }
      const nav=directory(page);
      await expect(nav).toBeVisible();
      await nav.getByRole("button",{name:entry.group,exact:true}).click();
      const target=nav.getByRole("button",{name:label,exact:true});
      await target.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp("#/"+route+"$"));
      await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-page",route);
      await expect(nav).toBeHidden();
      const panel=route==="telemetry"?".telemetry-page":route==="compare"?".comparison-page":
        route==="anomaly"?".anomaly-page":route==="data-lab"?".data-lab-page":".info-page";
      await expect(page.locator(panel)).toBeVisible();
      await noOverflow(page,width);
    }
    console.log("UIX02F navigated 5 real pages with keyboard at",width);
  });
}

for(const width of [390,1440]) {
  test("UIX02-F Telemetry and Model-vs-Observation retain scientific interactions "+width+"px",async({page})=>{
    test.setTimeout(150_000);
    await open(page,"telemetry",width);
    const tele=page.locator('.telemetry-page[data-page="telemetry"]');
    await expect(page.getByTestId("rui-nav-03-telemetry-directory")).toBeVisible();
    await expect(tele).toHaveAttribute("data-depth-count","31");
    const before=await tele.getAttribute("data-selected-depth");
    const depth=tele.getByRole("slider",{name:"Telemetry depth",exact:true});
    await depth.focus();await page.keyboard.press("Home");
    await expect(tele).not.toHaveAttribute("data-selected-depth",before??"");
    await tele.getByRole("button",{name:"Salinity telemetry",exact:true}).click();
    await expect(tele).toHaveAttribute("data-variable","so");
    await expect(tele.getByRole("slider",{name:"Telemetry time",exact:true})).toBeDisabled();
    await expect(tele.getByRole("button",{name:"Download depth telemetry CSV"})).toBeEnabled();
    await open(page,"compare",width);
    const comp=page.locator('.comparison-page[data-page="compare"]');
    await expect(page.getByTestId("rui-nav-04-comparison-directory")).toBeVisible();
    const selector=comp.getByLabel("Verified Argo profile");
    await expect(selector).toBeEnabled({timeout:60_000});
    await expect(selector.locator("option")).toHaveCount(2);
    await expect(comp.locator("#comparison-qc")).toContainText("Provider QC");
    await expect(comp.locator("#comparison-evidence")).toContainText("not independent validation");
    await expect(comp.getByRole("button",{name:"Download evidence JSON"})).toBeEnabled();
    await noOverflow(page,width);
    console.log("UIX02F genuine 31-depth telemetry and 2-profile comparison",width);
  });
}

for(const width of [390,1440]) {
  test("UIX02-F Anomaly and Data Lab preserve truthful controls and provenance "+width+"px",async({page})=>{
    test.setTimeout(160_000);
    await open(page,"anomaly",width);
    const anomaly=page.locator('.anomaly-page[data-page="anomaly"]');
    await expect(page.getByTestId("rui-nav-05-anomaly-directory")).toBeVisible();
    await expect(anomaly.locator("#anomaly-detected-flags")).toContainText("Flags are not confirmed events",{timeout:45_000});
    await anomaly.getByRole("button",{name:"Argo residual",exact:true}).click();
    await expect(anomaly.locator(".anomaly-explainable-workspace")).toHaveAttribute("data-focus-screen","residual");
    await expect(anomaly.getByRole("button",{name:"Download screening evidence"})).toBeEnabled();
    await open(page,"data-lab",width);
    const lab=page.locator('.data-lab-page[data-page="data-lab"]');
    await expect(page.getByTestId("rui-nav-06-data-lab-directory")).toBeVisible();
    await expect(lab.getByRole("button",{name:"Export filtered JSON"})).toBeDisabled();
    const sample=[
      "longitude,latitude,depth_m,timestamp,variable,value,units,source,platform_id,sensor_type,qc_flag,dataset_id",
      "68.25,13.25,10,2024-01-02T00:00:00Z,temperature,28.2,degree_Celsius,Argo_GDAC,float_1,argo,1,argo_ds",
      "68.50,13.50,30,2024-01-03T00:00:00Z,salinity,35.1,PSU,INCOIS,platform_2,ctd,1,incois_ds"
    ].join("\n");
    await page.getByLabel("Ocean dataset file").setInputFiles({name:"uix02f-local-observations.csv",mimeType:"text/csv",buffer:Buffer.from(sample,"utf-8")});
    await expect(lab).toHaveAttribute("data-validation-status","validated");
    await expect(lab).toHaveAttribute("data-row-count","2");
    await expect(lab.getByRole("button",{name:"Export filtered JSON"})).toBeEnabled();
    await expect(lab.locator("#data-lab-provenance")).toContainText("not independently authenticated");
    await noOverflow(page,width);
    console.log("UIX02F anomaly residual and verified local 2-row Data Lab",width);
  });
}

for(const width of [320,1440]) {
  test("UIX02-F Explorer evidence/QC opens and closes without source mutation "+width+"px",async({page})=>{
    test.setTimeout(130_000);
    await open(page,"explore",width);
    const root=page.locator(".ocean-workbench");
    const source=await root.getAttribute("data-explore-source");
    const hub=page.getByTestId("mpr-08-evidence-hub");
    await expect(hub).toBeVisible({timeout:45_000});
    await hub.getByRole("button",{name:"Open Ocean Intelligence evidence inspector"}).click();
    await expect(page.locator(".evidence-rail")).toHaveAttribute("data-open","true");
    await page.getByRole("button",{name:"Close evidence inspector"}).click();
    await expect(page.locator(".evidence-rail")).toHaveAttribute("data-open","false");
    await hub.getByRole("button",{name:"Sources & QC"}).click();
    const prov=page.getByRole("complementary",{name:"Scientific provenance and quality control"});
    await expect(prov).toBeVisible();
    await page.getByRole("button",{name:"Close provenance drawer"}).click();
    await expect(prov).toHaveCount(0);
    await expect(root).toHaveAttribute("data-explore-source",source??"glorys");
    await noOverflow(page,width);
  });
}

for(const width of [320,390,768,1440]) {
  test("UIX02-F all 16 glass themes preserve route and scientific identity at "+width+"px",async({page})=>{
    test.setTimeout(240_000);
    await open(page,"explore",width);
    const root=page.locator(".ocean-workbench");
    const source=await root.getAttribute("data-explore-source");
    const block=await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
    expect(GLASS_THEMES).toHaveLength(16);
    expect(DEFAULT_GLASS_THEME).toBe("arctic-mist");
    for(const theme of GLASS_THEMES){
      await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
      const gallery=page.getByRole("dialog",{name:"Glass appearance gallery"});
      await expect(gallery).toBeVisible();
      const box=await gallery.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-2);
      expect(box!.x+box!.width).toBeLessThanOrEqual(width+3);
      await gallery.getByRole("button",{name:new RegExp(theme.label)}).click();
      await expect(page.locator("html")).toHaveAttribute("data-glass-theme",theme.id);
      await expect(root).toHaveAttribute("data-explore-source",source??"glorys");
      await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id",block??"BASE-GLORYS-001");
      await expect(page).toHaveURL(/#\/explore$/);
      await noOverflow(page,width);
    }
    console.log("UIX02F completed 16/16 genuine theme selections, viewport",width);
  });
}
