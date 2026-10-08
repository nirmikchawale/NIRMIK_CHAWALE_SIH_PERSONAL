import { expect, test } from "@playwright/test";
import { GLASS_THEMES, GLASS_THEME_STORAGE_KEY } from "../src/theme";

/**
 * MPR-16: evidence, not a mockup. A real browser cycles every canonical theme,
 * captures the Geographic and Water Column renderers, and checks UI contrast,
 * responsiveness, persistence, source identity and science-colour isolation.
 * Attachments are retained by the MPR-17 certification workflow.
 */
const PUBLIC_BASE = process.env.OCEANTWIN_LIVE_URL;
if (!PUBLIC_BASE) test.skip(true, "A genuine hosted frontend URL is required");

function luminance(hex: string) {
  const raw = hex.trim().replace("#", "");
  if (!/^[\da-f]{6}$/i.test(raw)) throw new Error("Unexpected non-hex theme token: "+hex);
  const v = [0,2,4].map(i => parseInt(raw.slice(i,i+2),16)/255)
    .map(x=>x<=0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4);
  return v[0]*0.2126+v[1]*0.7152+v[2]*0.0722;
}
function ratio(fg: string,bg: string) {
  const l1 = luminance(fg), l2 = luminance(bg);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
async function chooseTheme(page: import("@playwright/test").Page,label: string) {
  await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
  const gallery=page.getByRole("dialog",{name:"Glass appearance gallery"});
  await expect(gallery).toBeVisible();
  await gallery.getByRole("button",{name:new RegExp(label,"i")}).click();
  await expect(gallery).toBeHidden();
}
const sizes=[
 {name:"wide-desktop",width:1440,height:900},
 {name:"tablet",width:768,height:900},
 {name:"mobile",width:390,height:844}
] as const;

for(const size of sizes) {
 test("MPR-16 verified screenshots & science-safe 16-theme matrix: "+size.name,async({page},info)=>{
  test.setTimeout(15*60*1000);
  await page.setViewportSize(size);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(PUBLIC_BASE!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const geo=page.locator("#mpr-3d-stage");
  const water=page.getByTestId("mpr-12-water-column-section");
  const inspector=page.getByTestId("mpr-15-inspector-access");
  const legend=page.locator(".colorbar-interactive-track");
  const source=page.locator(".ocean-workbench");
  await expect(geo).toBeVisible();
  await expect(water).toBeVisible();
  await expect(inspector).toBeVisible();
  await expect(legend).toBeAttached();
  const baselineSource=await source.getAttribute("data-explore-source");
  const originalVariable=await water.getAttribute("data-linked-variable");
  const scientificGradient=await legend.evaluate(e=>getComputedStyle(e).backgroundImage);
  const initialKey=await water.getAttribute("data-native-time");
  const records: Array<{theme:string,scheme:string,textContrast:number,wide:number,scrollOverflow:number}> = [];
  for(const theme of GLASS_THEMES) {
    await chooseTheme(page,theme.label);
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme",theme.id);
    await expect(page.locator("html")).toHaveAttribute("data-theme",theme.scheme);
    await expect.poll(()=>page.evaluate(key=>localStorage.getItem(key),GLASS_THEME_STORAGE_KEY)).toBe(theme.id);
    const tokens=await page.evaluate(()=>{
      const style=getComputedStyle(document.documentElement);
      return {fg:style.getPropertyValue("--glass-text").trim(),bg:style.getPropertyValue("--glass-canvas").trim(),
        muted:style.getPropertyValue("--glass-muted").trim()};
    });
    const textContrast=ratio(tokens.fg,tokens.bg);
    expect(textContrast,"core text contrast for "+theme.label).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tokens.muted,tokens.bg),"muted guidance must remain legible: "+theme.label).toBeGreaterThanOrEqual(3);
    await expect(geo).toHaveAttribute("data-linked-variable",originalVariable??"thetao");
    await expect(water).toHaveAttribute("data-linked-variable",originalVariable??"thetao");
    await expect(water).toHaveAttribute("data-native-time",initialKey??"");
    await expect(source).toHaveAttribute("data-explore-source",baselineSource??"glorys");
    expect(await legend.evaluate(e=>getComputedStyle(e).backgroundImage),"scientific colour gradient changed with visual theme "+theme.label)
      .toBe(scientificGradient);
    const metrics=await page.evaluate(()=>{
      const doc=document.documentElement;
      return {overflow:doc.scrollWidth-doc.clientWidth,wide:doc.clientWidth};
    });
    expect(metrics.overflow,"horizontal overflow in "+theme.label+" at "+size.width).toBeLessThanOrEqual(2);
    await expect(geo).toBeVisible();
    await expect(water).toBeVisible();
    await expect(inspector).toBeVisible();
    const geoBox=await geo.boundingBox(),waterBox=await water.boundingBox();
    expect(geoBox).not.toBeNull();
    expect(waterBox).not.toBeNull();
    expect(waterBox!.y,"Water Column must follow actual Geographic section").toBeGreaterThanOrEqual(geoBox!.y+geoBox!.height-2);
    records.push({theme:theme.id,scheme:theme.scheme,textContrast,wide:metrics.wide,scrollOverflow:metrics.overflow});
    // Real renderer visual artifacts—not a generated image or fabricated ocean.
    await geo.scrollIntoViewIfNeeded();
    await info.attach(size.name+"--"+theme.id+"--geographic",{
      body:await geo.screenshot({animations:"disabled",timeout:25000}),contentType:"image/png"
    });
    await water.scrollIntoViewIfNeeded();
    await info.attach(size.name+"--"+theme.id+"--water-column",{
      body:await water.screenshot({animations:"disabled",timeout:25000}),contentType:"image/png"
    });
  }
  expect(records).toHaveLength(16);
  expect(new Set(records.map(x=>x.theme)).size).toBe(16);
  await info.attach(size.name+"--theme-acceptance.json",{
    body:Buffer.from(JSON.stringify({viewport:size,records,scientificGradient,source:baselineSource},null,2)),
    contentType:"application/json"
  });
 });
}
test("MPR-16 saved appearance survives hard navigation and cannot alter source palette",async({page})=>{
 await page.setViewportSize({width:320,height:760});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto(PUBLIC_BASE!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 await chooseTheme(page,"Cloud Prism");
 await expect(page.locator("html")).toHaveAttribute("data-glass-theme","cloud-prism");
 const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
 const legend=await page.locator(".colorbar-interactive-track").evaluate(el=>getComputedStyle(el).backgroundImage);
 await page.reload({waitUntil:"domcontentloaded"});
 await expect(page.locator("html")).toHaveAttribute("data-glass-theme","cloud-prism");
 await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source??"glorys");
 await expect(page.locator(".colorbar-interactive-track")).toHaveCSS("background-image",legend);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});
