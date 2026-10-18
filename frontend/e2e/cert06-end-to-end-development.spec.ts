import {expect,test,type Page} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {GLASS_THEME_IDS,DEFAULT_GLASS_THEME} from "../src/theme";

const base=process.env.OCEANTWIN_LIVE_URL;
const explore=(block?:string)=>{
  if(!base)throw new Error("CERT-06 must run against a real compiled local HTTP site");
  return base.split("#")[0]+"#/explore"+(block?"?block="+block:"");
};
async function verifyViews(page:Page,block:string,source="glorys"){
  const geo=page.locator("#mpr-3d-stage");
  const water=page.getByTestId("mpr-12-water-column-section");
  await expect(geo).toHaveAttribute("data-linked-block",block,{timeout:60_000});
  await expect(water).toHaveAttribute("data-linked-block",block,{timeout:60_000});
  await expect(geo).toHaveAttribute("data-linked-source",source);
  await expect(water).toHaveAttribute("data-scientific-source",source);
  await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await expect(geo.locator(".globe-shell")).toBeVisible();
  await expect(water.locator(".water-column-canvas")).toBeVisible();
  expect(await geo.getAttribute("data-linked-time")).toBe(await water.getAttribute("data-native-time"));
  expect(await geo.getAttribute("data-linked-variable")).toBe(await water.getAttribute("data-linked-variable"));
  return {geo,water};
}

test("CERT-06 native geography -> original two-date 3D -> scalar/currents -> inspector complete workflow",async({page},info)=>{
  test.setTimeout(300_000);
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(explore(),{waitUntil:"domcontentloaded"});
  await expect(page.locator("html")).toHaveAttribute("data-glass-theme",DEFAULT_GLASS_THEME);
  expect(GLASS_THEME_IDS).toHaveLength(18);
  let {geo,water}=await verifyViews(page,"BASE-GLORYS-001");
  await expect(water).toHaveAttribute("data-native-time",/^2024-01-02T/);
  const hud=page.getByTestId("integrated-main-block-hud");
  await expect(hud).toBeVisible();
  await hud.getByLabel("Active main block").selectOption("IO-001");
  ({geo,water}=await verifyViews(page,"IO-001"));
  await expect(water).toHaveAttribute("data-native-time",/^2004-03-15T/);
  const nativeTimes=water.getByLabel("Water Column native timestamp");
  await expect(nativeTimes.locator("option")).toHaveCount(2);
  const depths=water.getByLabel("Water Column native depth level");
  await expect(depths.locator("option")).toHaveCount(31);
  await nativeTimes.selectOption("1");
  await expect(water).toHaveAttribute("data-native-time",/^2004-07-28T/,{timeout:60_000});
  await expect(geo).toHaveAttribute("data-linked-time",/^2004-07-28T/,{timeout:60_000});
  await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await depths.selectOption("18");
  await expect.poll(async()=>water.getAttribute("data-native-depth")).not.toBe("0");
  const vars=water.getByLabel("Water column variable");
  await vars.selectOption("so");
  await expect(geo).toHaveAttribute("data-linked-variable","so");
  await expect(water).toHaveAttribute("data-linked-variable","so");
  await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await vars.selectOption("currents");
  await expect(geo).toHaveAttribute("data-linked-variable","currents");
  await expect(water).toHaveAttribute("data-linked-variable","currents");
  await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
  const inspectors=page.getByTestId("mpr-15-inspector-access");
  await expect(inspectors).toBeVisible();
  await inspectors.getByRole("button",{name:"Open scientific provenance drawer"}).click();
  await expect(inspectors.getByRole("button",{name:"Open scientific provenance drawer"})).toHaveAttribute("aria-expanded","true");
  // The open provenance overlay intentionally owns the pointer surface.
  // Close via its *visible native control*, not the obscured generic
  // background inspector button (real Chromium catches interception).
  const provenanceDrawer=page.locator(".provenance-drawer");
  await expect(provenanceDrawer).toBeVisible();
  await provenanceDrawer.getByRole("button",{name:"Close provenance drawer"}).click();
  await expect(provenanceDrawer).toHaveCount(0);
  await expect(inspectors.getByRole("button",{name:"Open scientific provenance drawer"})).toHaveAttribute("aria-expanded","false");
  const evidence={schema:"oceancanvas-cert06-one-browser-native-integration-v1",block:"IO-001",
   nativeDates:["2004-03-15","2004-07-28"],nativeDepthLevels:31,
   finalVariable:"currents",finalTime:await water.getAttribute("data-native-time"),
   depth:await water.getAttribute("data-native-depth"),
   bothViewsAccepted:true,independentArgoValidationClaimed:false,syntheticFrameCreated:false};
  mkdirSync("certification-evidence/cert06",{recursive:true});
  writeFileSync("certification-evidence/cert06/integrated-browser.json",JSON.stringify(evidence,null,2)+"\n");
  await info.attach("cert06-integrated-original-source.json",{body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:"application/json"});
});

for(const width of [390,768]) {
  test("CERT-06 responsive original source + scientific palette + neutral appearance "+width,async({page})=>{
    test.setTimeout(210_000);
    await page.setViewportSize({width,height:width===390?844:900});
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto(explore(),{waitUntil:"domcontentloaded"});
    const {geo,water}=await verifyViews(page,"BASE-GLORYS-001");
    const legend=page.locator(".colorbar-interactive-track");
    const original=await legend.evaluate(el=>getComputedStyle(el).backgroundImage);
    await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
    const modal=page.getByRole("dialog",{name:"Glass appearance gallery"});
    await expect(modal.locator(".theme-option")).toHaveCount(18);
    await modal.getByRole("button",{name:/Neutral Dark/}).click();
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme","system-dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
    expect(await legend.evaluate(el=>getComputedStyle(el).backgroundImage)).toBe(original);
    await expect(geo).toHaveAttribute("data-linked-evidence","verified");
    await expect(water).toHaveAttribute("data-linked-evidence","verified");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme","system-dark");
    await verifyViews(page,"BASE-GLORYS-001");
  });
}
test("CERT-06 planned IO-003 may navigate but never materializes a source-invented 3D volume",async({page})=>{
  test.setTimeout(180_000);
  await page.goto(explore("IO-003"),{waitUntil:"domcontentloaded"});
  const water=page.getByTestId("mpr-12-water-column-section");
  await expect(water).toHaveAttribute("data-linked-block","IO-003",{timeout:60_000});
  await expect(water).toHaveAttribute("data-linked-evidence","planned");
  await expect(water.locator(".water-column-shell")).toHaveCount(0);
  await expect(water.locator(".mpr-water-column-unavailable")).toContainText("evidence withheld");
  await expect(page.locator("html")).toHaveAttribute("data-active-main-block","IO-003");
});