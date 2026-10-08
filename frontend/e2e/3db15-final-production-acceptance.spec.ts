import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { deriveMainBlockCapabilities } from "../src/main-block-capabilities";
import { resolveMainBlock } from "../src/main-block-runtime";

const report = JSON.parse(readFileSync(
  new URL("../public/main-blocks/capability-audit.json", import.meta.url), "utf8"
));

interface AuditedBlock {
  id: string;
  materialized: boolean;
  sourceSha256VerifiedByAudit: boolean;
  cesiumContractReady: boolean;
  waterColumnContractReady: boolean;
  individualProduction3DRenderProven: boolean;
  independentModelObservationValidated: boolean;
  availableDates: string[];
  availableVariables: string[];
  sourcePayloads: Array<{ date: string; path: string; sha256: string }>;
}

const blocks = report.blocks as AuditedBlock[];
const pilots = blocks.filter((block) => block.materialized);
const locked = blocks.filter((block) => !block.materialized);

test("3DB-15 accepts only canonical source-backed render contracts; missing blocks remain locked", () => {
  expect(report.summary).toMatchObject({
    logicalBlocks: 140, sourceBackedPilots: 35, plannedBlocks: 105,
    multiDatePilots: 6, sourcePayloadFrames: 41, landBlocksMaterialized: 0,
    independentlyObservationValidatedPilots: 0
  });
  expect(blocks).toHaveLength(140);
  expect(new Set(blocks.map((block) => block.id)).size).toBe(140);
  expect(pilots).toHaveLength(35);
  expect(locked).toHaveLength(105);
  expect(pilots.reduce((count, block) => count + block.sourcePayloads.length, 0)).toBe(41);
  for (const block of pilots) {
    const runtime = deriveMainBlockCapabilities(resolveMainBlock(block.id));
    expect(block.sourceSha256VerifiedByAudit).toBe(true);
    expect(block.cesiumContractReady).toBe(true);
    expect(block.waterColumnContractReady).toBe(true);
    expect(block.sourcePayloads.length).toBeGreaterThan(0);
    expect(block.availableDates.length).toBeGreaterThan(0);
    expect(block.availableVariables).toEqual(["thetao", "so", "currents"]);
    expect(runtime.materialized).toBe(true);
    expect(runtime.cesiumReady).toBe(true);
    expect(runtime.waterColumnReady).toBe(true);
    expect(runtime.availableTimes).toEqual(block.availableDates);
    expect(block.independentModelObservationValidated).toBe(false);
    // Full per-block GPU proof is deliberately not inferred from a contract gate.
    expect(block.individualProduction3DRenderProven).toBe(false);
  }
  for (const block of locked) {
    const runtime = deriveMainBlockCapabilities(resolveMainBlock(block.id));
    expect(block.sourcePayloads).toEqual([]);
    expect(block.availableDates).toEqual([]);
    expect(block.availableVariables).toEqual([]);
    expect(block.cesiumContractReady).toBe(false);
    expect(block.waterColumnContractReady).toBe(false);
    expect(runtime.dataAvailable).toBe(false);
    expect(runtime.renderReady).toBe(false);
  }
  expect(deriveMainBlockCapabilities(resolveMainBlock("BASE-GLORYS-001"))
    .validation.modelObservationValidated).toBe(true);
  expect(blocks.some((block) => block.id === "BASE-GLORYS-001")).toBe(false);
});

test("3DB-15 published production serves each of the 41 authentic pilot frames unchanged", async ({ request }) => {
  test.setTimeout(180_000);
  const url = process.env.OCEANTWIN_LIVE_URL;
  if (!url) throw new Error("OCEANTWIN_LIVE_URL is required for 3DB-15 production proof");
  const base = new URL(url.split("#")[0]);
  const auditUrl = new URL("main-blocks/capability-audit.json", base).toString();
  const auditResponse = await request.get(auditUrl);
  expect(auditResponse.ok()).toBe(true);
  expect(await auditResponse.json()).toEqual(report);
  let validated = 0;
  for (const block of pilots) {
    for (const payload of block.sourcePayloads) {
      const asset = new URL("main-blocks/" + payload.path, base).toString();
      const response = await request.get(asset);
      expect(response.ok(), block.id + " " + payload.date + " missing in published distribution").toBe(true);
      const digest = createHash("sha256").update(await response.body()).digest("hex");
      expect(digest, block.id + " " + payload.date + " altered after publication").toBe(payload.sha256);
      validated += 1;
    }
  }
  expect(validated).toBe(41);
});

test("3DB-15 renders a geographically distinct genuine pilot in synchronized Water Column", async ({ page }) => {
  test.setTimeout(180_000);
  const url = process.env.OCEANTWIN_LIVE_URL;
  if (!url) throw new Error("OCEANTWIN_LIVE_URL is required");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("oceancanvas-active-main-block-v1", "IO-082"));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ timeout: 15_000 });
  }
  await expect(page.getByTestId("scientific-context-bar"))
    .toHaveAttribute("data-block-id", "IO-082", { timeout: 45_000 });
  const open = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(open).toBeEnabled({ timeout: 45_000 });
  await open.click();
  const panel = page.locator('.water-column-shell[data-main-block-id="IO-082"]');
  await expect(panel).toHaveAttribute("data-materialization", "pilot", { timeout: 45_000 });
  await expect(panel).toHaveAttribute("data-depth-count", "31");
  await expect.poll(() => panel.getAttribute("data-lod-source-samples").then(Number))
    .toBeGreaterThan(0);
  await expect(panel).toContainText(/independent (?:Argo|observation) validation (?:claim|not asserted)/);
  expect(errors).toEqual([]);
});

test("3DB-15 stage switch never obstructs genuine globe basemap controls", async ({ page }) => {
  test.setTimeout(90_000);
  const url = process.env.OCEANTWIN_LIVE_URL;
  if (!url) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible({ timeout: 30_000 });
  const shell = page.locator(".app-shell");
  if ((await shell.getAttribute("data-control-dock")) === "open") {
    await page.getByRole("button", { name: "Hide explorer controls" }).click();
  }
  const stage = page.getByRole("button", { name: "Switch to Water Column 3D" });
  await expect(stage).toBeVisible();
  const globe = page.locator(".globe-shell").first();
  const offline = page.getByRole("button", { name: "Offline", exact: true });
  await expect(offline).toBeVisible();
  const stageBox = await stage.boundingBox();
  const offlineBox = await offline.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(offlineBox).not.toBeNull();
  const overlapWidth = Math.max(0,
    Math.min(stageBox!.x + stageBox!.width, offlineBox!.x + offlineBox!.width) -
    Math.max(stageBox!.x, offlineBox!.x));
  const overlapHeight = Math.max(0,
    Math.min(stageBox!.y + stageBox!.height, offlineBox!.y + offlineBox!.height) -
    Math.max(stageBox!.y, offlineBox!.y));
  expect(overlapWidth * overlapHeight).toBe(0);
  await offline.click({ timeout: 10_000 });
  await expect(globe).toHaveAttribute("data-imagery-preference", "offline");
  await page.getByRole("button", { name: "High-res auto" }).click({ timeout: 10_000 });
  await expect(globe).toHaveAttribute("data-imagery-preference", "auto");
});
