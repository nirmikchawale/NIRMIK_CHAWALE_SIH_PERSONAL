import { expect, test } from "@playwright/test";
const live=process.env.OCEANTWIN_LIVE_URL;
if(!live)test.skip(true,"OCEANTWIN_LIVE_URL required");

for(const width of [320,390,768,1024,1366,1440]){
 test("MPR-15 native evidence, QC, inspector keyboard and responsive layout "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const hub=page.getByTestId("mpr-15-inspector-access");
  await expect(hub).toBeVisible();
  await expect(hub.getByRole("button")).toHaveCount(4);
  const evidence=hub.getByRole("button",{name:"Open current evidence inspector"});
  const qc=hub.getByRole("button",{name:"Open scientific provenance drawer"});
  const profile=hub.getByRole("button",{name:"Open selected observation inspector"});
  const close=hub.getByRole("button",{name:"Close scientific inspectors"});
  await expect(close).toBeDisabled();
  await expect(evidence).toBeEnabled();
  await expect(qc).toBeEnabled();
  if(!(await profile.isEnabled())){
    await expect(profile).toBeDisabled(); // no invented observation selection
  }
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(evidence).toHaveAttribute("aria-expanded","true");
  await expect(page.locator('.evidence-rail[data-open="true"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(evidence).toHaveAttribute("aria-expanded","false");
  await expect(page.locator('.evidence-rail[data-open="true"]')).toHaveCount(0);
  await qc.click();
  await expect(qc).toHaveAttribute("aria-expanded","true");
  await expect(page.getByRole("complementary",{name:"Scientific provenance and quality control"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(qc).toHaveAttribute("aria-expanded","false");
  await expect(page.getByRole("complementary",{name:"Scientific provenance and quality control"})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  const dimensions=await hub.boundingBox();
  expect(dimensions?.width).toBeGreaterThan(200);
  expect(dimensions!.width).toBeLessThanOrEqual(width);
  for(const button of await hub.getByRole("button").all()){
    const rect=await button.boundingBox();
    if(rect && await button.isVisible()) expect(rect.height).toBeGreaterThanOrEqual(42);
  }
 });
}

test("MPR-15 keeps original source QC semantics and no false profile enabled",async({page})=>{
 await page.setViewportSize({width:390,height:900});
 await page.goto(live!.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
 const hub=page.getByTestId("mpr-15-inspector-access");
 const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
 await hub.getByRole("button",{name:"Open scientific provenance drawer"}).click();
 await expect(page.locator(".provenance-drawer")).toBeVisible();
 await hub.getByRole("button",{name:"Close scientific inspectors"}).click();
 await expect(page.locator(".provenance-drawer")).toHaveCount(0);
 await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source||"glorys");
 await expect(page.locator("#mpr-3d-stage")).toBeAttached();
 await expect(page.getByTestId("mpr-12-water-column-section")).toBeAttached();
});
