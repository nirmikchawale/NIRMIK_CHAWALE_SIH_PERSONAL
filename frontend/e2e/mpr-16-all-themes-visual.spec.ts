import { expect, test } from "@playwright/test";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
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
  // Retain the actual Chromium screenshots on disk for artifact upload.
  // testInfo.attach({ body }) alone did not produce a reviewable 96-PNG archive.
  const evidenceDir = resolve(process.cwd(), "certification-evidence", "itm03-mpr16", "screenshots");
  await mkdir(evidenceDir, {recursive:true});
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
    // Cesium and WaterColumn3D repaint continuously. Element screenshots wait
    // for an impossible 'stable' renderer box on SwiftShader CI. Capture the
    // actual browser viewport after scrolling to each real renderer instead.
    // Native SwiftShader screenshot stalls can exceed 45 seconds at 1440px.
    // Preserve both authentic browser captures; avoid altering CSS animations
    // during the capture and allow a bounded 120-second Chromium deadline.
    await geo.scrollIntoViewIfNeeded();
    const geographicName = size.name+"--"+theme.id+"--geographic";
    const geographicPath = resolve(evidenceDir, geographicName+".png");
    await page.screenshot({path: geographicPath,animations:"allow",timeout:120000});
    await info.attach(geographicName,{path:geographicPath,contentType:"image/png"});
    // Show the genuine 3D canvas itself, not merely the Water Column heading or controls.
    // A screenshot without this visible surface does not certify the renderer.
    const columnCanvas = water.getByRole("application", { name: "Interactive scientific water-column 3D" });
    await expect(columnCanvas).toBeVisible();
    await columnCanvas.scrollIntoViewIfNeeded();
    const columnName = size.name+"--"+theme.id+"--water-column";
    const columnPath = resolve(evidenceDir,columnName+".png");
    await page.screenshot({path:columnPath,animations:"allow",timeout:120000});
    await info.attach(columnName,{path:columnPath,contentType:"image/png"});
  }
  expect(records).toHaveLength(16);
  expect(new Set(records.map(x=>x.theme)).size).toBe(16);
  await info.attach(size.name+"--theme-acceptance.json",{
    body:Buffer.from(JSON.stringify({viewport:size,records,scientificGradient,source:baselineSource},null,2)),
    contentType:"application/json"
  });
 });
}
// This check operates solely on PNG bytes produced by the real page.screenshot
// calls above. It never generates, replaces or alters a screenshot.
test.afterAll(async () => {
 const directory=resolve(process.cwd(),"certification-evidence","itm03-mpr16","screenshots");
 const viewports={"wide-desktop":[1440,900],"tablet":[768,900],"mobile":[390,844]} as const;
 const names=new Set(GLASS_THEMES.flatMap(t=>
  Object.keys(viewports).flatMap(v=>["geographic","water-column"].map(view=>v+"--"+t.id+"--"+view+".png"))));
 if(names.size!==96) throw new Error("Expected 16 distinct canonical themes x 3 viewports x 2 views");
 const available=await readdir(directory);
 const pngs=available.filter(name=>name.endsWith(".png"));
 if(pngs.length!==96||pngs.some(name=>!names.has(name)))
  throw new Error("MPR-16 missing or unexpected real PNG captures; found "+pngs.length);
 const hashes=new Set<string>();
 const entries=[] as Array<{filename:string;bytes:number;dimensions:number[];sha256:string}>;
 const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
 for(const filename of [...names].sort()){
  const bytes=await readFile(resolve(directory,filename));
  if(bytes.length<1024||!bytes.subarray(0,8).equals(pngSignature))
   throw new Error("Missing or truncated actual Chromium PNG: "+filename);
  const viewport=filename.split("--")[0] as keyof typeof viewports;
  const expected=viewports[viewport];
  if(!expected||bytes.readUInt32BE(16)!==expected[0]||bytes.readUInt32BE(20)!==expected[1])
   throw new Error("Unexpected real screenshot viewport pixels: "+filename);
  const sha256=createHash("sha256").update(bytes).digest("hex");
  if(hashes.has(sha256))throw new Error("Duplicate screenshot pixels: "+filename);
  hashes.add(sha256);
  entries.push({filename,bytes:bytes.length,dimensions:[expected[0],expected[1]],sha256});
 }
 await writeFile(resolve(directory,"..","ITM03_96_REAL_PNG_MANIFEST.json"),
  JSON.stringify({origin:"Playwright real page.screenshot",synthetic:false,count:entries.length,files:entries},null,2)+"\n");
});

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
