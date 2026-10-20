import { test, expect, type Page } from "@playwright/test";

const ORIGIN = process.env.OCEANTWIN_LIVE_URL;
async function openExplorer(page: Page, width: number) {
  if (!ORIGIN || !/^https?:\/\//.test(ORIGIN)) throw new Error("A real candidate URL is mandatory");
  await page.setViewportSize({width,height:width<=600?844:900});
  await page.goto(ORIGIN.replace(/#.*$/,"") + "#/explore",{waitUntil:"domcontentloaded"});
  await expect(page.getByTestId("mpr-04-workspace-mode-island")).toBeVisible({timeout:30_000});
}
test("Analysis Split has real separate 3D and analytical regions and exits without changing science",async({page})=>{
  await openExplorer(page,1440);
  const workbench=page.locator(".ocean-workbench");
  const science=await workbench.getAttribute("data-explore-source");
  const island=page.getByTestId("mpr-04-workspace-mode-island");
  await island.getByRole("button",{name:"Analysis Split workspace"}).click();
  await expect(workbench).toHaveAttribute("data-workspace-mode","analysis");
  const exit=island.getByTestId("exit-analysis-split");
  const restore=island.getByTestId("exit-hidden-controls");
  await expect(exit).toBeVisible();
  await expect(restore).toBeVisible();
  const stage=page.locator("#mpr-3d-stage"),panel=page.locator(".analysis-split-panel");
  await expect(stage).toBeVisible();
  await expect(panel).toBeVisible();
  const [s,p]=await Promise.all([stage.boundingBox(),panel.boundingBox()]);
  expect(s).not.toBeNull();expect(p).not.toBeNull();
  expect(s!.width).toBeGreaterThan(350);
  expect(p!.width).toBeGreaterThan(300);
  expect(p!.x).toBeGreaterThanOrEqual(s!.x+s!.width-2);
  const [islandBox,switchBox,focusBox]=await Promise.all([
    island.boundingBox(),island.locator(".mpr-workspace-mode-actions").boundingBox(),
    island.getByRole("button",{name:"Focus 3D"}).boundingBox()
  ]);
  expect(islandBox).not.toBeNull();expect(switchBox).not.toBeNull();expect(focusBox).not.toBeNull();
  expect(switchBox!.x+switchBox!.width).toBeLessThanOrEqual(islandBox!.x+islandBox!.width+2);
  expect(focusBox!.x+focusBox!.width).toBeLessThanOrEqual(islandBox!.x+islandBox!.width+2);
  await restore.click();
  await expect(workbench).toHaveAttribute("data-control-dock","open");
  await expect(workbench).toHaveAttribute("data-workspace-mode","analysis");
  await exit.click();
  await expect(workbench).toHaveAttribute("data-workspace-mode","explorer");
  await expect(workbench).toHaveAttribute("data-control-dock","open");
  await expect(workbench).toHaveAttribute("data-explore-source",science??"glorys");
});
test("Hidden controls can be exited independently of Explorer mode",async({page})=>{
  await openExplorer(page,1440);
  const workbench=page.locator(".ocean-workbench");
  await page.getByRole("button",{name:"Hide explorer controls"}).click();
  await expect(workbench).toHaveAttribute("data-control-dock","closed");
  await page.getByTestId("exit-hidden-controls").click();
  await expect(workbench).toHaveAttribute("data-control-dock","open");
  await expect(workbench).toHaveAttribute("data-workspace-mode","explorer");
});
test("Mobile Analysis Split stacks the actual source-backed panes with visible exit controls",async({page})=>{
  await openExplorer(page,390);
  const island=page.getByTestId("mpr-04-workspace-mode-island");
  await island.getByRole("button",{name:"Analysis Split workspace"}).click();
  await expect(island.getByTestId("exit-analysis-split")).toBeVisible();
  await expect(island.getByTestId("exit-hidden-controls")).toBeVisible();
  const [s,p]=await Promise.all([
    page.locator("#mpr-3d-stage").boundingBox(),
    page.locator(".analysis-split-panel").boundingBox()
  ]);
  expect(s).not.toBeNull();expect(p).not.toBeNull();
  expect(p!.y).toBeGreaterThanOrEqual(s!.y+s!.height-2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  await island.getByTestId("exit-analysis-split").click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode","explorer");
});
