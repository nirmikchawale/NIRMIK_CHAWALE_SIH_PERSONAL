import { expect, test, type Page } from "@playwright/test";
import { GLASS_THEMES } from "../src/theme";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;
const labels = [
  "Overview", "Workspace", "Block System", "Scene Controls",
  "Variables", "Display Range", "Depth & Section", "Time",
  "Observations", "Render Quality", "Context & Info"
] as const;

async function openExplorer(page: Page) {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for MPR-05 verification.");
  await page.goto(liveUrl.replace(/#.*$/, "") + "#/explore", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench[data-page='explore']")).toBeVisible();
}

for (const width of [1440, 1024, 390, 320]) {
  test(`MPR-05 continuous 11-item directory at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openExplorer(page);
    const islands = page.getByTestId("explorer-landing-islands");
    const directory = islands.getByTestId("rui-nav-02-explorer-directory");
    const track = directory.getByRole("navigation", { name: "3D Explorer feature directory" });
    const items = track.locator("button[data-explorer-directory]");
    await expect(items).toHaveCount(11);
    await expect(directory.getByText("Feature directory")).toBeVisible();
    await expect(directory.locator(".mpr-directory-announcement")).toBeAttached();
    for (const name of labels) {
      await expect(track.getByRole("button", { name, exact: true })).toHaveCount(1);
    }
    const geometry = await track.evaluate(node => {
      const style = getComputedStyle(node);
      const bounds = node.getBoundingClientRect();
      return {
        overflowX: style.overflowX,
        snap: style.scrollSnapType,
        availableScroll: node.scrollWidth - node.clientWidth,
        width: bounds.width,
        rootWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth
      };
    });
    expect(geometry.overflowX).toBe("auto");
    expect(geometry.snap).toContain("x");
    expect(geometry.availableScroll).toBeGreaterThan(100);
    expect(geometry.width).toBeGreaterThan(200);
    expect(geometry.rootWidth).toBeLessThanOrEqual(geometry.viewportWidth + 2);

    const boxes = await Promise.all([
      islands.getByTestId("mpr-04-workspace-mode-island").boundingBox(),
      directory.boundingBox(),
      islands.getByRole("region", { name: "Scientific source workspace" }).boundingBox()
    ]);
    expect(boxes[0]).not.toBeNull();
    expect(boxes[1]).not.toBeNull();
    expect(boxes[2]).not.toBeNull();
    expect(boxes[0]!.y + boxes[0]!.height).toBeLessThan(boxes[1]!.y - 10);
    expect(boxes[1]!.y + boxes[1]!.height).toBeLessThan(boxes[2]!.y - 10);

    await items.first().focus();
    await page.keyboard.press("End");
    await expect(items.last()).toBeFocused();
    await expect.poll(() => track.evaluate(node => node.scrollLeft)).toBeGreaterThan(100);
    await page.keyboard.press("Home");
    await expect(items.first()).toBeFocused();
    await expect.poll(() => track.evaluate(node => node.scrollLeft)).toBeLessThan(40);
    await page.keyboard.press("ArrowRight");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(items.first()).toBeFocused();
  });
}

test("MPR-05 selects real Block System and Context targets without changing ocean source", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExplorer(page);
  const shell = page.locator(".ocean-workbench");
  const initial = await shell.getAttribute("data-explore-source");
  const directory = page.getByRole("navigation", { name: "3D Explorer feature directory" });
  const block = page.getByTestId("rui-nav-02-block-system");
  const source = page.getByRole("region", { name: "Scientific source workspace" });
  await directory.getByRole("button", { name: "Block System" }).click();
  await expect(block).toBeInViewport({ ratio: 0.1 });
  await directory.getByRole("button", { name: "Context & Info" }).click();
  await expect(source).toBeInViewport({ ratio: 0.1 });
  await expect(shell).toHaveAttribute("data-explore-source", initial || "glorys");
  await expect(page.locator(".mpr-directory-announcement")).toBeEmpty();
});

test("MPR-05 all sixteen glass themes share one feature directory, without changing its labels or selection", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExplorer(page);
  const directory = page.getByTestId("rui-nav-02-explorer-directory");
  const first = directory.getByRole("button", { name: "Overview" });
  const shell = page.locator(".ocean-workbench");
  const source = await shell.getAttribute("data-explore-source");
  expect(GLASS_THEMES).toHaveLength(16);
  for (const theme of GLASS_THEMES) {
    await page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ }).click();
    await page.getByRole("dialog", { name: "Glass appearance gallery" })
      .getByRole("button", { name: new RegExp(theme.label) }).click();
    await expect(page.locator("html")).toHaveAttribute("data-glass-theme", theme.id);
    const tokens = await first.evaluate(node => {
      const css = getComputedStyle(node);
      const root = getComputedStyle(node.closest(".ocean-workbench")!);
      return {
        radius: Number.parseFloat(css.borderTopLeftRadius),
        focusColor: root.getPropertyValue("--mpr-focus").trim(),
        activeAccent: root.getPropertyValue("--mpr-accent").trim(),
        border: css.borderTopWidth
      };
    });
    expect(tokens.radius).toBeGreaterThanOrEqual(11);
    expect(tokens.focusColor).toBe(tokens.activeAccent);
    expect(tokens.border).not.toBe("0px");
    await expect(directory.getByRole("navigation", { name: "3D Explorer feature directory" })
      .locator("button[data-explorer-directory]")).toHaveCount(11);
    await expect(shell).toHaveAttribute("data-explore-source", source || "glorys");
  }
});
