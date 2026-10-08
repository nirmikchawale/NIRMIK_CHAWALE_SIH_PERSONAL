import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  MAIN_BLOCK_LOD_VERSION,
  globePilotLodBudget,
  nativeDepthBalancedLodIndices,
  waterColumnPilotLodBudget
} from "../src/main-block-lod";

interface SourcePilot {
  block_id: string;
  time: string;
  shape: { depth: number; latitude: number; longitude: number };
  coordinates: { longitude: number[]; latitude: number[]; depth_m: number[] };
  variables: { thetao: { values: Array<number | null> } };
}
const source = JSON.parse(readFileSync(
  new URL("../public/main-blocks/data/IO-001/2004-03-15.json", import.meta.url), "utf8"
)) as SourcePilot;

function nativePoints() {
  const result: Array<[number, number, number, number]> = [];
  const { latitude, longitude, depth_m } = source.coordinates;
  for (let d = 0; d < depth_m.length; d++) {
    for (let y = 0; y < latitude.length; y++) {
      for (let x = 0; x < longitude.length; x++) {
        const i = d * latitude.length * longitude.length + y * longitude.length + x;
        const value = source.variables.thetao.values[i];
        if (typeof value === "number" && Number.isFinite(value)) {
          result.push([longitude[x], latitude[y], depth_m[d], value]);
        }
      }
    }
  }
  return result;
}

test("3DB-12 depth-balanced LOD selects only exact source tuples across every native depth", () => {
  expect(MAIN_BLOCK_LOD_VERSION).toBe("3db-12-v1");
  expect(source.block_id).toBe("IO-001");
  const raw = nativePoints();
  const immutable = JSON.stringify(raw);
  expect(raw.length).toBeGreaterThan(1800);
  const focus = source.coordinates.depth_m[18];
  const indices = nativeDepthBalancedLodIndices(raw, 1800, focus);
  expect(indices.length).toBeLessThanOrEqual(1800);
  expect(indices.length).toBeGreaterThan(0);
  expect(new Set(indices).size).toBe(indices.length);
  expect(indices.every((index, i) => Number.isInteger(index) &&
    index >= 0 && index < raw.length && (i === 0 || indices[i - 1] < index))).toBe(true);
  const sampledDepths = new Set(indices.map((index) => raw[index][2]));
  expect(sampledDepths).toEqual(new Set(raw.map((row) => row[2])));
  const expectedFocusCount = raw.filter((row) => row[2] === focus).length;
  expect(indices.filter((index) => raw[index][2] === focus)).toHaveLength(expectedFocusCount);
  // Rendering selections must never mutate the original measurements.
  expect(JSON.stringify(raw)).toBe(immutable);
});

test("3DB-12 LOD budgets are bounded, deterministic, and reject invalid budgets", () => {
  expect([globePilotLodBudget(5_000_000), globePilotLodBudget(1_200_000), globePilotLodBudget(150_000)])
    .toEqual([1200, 2600, 5000]);
  expect([waterColumnPilotLodBudget(0.7), waterColumnPilotLodBudget(1), waterColumnPilotLodBudget(1.6)])
    .toEqual([1800, 3200, 5200]);
  const raw = nativePoints();
  expect(nativeDepthBalancedLodIndices(raw, 2600)).toEqual(nativeDepthBalancedLodIndices(raw, 2600));
  expect(nativeDepthBalancedLodIndices(raw, raw.length)).toEqual(raw.map((_point, index) => index));
  expect(() => nativeDepthBalancedLodIndices(raw, 0)).toThrow(/positive integer/);
  expect(() => nativeDepthBalancedLodIndices(raw, 1.3)).toThrow(/positive integer/);
});

test("3DB-12 live pilot Water Column advertises source-versus-rendered sample count", async ({ page }) => {
  test.setTimeout(180_000);
  const liveUrl = process.env.OCEANTWIN_LIVE_URL;
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-12 browser verification.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("oceancanvas-active-main-block-v1", "IO-001"));
  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });
  const openWaterColumn = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(openWaterColumn).toBeEnabled({ timeout: 30_000 });
  await openWaterColumn.click();
  const shell = page.locator(".water-column-shell:not(.planned-main-block-shell):not(.water-column-loading)");
  await expect(shell).toHaveAttribute("data-main-block-id", "IO-001", { timeout: 30_000 });
  await expect(shell).toHaveAttribute("data-depth-count", "31");
  await expect(shell).toHaveAttribute("data-lod-mode", "native-depth-balanced");
  const stats = await shell.evaluate((element) => ({
    rendered: Number(element.getAttribute("data-lod-rendered-samples")),
    source: Number(element.getAttribute("data-lod-source-samples"))
  }));
  expect(stats.source).toBeGreaterThan(stats.rendered);
  expect(stats.rendered).toBeGreaterThan(0);
  expect(stats.rendered).toBeLessThanOrEqual(5200);
  expect(errors).toEqual([]);
});
