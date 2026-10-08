import { expect, test } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");
for (const width of [1440, 1024, 390, 320]) {
  test("MPR-08 evidence and QC reachable from Ocean Intelligence at " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    const source = page.getByTestId("mpr-06-ocean-intelligence");
    const hub = source.getByTestId("mpr-08-evidence-hub");
    const block = source.getByTestId("mpr-07-active-main-block");
    const quickLinks = source.getByRole("navigation", { name: "Scientific workflow actions" });
    await expect(hub).toBeVisible();
    const [a,b,c] = await Promise.all([block.boundingBox(),hub.boundingBox(),quickLinks.boundingBox()]);
    expect(a && b && c).toBeTruthy();
    expect(a!.y+a!.height).toBeLessThan(b!.y);
    expect(b!.y+b!.height).toBeLessThan(c!.y);
    await expect(page.locator(".evidence-status-pill")).toHaveCount(0);
    await expect(page.locator(".header-workspace-actions").getByRole("button", { name: "Sources & QC" })).toHaveCount(0);
    const currentSource = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
    await hub.getByRole("button", { name: "Open Ocean Intelligence evidence inspector" }).click();
    await expect(page.getByRole("complementary", { name: "Ocean data telemetry" })).toHaveAttribute("data-open","true");
    await page.getByRole("button", { name: "Close evidence inspector" }).click();
    await expect(page.getByRole("complementary", { name: "Ocean data telemetry" })).toHaveAttribute("data-open","false");
    await hub.getByRole("button", { name: "Sources & QC" }).click();
    await expect(page.getByRole("complementary", { name: "Scientific provenance and quality control" })).toBeVisible();
    await page.getByRole("button", { name: "Close provenance drawer" }).click();
    await expect(page.getByRole("complementary", { name: "Scientific provenance and quality control" })).toHaveCount(0);
    await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",currentSource || "glorys");
    expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  });
}
test("MPR-08 hub inherits sixteen current themes without changing scientific source", async ({ page }) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto(live!);
  expect(GLASS_THEMES).toHaveLength(16);
  const hub = page.getByTestId("mpr-08-evidence-hub");
  const source = await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  for(const theme of GLASS_THEMES){
    await page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/}).click();
    await page.getByRole("dialog",{name:"Glass appearance gallery"})
      .getByRole("button",{name:new RegExp(theme.label)}).click();
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme",theme.id);
    const bg=await hub.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source || "glorys");
  }
});
