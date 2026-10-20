import { expect, test, type Page } from "@playwright/test";

// UIX-02-E: source-native depth, geometry-only exaggeration and linked renderer
// acceptance. Real artifact and real React/Cesium/WaterColumn3D; no science mocks.
async function open(page: Page, width: number, pilot = false) {
  const live = process.env.OCEANTWIN_LIVE_URL;
  if (!live || !(live.startsWith("https://") || live.startsWith("http://"))) {
    throw new Error("UIX02-E requires an absolute OCEANTWIN_LIVE_URL");
  }
  const exploreUrl = live.replace(/#.*$/, "") + "#/explore";
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (pilot) {
    await page.addInitScript(() => localStorage.setItem("oceancanvas-active-main-block-v1", "IO-001"));
  }
  await page.goto(exploreUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("mpr-12-water-column-dock")).toBeVisible({ timeout: 60_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test("UIX02-E GLORYS native depth selector synchronizes Geographic and Water Column unchanged", async ({ page }) => {
  test.setTimeout(180_000);
  await open(page, 1440);
  const root = page.locator(".ocean-workbench");
  const water = page.getByTestId("mpr-12-water-column-section");
  const selector = water.getByRole("combobox", { name: "Water Column native depth level" });
  const geo = page.locator("#mpr-3d-stage");
  const source = await root.getAttribute("data-explore-source");
  const block = await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
  await expect(selector).toBeEnabled();
  await expect(water).toHaveAttribute("data-eligible", "true");
  const options = await selector.locator("option").allTextContents();
  expect(options.length).toBeGreaterThan(20);
  const native = options.map(v => Number.parseFloat(v));
  expect(native.every(Number.isFinite)).toBe(true);
  for (let i=1;i<native.length;i++) expect(native[i]).toBeGreaterThan(native[i-1]);
  const shell = water.locator(".water-column-shell:not(.water-column-loading)");
  await expect(shell).toBeVisible({ timeout: 90_000 });
  for (const idx of [0, 18, options.length - 1]) {
    await selector.selectOption(String(idx));
    await expect(selector).toHaveValue(String(idx));
    await expect.poll(async () => Number(await water.getAttribute("data-native-depth"))).toBeCloseTo(native[idx], 1);
    await expect(water.locator(".mpr-water-column-native-context")).toContainText(native[idx].toFixed(2) + " m");
    await expect(page.locator(".selected-depth-hero strong")).toContainText(native[idx].toFixed(2) + " m");
    await expect(shell.locator(".water-column-selected strong")).toContainText(native[idx].toFixed(2) + " m");
    await expect(geo).toHaveAttribute("data-linked-source", source ?? "glorys");
  }
  await expect(water).toHaveAttribute("data-linked-block", block ?? "BASE-GLORYS-001");
  console.log("UIX02E native GLORYS depth levels",options.length, "endpoints",native[0],native.at(-1));
});

test("UIX02-E vertical exaggeration changes display only, not source metres", async ({ page }) => {
  test.setTimeout(180_000);
  await open(page, 390);
  const water=page.getByTestId("mpr-12-water-column-section");
  const slider=water.getByRole("slider", { name: "Water Column vertical exaggeration" });
  const nativeDepth=await water.getAttribute("data-native-depth");
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const sel=water.getByRole("combobox", { name: "Water Column native depth level" });
  const selectedIndex=await sel.inputValue();
  const shell=water.locator(".water-column-shell:not(.water-column-loading)");
  await expect(shell).toBeVisible({timeout:90_000});
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("1");
  await expect(shell).toContainText("visual depth ×1");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await expect(shell).toContainText("visual depth ×100");
  await expect(sel).toHaveValue(selectedIndex);
  await expect(water).toHaveAttribute("data-native-depth", nativeDepth ?? "0");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source || "glorys");
  await expect(water.getByRole("definition").filter({hasText:"m"}).first()).toBeVisible();
  console.log("UIX02E original depth unchanged through 1x and 100x",nativeDepth);
});

test("UIX02-E source-backed pilot retains all 31 native depths in both controls", async ({ page }) => {
  test.setTimeout(180_000);
  await open(page, 1440, true);
  const context=page.getByTestId("scientific-context-bar");
  await expect(context).toHaveAttribute("data-block-id", "IO-001", {timeout:40_000});
  await expect(page.locator(".depth-controller-meta")).toContainText("31 verified levels");
  const water=page.getByTestId("mpr-12-water-column-section");
  const sel=water.getByRole("combobox", {name:"Water Column native depth level"});
  await expect(sel.locator("option")).toHaveCount(31);
  const shell=water.locator(".water-column-shell:not(.planned-main-block-shell):not(.water-column-loading)");
  await expect(shell).toHaveAttribute("data-depth-count","31",{timeout:90_000});
  await expect(shell).toHaveAttribute("data-main-block-id","IO-001");
  const depth=sel.locator("option").nth(30);
  const deep=Number.parseFloat(await depth.textContent()??"");
  expect(deep).toBeCloseTo(453.937714,1);
  await sel.selectOption("30");
  await expect(water).toHaveAttribute("data-native-depth",/453\.937/);
  await expect(shell.locator(".water-column-selected strong")).toContainText("453.94 m");
  await expect(page.locator(".selected-depth-hero strong")).toContainText("453.94 m");
  console.log("UIX02E pilot 31 true levels, last",deep);
});

test("UIX02-E satellite chlorophyll never invents subsurface geometry", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, 1440);
  const source=page.getByTestId("mpr-06-ocean-intelligence")
    .getByRole("button",{name:"INCOIS chlorophyll"});
  await expect(source).toBeVisible();
  await expect(source).toBeEnabled({timeout:30_000});
  await source.click();
  const root=page.locator(".ocean-workbench");
  const water=page.getByTestId("mpr-12-water-column-section");
  await expect(root).toHaveAttribute("data-explore-source","chlorophyll");
  await expect(water).toHaveAttribute("data-eligible","false");
  await expect(water.getByRole("combobox",{name:"Water Column native depth level"})).toBeDisabled();
  await expect(water.locator(".water-column-canvas")).toHaveCount(0);
  await expect(water).toContainText("surface-only");
  await expect(page.getByRole("button",{name:"Switch to Water Column 3D"})).toBeDisabled();
});

test("UIX02-E Geographic controls drive native Water Column depth and visual geometry", async ({ page }) => {
  test.setTimeout(180_000);
  await open(page, 1440);
  const root=page.locator(".ocean-workbench");
  const water=page.getByTestId("mpr-12-water-column-section");
  const shell=water.locator(".water-column-shell:not(.water-column-loading)");
  const source=await root.getAttribute("data-explore-source");
  const block=await page.getByTestId("scientific-context-bar").getAttribute("data-block-id");
  await expect(shell).toBeVisible({timeout:90_000});
  if (await root.getAttribute("data-control-dock") === "closed") {
    await page.getByRole("button",{name:"Show explorer controls"}).click();
  }
  const geoDepth=page.locator('.control-panel input[aria-label="Model depth"]');
  await expect(geoDepth).toBeVisible();
  const waterDepth=water.getByRole("combobox",{name:"Water Column native depth level"});
  await geoDepth.focus();
  await page.keyboard.press("End");
  await expect(waterDepth).toHaveValue("30");
  await expect.poll(async()=>Number(await water.getAttribute("data-native-depth"))).toBeGreaterThan(450);
  await expect(shell.locator(".water-column-selected strong")).toContainText("453.94 m");
  await geoDepth.focus();
  await page.keyboard.press("Home");
  await expect(waterDepth).toHaveValue("0");
  await expect(shell.locator(".water-column-selected strong")).toContainText("0.49 m");

  const settings=page.locator(".control-panel details.advanced-control-group")
    .filter({hasText:"View settings"}).first();
  if (!(await settings.evaluate(el=>el.hasAttribute("open")))) await settings.locator("summary").click();
  const geoVertical=settings.getByRole("slider",{name:/Visual vertical exaggeration/});
  await expect(geoVertical).toBeVisible();
  await geoVertical.focus();
  await page.keyboard.press("End");
  await expect(geoVertical).toHaveValue("100");
  await expect(water.getByRole("slider",{name:"Water Column vertical exaggeration"})).toHaveValue("100");
  await expect(shell).toContainText("visual depth ×100");
  await expect(waterDepth).toHaveValue("0");
  await expect(root).toHaveAttribute("data-explore-source",source||"glorys");
  await expect(water).toHaveAttribute("data-linked-block",block||"BASE-GLORYS-001");
  console.log("UIX02E Geographic -> Water Column: 453.94 to 0.49m, geometry 100x, science unchanged");
});
