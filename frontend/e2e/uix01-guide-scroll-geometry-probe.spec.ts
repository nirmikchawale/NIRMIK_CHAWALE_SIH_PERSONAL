import { expect, test } from "@playwright/test";

test("UIX-01 inspect actual judge-guide scroll ownership at desktop width", async ({ page }) => {
  test.setTimeout(90_000);
  const base = process.env.OCEANTWIN_LIVE_URL;
  expect(base, "OCEANTWIN_LIVE_URL must be set").toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("mpr-block-details-workspace")).toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.getByRole("button", { name: "Present demo" }).click();
  await expect(page.getByTestId("presentation-guide")).toBeVisible();

  const geometry = () => page.evaluate(() => {
    const detail = (selector: string) => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) return { selector, missing: true };
      const rect = node.getBoundingClientRect();
      const css = getComputedStyle(node);
      return {
        selector, scrollTop: node.scrollTop, scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight, overflowY: css.overflowY,
        height: css.height, display: css.display, position: css.position,
        rect: { top: rect.top, bottom: rect.bottom, height: rect.height }
      };
    };
    return {
      pageY: window.scrollY,
      root: detail(".ocean-workbench"),
      workspaceFrame: detail(".workspace-frame"),
      workspace: detail(".workspace[data-judge-guide='open']"),
      station: detail(".station-workspace"),
      guide: detail(".presentation-guide"),
      geographic: detail("#mpr-3d-stage"),
      water: detail("#mpr-water-column-section"),
      selected: document.querySelector("#mpr-3d-stage")?.getAttribute("data-visualization-mode")
    };
  });
  const before = await geometry();
  await page.locator("#mpr-water-column-section").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.waitForTimeout(400);
  const after = await geometry();
  console.log("UIX01_GUIDE_GEOMETRY=" + JSON.stringify({ before, after }));
});
