import { expect, test, type Page } from "@playwright/test";
const live=process.env.OCEANTWIN_LIVE_URL;
async function open(page: Page, width: number) {
  if (!live?.startsWith("https://")) throw new Error("Requires actual published HTTPS URL");
  await page.setViewportSize({width,height:width < 700?844:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(live.replace(/#.*$/, "")+"#/explore",{waitUntil:"domcontentloaded"});
  const island=page.getByTestId("mpr-04-workspace-mode-island");
  await expect(island).toBeVisible({timeout:60_000});
  const skip=page.getByRole("button",{name:"Skip journey"});
  if(await skip.isVisible().catch(()=>false)) await skip.click();
}
test("mobile header restores actual control sheet, not only open attribute",async({page})=>{
  test.setTimeout(120_000);
  await open(page,390);
  const root=page.locator(".ocean-workbench");
  const controls=page.getByRole("complementary",{name:"Scientific explorer controls"});
  await page.getByRole("button",{name:"Hide explorer controls"}).click();
  await expect(root).toHaveAttribute("data-control-dock","closed");
  await page.getByRole("button",{name:"Show explorer controls"}).click();
  await expect(root).toHaveAttribute("data-control-dock","open");
  await expect(controls).toHaveAttribute("data-mobile-open","true");
  await expect(controls).toBeVisible();
});
test("desktop Exit hidden controls reveals its real panel in viewport",async({page})=>{
  test.setTimeout(120_000);
  await open(page,1440);
  const root=page.locator(".ocean-workbench");
  const source=await root.getAttribute("data-explore-source");
  await page.getByRole("button",{name:"Hide explorer controls"}).click();
  await expect(root).toHaveAttribute("data-control-dock","closed");
  await page.getByTestId("exit-hidden-controls").click();
  await expect(root).toHaveAttribute("data-control-dock","open");
  const panel=page.getByRole("complementary",{name:"Scientific explorer controls"});
  const box=await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y,"restored real controls must be in viewport").toBeLessThan(880);
  await expect(root).toHaveAttribute("data-explore-source",source||"glorys");
});
