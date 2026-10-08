import { expect, test } from "@playwright/test";

type BoundingBox = { x: number; y: number; width: number; height: number };

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

function intersects(first: BoundingBox, second: BoundingBox) {
  return first.x < second.x + second.width - 1 &&
    first.x + first.width > second.x + 1 &&
    first.y < second.y + second.height - 1 &&
    first.y + first.height > second.y + 1;
}

test("Explorer directory and Ocean Intelligence own separate scrolling rows with three independent source cards", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const islands = page.getByTestId("explorer-landing-islands");
  const directory = page.getByTestId("rui-nav-02-explorer-directory");
  await expect(islands.locator(":scope > .mpr-workspace-mode-island")).toHaveCount(1);
  await expect(islands.locator(":scope > .explorer-directory-shell")).toHaveCount(1);
  await expect(islands.locator(":scope > .source-workbench")).toHaveCount(1);
  await expect(islands.locator(":scope > *")).toHaveCount(2);
  const source = page.getByRole("region", { name: "Scientific source workspace" });
  const cards = [
    page.getByRole("button", { name: "GLORYS baseline" }),
    page.getByRole("button", { name: "INCOIS multi-time" }),
    page.getByRole("button", { name: "INCOIS chlorophyll" })
  ];
  await expect(directory).toBeVisible();
  await expect(source.getByRole("heading", { name: "Choose your ocean." })).toBeVisible();

  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(directory).toBeVisible();
    await expect(source).toBeVisible();
    const islandsBox = await islands.boundingBox();
    const directoryBox = await directory.boundingBox();
    const sourceBox = await source.boundingBox();
    const titleBox = await source.locator(".source-workbench-title").boundingBox();
    const actionsBox = await source.locator(".source-workbench-actions").boundingBox();
    expect(islandsBox).not.toBeNull();
    expect(directoryBox).not.toBeNull();
    expect(sourceBox).not.toBeNull();
    // The islands themselves form a real flex-column: neither can escape its
    // parent's intrinsic height or occupy the other's vertical interval.
    await expect(islands).toHaveCSS("flex-direction", "column");
    expect(directoryBox!.y).toBeGreaterThanOrEqual(islandsBox!.y - 1);
    expect(sourceBox!.y + sourceBox!.height).toBeLessThanOrEqual(
      islandsBox!.y + islandsBox!.height + 1
    );
    expect(titleBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    const modeBox = await islands.getByTestId("mpr-04-workspace-mode-island").boundingBox();
    expect(modeBox).not.toBeNull();
    expect(modeBox!.y + modeBox!.height).toBeLessThanOrEqual(directoryBox!.y - 15);
    expect(directoryBox!.y + directoryBox!.height).toBeLessThanOrEqual(sourceBox!.y - 15);
    expect(titleBox!.y).toBeGreaterThanOrEqual(sourceBox!.y - 1);

    const boxes: BoundingBox[] = [];
    for (const card of cards) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(sourceBox!.x - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(sourceBox!.x + sourceBox!.width + 1);
      expect(box!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height + 2);
      expect(box!.y + box!.height).toBeLessThanOrEqual(sourceBox!.y + sourceBox!.height + 1);
      boxes.push(box!);
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(intersects(boxes[i], boxes[j])).toBe(false);
      }
    }
    expect(actionsBox!.y).toBeGreaterThanOrEqual(Math.max(...boxes.map((box) => box.y + box.height)) + 2);

    // MPR-02 moves the Explorer scroll owner from the nested station
    // to its app shell so the header and source islands scroll together.
    const scroller = page.locator(".ocean-workbench[data-page='explore']");
    await scroller.evaluate((element) => { element.scrollTop = 0; });
    const before = await source.boundingBox();
    const travel = await scroller.evaluate((element) => {
      element.scrollTop = 180;
      return element.scrollTop;
    });
    expect(travel).toBeGreaterThan(100);
    const after = await source.boundingBox();
    expect(after!.y).toBeLessThan(before!.y - 80);
    await expect(page.locator(".station-workspace")).toHaveCSS("overflow-y", "visible");
    await scroller.evaluate((element) => { element.scrollTop = 0; });
  }
});

test("independent Explorer island controls preserve workspace navigation and source interaction", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  const islands = page.getByTestId("explorer-landing-islands");
  const directory = islands.getByTestId("rui-nav-02-explorer-directory");
  const sources = islands.getByRole("region", { name: "Scientific source workspace" });
  await expect(directory).toBeVisible();
  await expect(sources).toBeVisible();

  const modeIsland = islands.getByTestId("mpr-04-workspace-mode-island");
  await expect(modeIsland).toBeVisible();
  const workspace = modeIsland.getByRole("group", { name: "Explorer workspace mode" });
  await workspace.getByRole("button", { name: "Analysis Split workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "analysis");
  await expect(sources).toBeVisible();
  await workspace.getByRole("button", { name: "Explorer workspace" }).click();
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-workspace-mode", "explorer");
  await expect(sources.getByRole("button", { name: "GLORYS baseline" })).toHaveAttribute("aria-pressed", "true");
  await expect(directory.getByRole("navigation", { name: "3D Explorer feature directory" })).toBeVisible();
});
