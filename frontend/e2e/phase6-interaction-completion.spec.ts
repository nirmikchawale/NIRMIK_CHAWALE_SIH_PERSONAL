import { expect, test } from "@playwright/test";

const ACTIVE_BLOCK_KEY = "oceancanvas-active-main-block-v1";
const WORKSPACE_CONTEXT_KEY = "oceancanvas-scientific-workspace-context-v1";
const TIME_CONTEXT_KEY = "oceancanvas-scientific-time-v1";

async function clearPersistedScientificContext(page: import("@playwright/test").Page) {
  await page.evaluate(({ activeBlock, workspaceContext, timeContext }) => {
    localStorage.removeItem(activeBlock);
    sessionStorage.removeItem(workspaceContext);
    sessionStorage.removeItem(timeContext);
  }, {
    activeBlock: ACTIVE_BLOCK_KEY,
    workspaceContext: WORKSPACE_CONTEXT_KEY,
    timeContext: TIME_CONTEXT_KEY
  });
}

test("Phase 6 materialized-block controls are live across workspaces and deep-link safe", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${process.env.OCEANTWIN_LIVE_URL!}#/telemetry`);
  await clearPersistedScientificContext(page);
  await page.reload();

  const bar = page.getByTestId("scientific-context-bar");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute("data-block-id", "BASE-GLORYS-001");
  await expect(bar).toHaveAttribute("data-block-materialization", "verified-baseline");

  const details = bar.locator("details.scientific-context-details");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");

  const blockControl = page.getByTestId("scientific-context-materialized-control");
  await expect(blockControl).toBeVisible();
  const select = page.getByLabel("Active materialized scientific block");
  await expect(select.locator("option")).toHaveCount(26);

  await select.selectOption("IO-001");
  await expect(bar).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });
  await expect(bar).toHaveAttribute("data-block-materialization", "pilot");
  await expect(page).toHaveURL(/#\/telemetry\?.*block=IO-001/);

  const deepLink = await bar.getAttribute("data-context-deep-link");
  expect(deepLink).toBeTruthy();
  expect(deepLink).toContain("#/telemetry?");
  expect(deepLink).toContain("block=IO-001");
  expect(deepLink).toContain("source=glorys");
  expect(deepLink).toContain("variable=");

  await clearPersistedScientificContext(page);
  await page.goto(deepLink!);
  await expect(bar).toHaveAttribute("data-block-id", "IO-001", { timeout: 30_000 });
  await expect(bar).toHaveAttribute("data-block-materialization", "pilot");

  const restoredDetails = bar.locator("details.scientific-context-details");
  // 3DB-07 keeps block/deep-link changes in-session, so this disclosure may
  // already be open. Only toggle when necessary; never close a valid restored state.
  if ((await restoredDetails.getAttribute("open")) === null) {
    await restoredDetails.locator("summary").click();
  }
  await expect(restoredDetails).toHaveAttribute("open", "");

  const copied = page.getByRole("button", { name: "Copy shareable scientific context link" });
  await expect(copied).toBeVisible();
  await copied.click();
  await expect(copied).toContainText(/Context link copied|Copy unavailable/);
});

test("Phase 6 context controls remain contained on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${process.env.OCEANTWIN_LIVE_URL!}#/anomaly`);

  const bar = page.getByTestId("scientific-context-bar");
  await expect(bar).toBeVisible();
  await expect(bar.locator("details")).not.toHaveAttribute("open", "");
  await bar.locator("summary").click();

  const control = page.getByTestId("scientific-context-materialized-control");
  await expect(control).toBeVisible();
  await control.scrollIntoViewIfNeeded();

  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);

  await expect(page.getByLabel("Active materialized scientific block")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy shareable scientific context link" })).toBeVisible();
});
