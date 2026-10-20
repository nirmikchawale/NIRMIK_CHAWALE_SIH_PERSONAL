import { test, expect } from "@playwright/test";

// UIX-02-B: ONE real Chromium case for the production non-Explorer scroll owner.
// UIX-01 intentionally locks html/body scrolling. The actual Telemetry section
// owns scrolling; never create a fake document owner or change science fixtures.
test("UIX-02 nested scroll consumes wheel until boundary then delegates to Telemetry owner", async ({ page }) => {
  const liveBase = process.env.OCEANTWIN_LIVE_URL;
  if (!liveBase || !(liveBase.startsWith("http://") || liveBase.startsWith("https://"))) {
    throw new Error("UIX-02 Chromium requires an absolute OCEANTWIN_LIVE_URL");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveBase.replace(/#.*$/, "") + "#/telemetry", { waitUntil: "domcontentloaded" });

  const workspace = page.locator(".ocean-workbench");
  const owner = workspace.locator(".telemetry-page");
  await expect(owner).toBeVisible();
  const sourceIdentity = await workspace.getAttribute("data-explore-source");

  await owner.evaluate(el => {
    const outer = document.createElement("div");
    outer.id = "uix02-wheel-outer";
    Object.assign(outer.style, { height: "1500px", paddingTop: "360px", boxSizing: "border-box" });
    const inner = document.createElement("div");
    inner.id = "uix02-wheel-inner";
    Object.assign(inner.style, { overflowY: "auto", height: "120px", width: "280px" });
    const content = document.createElement("div");
    content.style.height = "600px";
    content.textContent = "Nested scroll boundary verification";
    inner.append(content);
    outer.append(inner);
    el.prepend(outer);
    el.scrollTop = 0;
  });

  const ownerContext = await owner.evaluate(el => ({
    overflowY: getComputedStyle(el).overflowY,
    travel: el.scrollHeight - el.clientHeight
  }));
  console.log("UIX-02 actual scroll owner:", ownerContext);
  expect(ownerContext.overflowY).toMatch(/auto|scroll/);
  expect(ownerContext.travel).toBeGreaterThan(300);

  const inner = page.locator("#uix02-wheel-inner");
  await inner.hover();
  const startOwner = await owner.evaluate(el => el.scrollTop);
  await page.mouse.wheel(0, 160);
  await expect.poll(() => inner.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await owner.evaluate(el => el.scrollTop)).toBe(startOwner);

  // Nested scroll at bottom must yield to the existing Telemetry page scroller.
  await inner.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const beforeDown = await owner.evaluate(el => el.scrollTop);
  await inner.hover();
  await page.mouse.wheel(0, 160);
  await expect.poll(() => owner.evaluate(el => el.scrollTop)).toBeGreaterThan(beforeDown);

  // Nested scroll at top must yield upward to that SAME actual page scroller.
  await inner.evaluate(el => { el.scrollTop = 0; });
  await owner.evaluate(el => { el.scrollTop = 200; });
  const beforeUp = await owner.evaluate(el => el.scrollTop);
  expect(beforeUp).toBeGreaterThan(0);
  await inner.hover();
  await page.mouse.wheel(0, -100);
  await expect.poll(() => owner.evaluate(el => el.scrollTop)).toBeLessThan(beforeUp);

  // Existing UIX-01 page ownership and science identity are never rewritten.
  expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);
  await expect(workspace).toHaveAttribute("data-explore-source", sourceIdentity ?? "glorys");
  await expect(page).toHaveURL(liveBase.replace(/#.*$/, "") + "#/telemetry");
  await page.locator("#uix02-wheel-outer").evaluate(el => el.remove());
});
