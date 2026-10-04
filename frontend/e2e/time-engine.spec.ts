import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

test("Phase 3.5C exposes native time provenance, transport and exact deep-link restore", async ({ page }) => {
  test.setTimeout(240_000);
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const incoisButton = page.getByRole("button", { name: "INCOIS multi-time" });
  await expect(incoisButton).toBeEnabled({ timeout: 60_000 });
  await incoisButton.click();

  const timeEngine = page.locator('.timeline-scrubber[data-phase="3.5c"]');
  await expect(timeEngine).toBeVisible();
  await expect(timeEngine).toHaveAttribute("data-time-kind", "native");
  await expect(timeEngine).toContainText("NATIVE SOURCE TIME");
  await expect(timeEngine).toContainText("INTERPOLATION OFF");
  await expect(timeEngine.getByLabel("Native date", { exact: true })).toBeVisible();
  await expect(timeEngine.getByLabel("Native UTC time", { exact: true })).toBeVisible();
  await expect(timeEngine).toContainText("URL CONTEXT");
  await expect(timeEngine).toContainText("Synced");

  const nativeCount = Number(await timeEngine.getAttribute("data-native-count"));
  expect(nativeCount).toBeGreaterThan(1);

  const timelineSlider = timeEngine.getByRole("slider", { name: "Explore genuine timestamp" });
  await timelineSlider.focus();
  await timelineSlider.press("End");
  const selectedBeforeReload = (await timeEngine.locator(".timeline-now strong").first().textContent())?.trim();
  expect(selectedBeforeReload).toBeTruthy();
  await expect(page).toHaveURL(/time=/);

  const storedContext = await page.evaluate(() => window.sessionStorage.getItem("oceancanvas-scientific-time-v1"));
  expect(storedContext).toContain('"timeKind":"native"');

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();
  const incoisAfterReload = page.getByRole("button", { name: "INCOIS multi-time" });
  await expect(incoisAfterReload).toBeEnabled({ timeout: 60_000 });
  await incoisAfterReload.click();
  const restoredEngine = page.locator('.timeline-scrubber[data-phase="3.5c"]');
  await expect(restoredEngine).toBeVisible();
  await expect(restoredEngine.locator(".timeline-now strong").first()).toHaveText(selectedBeforeReload!);

  // Phase 3.5D supersedes the older 3.5C-only launcher copy, but the block engine
  // must still expose genuine native-date materialization and the multi-date pilots.
  const blockLauncher = page.getByTestId("phase35-block-launcher");
  await expect(blockLauncher).toContainText("source-backed pilots");
  await blockLauncher.click();
  const blockDialog = page.getByRole("dialog", { name: "Indian Ocean Main Block Engine" });
  await expect(blockDialog).toContainText("MULTI-DATE PILOTS");
  await expect(blockDialog).toContainText("Native dates");
  await expect(blockDialog).toContainText("no synthetic values");

  await blockDialog.getByRole("button", { name: "Close main block engine" }).click();
  await page.getByRole("button", { name: "GLORYS baseline" }).click();
  await expect(page.locator(".static-time-row")).toContainText("One genuine model timestamp");
  await expect(page.locator(".static-time-row")).toContainText("never duplicated to simulate time");
});
