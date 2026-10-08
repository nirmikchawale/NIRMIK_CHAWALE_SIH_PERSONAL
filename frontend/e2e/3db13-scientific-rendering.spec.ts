import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { assertPilotFrameSha256, MAIN_BLOCK_FRAME_INTEGRITY_VERSION } from "../src/main-block-frame-integrity";
import { PHASE35B_PILOT_IDS } from "../src/main-block-runtime";

const manifest = JSON.parse(readFileSync(new URL("../public/main-blocks/manifest.json", import.meta.url), "utf8"));
const record = manifest.blocks.find((x: { id: string }) => x.id === "IO-001").payloads[0];
const bytes = readFileSync(new URL("../public/main-blocks/data/IO-001/2004-03-15.json", import.meta.url));
const buffer = (data: Uint8Array): ArrayBuffer => Uint8Array.from(data).buffer as ArrayBuffer;

async function openExplore(page: import("@playwright/test").Page) {
  await page.goto(process.env.OCEANTWIN_LIVE_URL!, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ocean-workbench")).toBeVisible({ timeout: 30_000 });
  const skip = page.getByRole("button", { name: "Skip journey" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ timeout: 15_000 });
    await expect(page.locator(".globe-shell[data-journey-phase]")).toHaveAttribute("data-journey-phase", "region", { timeout: 20_000 });
  }
}

test("3DB-13 real source SHA-256 passes; corrupted bytes and missing manifest digest fail closed", async () => {
  expect(MAIN_BLOCK_FRAME_INTEGRITY_VERSION).toBe("3db-13-v1");
  expect(PHASE35B_PILOT_IDS).toHaveLength(35);
  expect(manifest.integrity).toMatchObject({ logical_block_count: 140, pilot_block_count: 35 });
  await expect(assertPilotFrameSha256(buffer(bytes), record.sha256, "IO-001", record.date)).resolves.toBeUndefined();
  const corrupt = Uint8Array.from(bytes);
  corrupt[128] ^= 1;
  await expect(assertPilotFrameSha256(buffer(corrupt), record.sha256, "IO-001", record.date)).rejects.toThrow(/SHA-256 mismatch/);
  await expect(assertPilotFrameSha256(buffer(bytes), "", "IO-001", record.date)).rejects.toThrow(/invalid manifest SHA-256/);
});

test("3DB-13 globe pilot inventory and Water Column show scientifically truthful active frame", async ({ page }) => {
  if (!process.env.OCEANTWIN_LIVE_URL) throw new Error("OCEANTWIN_LIVE_URL required");
  await openExplore(page);
  const hud = page.getByTestId("integrated-main-block-hud");
  await expect(hud.getByText("35 materialized", { exact: true })).toBeVisible({ timeout: 30_000 });
  await hud.getByLabel("Active main block").selectOption("IO-001");
  const enter = page.getByRole("button", { name: "Open in Water Column 3D" });
  await expect(enter).toBeEnabled({ timeout: 30_000 });
  await enter.click();
  const panel = page.locator('.water-column-shell[data-main-block-id="IO-001"]');
  await expect(panel).toHaveAttribute("data-materialization", "pilot", { timeout: 30_000 });
  // The RUI shell may visually suppress these disclosures in its compact island.
  // Assert the exact scientific renderer state without modifying RUI-owned CSS.
  await expect(panel).toContainText("IO-001 · SOURCE-BACKED PILOT VOLUME");
  await expect(panel).toContainText(/independent observation validation not asserted/);
  await expect(panel).toHaveAttribute("data-depth-count", "31");
  await expect.poll(() => panel.getAttribute("data-lod-source-samples").then(Number)).toBeGreaterThan(0);
});

test("3DB-13 corrupted HTTP source frame never becomes an accepted scientific volume", async ({ page }) => {
  if (!process.env.OCEANTWIN_LIVE_URL) throw new Error("OCEANTWIN_LIVE_URL required");
  let intercepted = 0;
  await page.route("**/main-blocks/data/IO-001/2004-03-15.json", async (route) => {
    intercepted += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"schema":"tampered"}' });
  });
  // An invalid preselected pilot fails at the initial scientific catalog gate.
  // This is intentionally a boot error, not a ready Explorer field toast.
  await page.addInitScript(() => localStorage.setItem("oceancanvas-active-main-block-v1", "IO-001"));
  await page.goto(process.env.OCEANTWIN_LIVE_URL, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".boot-error-card")).toContainText(/SHA-256 mismatch/, { timeout: 30_000 });
  expect(intercepted).toBeGreaterThan(0);
  await expect(page.locator(".ocean-workbench")).toHaveCount(0);
  await expect(page.locator('.water-column-shell[data-main-block-id="IO-001"]')).toHaveCount(0);
});
