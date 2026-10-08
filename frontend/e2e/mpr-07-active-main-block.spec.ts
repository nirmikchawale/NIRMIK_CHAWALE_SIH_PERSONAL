import { expect, test } from "@playwright/test";

const live = process.env.OCEANTWIN_LIVE_URL;
if (!live) test.skip(true, "OCEANTWIN_LIVE_URL required");

for (const width of [1440, 1024, 390, 320]) {
  test("MPR-07 expandable Active Main Block follows real source cards at " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
    const source = page.getByTestId("mpr-06-ocean-intelligence");
    const choices = source.locator(".source-workbench-choices");
    const block = source.getByTestId("mpr-07-active-main-block");
    const actions = source.getByRole("navigation", { name: "Scientific workflow actions" });
    await expect(block).toBeVisible();
    await expect(block.locator("summary")).toContainText("ACTIVE MAIN BLOCK");
    await expect(block).toHaveAttribute("data-block-id", /.+/);
    await expect(block).toHaveAttribute("data-materialization", /^(planned|pilot|verified-baseline)$/);
    const [a, b, c] = await Promise.all([choices.boundingBox(), block.boundingBox(), actions.boundingBox()]);
    expect(a && b && c).toBeTruthy();
    expect(a!.y + a!.height).toBeLessThan(b!.y);
    expect(b!.y + b!.height).toBeLessThan(c!.y);
    await block.locator("summary").click();
    await expect(block).toHaveAttribute("open", "");
    const fields = block.getByRole("term");
    await expect(fields).toHaveCount(8);
    await expect(block.getByRole("combobox", { name: "Active Main Block selector" })).toBeVisible();
    await expect(block.getByRole("button", { name: "Previous materialized main block" })).toBeVisible();
    await expect(block.getByRole("button", { name: "Next materialized main block" })).toBeVisible();
    await expect(block.getByRole("button", { name: "Copy active main block context link" })).toBeVisible();
    const header = page.getByTestId("scientific-context-bar");
    await expect(header).toHaveAttribute("data-block-id", await block.getAttribute("data-block-id") || "");
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )).toBeLessThanOrEqual(2);
  });
}

test("MPR-07 materialized block navigation updates canonical shared context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(live!.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const block = page.getByTestId("mpr-07-active-main-block");
  await block.locator("summary").click();
  const selector = block.getByRole("combobox", { name: "Active Main Block selector" });
  const initial = await block.getAttribute("data-block-id");
  const options = await selector.locator("option:not(:disabled)").evaluateAll(nodes =>
    nodes.map(node => (node as HTMLOptionElement).value)
  );
  expect(options.length).toBeGreaterThan(1);
  const next = options.find(id => id !== initial);
  expect(next).toBeTruthy();
  await selector.selectOption(next!);
  await expect(block).toHaveAttribute("data-block-id", next!);
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", next!);
  await expect(block.locator("dt").filter({ hasText: "Scientific source" })).toBeVisible();
});
