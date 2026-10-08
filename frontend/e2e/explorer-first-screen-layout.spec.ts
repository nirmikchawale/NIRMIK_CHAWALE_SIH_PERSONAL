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
  const directory = page.getByTestId("rui-nav-02-explorer-directory");
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
    const directoryBox = await directory.boundingBox();
    const sourceBox = await source.boundingBox();
    const titleBox = await source.locator(".source-workbench-title").boundingBox();
    const actionsBox = await source.locator(".source-workbench-actions").boundingBox();
    expect(directoryBox).not.toBeNull();
    expect(sourceBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(directoryBox!.y + directoryBox!.height).toBeLessThanOrEqual(sourceBox!.y - 5);
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

    // Confirm scrolling moves the whole source section, rather than leaving it
    // pinned over the 3D Explorer directory or the visualization.
    const scroller = page.locator(".station-workspace");
    await scroller.evaluate((element) => { element.scrollTop = 0; });
    const before = await source.boundingBox();
    const travel = await scroller.evaluate((element) => {
      element.scrollTop = 180;
      return element.scrollTop;
    });
    expect(travel).toBeGreaterThan(100);
    const after = await source.boundingBox();
    expect(after!.y).toBeLessThan(before!.y - 80);
    await scroller.evaluate((element) => { element.scrollTop = 0; });
  }
});
