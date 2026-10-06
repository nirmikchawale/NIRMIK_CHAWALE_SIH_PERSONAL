import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

function requireLiveUrl() {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  return liveUrl;
}

test("Phase 6B deep link hydrates the actual baseline Explorer renderer controls", async ({ page }) => {
  test.setTimeout(180_000);
  const url = new URL(requireLiveUrl());
  const profileId = "20240102_indian_ocean_prof:23";
  url.hash = `#/explore?block=BASE-GLORYS-001&source=glorys&variable=so&depth=55.76428985595703&time=2024-01-02T00%3A00%3A00Z&profile=${encodeURIComponent(profileId)}`;

  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const contextBar = page.getByTestId("scientific-context-bar");
  await expect(contextBar).toHaveAttribute("data-source-mode", "glorys");
  await expect(contextBar).toHaveAttribute("data-variable", "so");

  const salinityButton = page.getByRole("button", { name: /Salinity/ }).first();
  await expect(salinityButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".selected-depth-hero strong")).toHaveText("55.76 m");
  await expect(page.locator(".static-time-row")).toContainText("2024-01-02");
  await expect(page.getByLabel("Argo profile")).toHaveValue(profileId);
});

test("Phase 6B INCOIS deep link waits for genuine source availability before hydrating variable and native time", async ({ page }) => {
  test.setTimeout(180_000);
  const url = new URL(requireLiveUrl());
  url.hash = "#/explore?block=BASE-GLORYS-001&source=incois&variable=so&time=2026-07-30T00%3A00%3A00Z";

  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const incoisButton = page.getByRole("button", { name: "INCOIS multi-time" });
  await expect(incoisButton).toBeEnabled({ timeout: 60_000 });
  await expect(incoisButton).toHaveAttribute("aria-pressed", "true", { timeout: 60_000 });

  const contextBar = page.getByTestId("scientific-context-bar");
  await expect(contextBar).toHaveAttribute("data-source-mode", "incois");
  await expect(contextBar).toHaveAttribute("data-variable", "so");
  await expect(page.getByRole("button", { name: /Salinity/ }).first()).toHaveAttribute("aria-pressed", "true");

  const timeline = page.locator('.timeline-scrubber[data-phase="3.5c"]');
  await expect(timeline).toBeVisible();
  await expect(timeline.locator(".timeline-now strong").first()).toHaveText("2026-07-30 · 00:00 UTC");
  await expect(timeline).toHaveAttribute("data-time-kind", "native");

  // Re-selecting the already active scientific source is intentionally idempotent:
  // it must not reset a deep-linked/restored native timestamp back to frame zero.
  await incoisButton.click();
  await expect(timeline.locator(".timeline-now strong").first()).toHaveText("2026-07-30 · 00:00 UTC");
  await expect(contextBar).toHaveAttribute("data-source-mode", "incois");
  await expect(contextBar).toHaveAttribute("data-variable", "so");
});

test("Phase 6B keeps a deep-linked pilot block active when navigation cleans the route", async ({ page }) => {
  test.setTimeout(180_000);
  const url = new URL(requireLiveUrl());
  url.hash = "#/explore?block=IO-001&source=glorys&variable=thetao&time=2004-03-15T12%3A00%3A00Z";

  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const contextBar = page.getByTestId("scientific-context-bar");
  await expect(contextBar).toHaveAttribute("data-block-id", "IO-001", { timeout: 60_000 });
  await expect(contextBar).toHaveAttribute("data-block-materialization", "pilot");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("oceancanvas-active-main-block-v1"))).toBe("IO-001");

  await page.locator('[data-workspace-id="telemetry"]').click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-id", "IO-001");
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-block-materialization", "pilot");
});
