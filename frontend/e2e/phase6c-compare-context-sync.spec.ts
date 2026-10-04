import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

function requireLiveUrl() {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  return liveUrl;
}

test("Phase 6C Compare profile selection survives reload and reopens in Explorer", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto(`${requireLiveUrl()}#/compare`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();

  const profileSelect = page.getByLabel("Verified Argo profile");
  await expect(profileSelect).toBeEnabled({ timeout: 60_000 });
  await expect(profileSelect.locator("option")).toHaveCount(2);

  const secondProfileId = await profileSelect.locator("option").nth(1).getAttribute("value");
  expect(secondProfileId).toBeTruthy();
  await profileSelect.selectOption(secondProfileId!);

  const contextBar = page.getByTestId("scientific-context-bar");
  await expect(contextBar).toHaveAttribute("data-selected-profile-id", secondProfileId!);
  const deepLink = await contextBar.getAttribute("data-context-deep-link");
  expect(deepLink).toContain(`profile=${encodeURIComponent(secondProfileId!)}`);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Ocean Canvas/i })).toBeVisible();
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-selected-profile-id", secondProfileId!);
  await expect(page.getByLabel("Verified Argo profile")).toHaveValue(secondProfileId!, { timeout: 60_000 });

  await page.getByRole("button", { name: "Open context in 3D Explorer" }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.getByTestId("scientific-context-bar")).toHaveAttribute("data-selected-profile-id", secondProfileId!);
  await expect(page.getByLabel("Argo profile", { exact: true })).toHaveValue(secondProfileId!, { timeout: 60_000 });
});
