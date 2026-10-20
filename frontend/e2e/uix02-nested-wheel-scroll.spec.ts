import { test, expect } from "@playwright/test";

// Focused UIX-02-B source-owned wheel regression. No science or network fixtures.
test("UIX-02 nested scroll consumes wheel until boundary then delegates to document", async ({ page }) => {
  // Playwright's live config deliberately has no baseURL. Supply the actual
  // CI-hosted candidate origin, retaining the repository base path if present.
  const liveBase = process.env.OCEANTWIN_LIVE_URL;
  if (!liveBase || !(liveBase.startsWith("http://") || liveBase.startsWith("https://"))) {
    throw new Error("UIX-02 Chromium requires an absolute OCEANTWIN_LIVE_URL");
  }
  await page.goto(liveBase.replace(/#.*$/, "") + "#/telemetry", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const outer = document.createElement("div");
    outer.id = "uix02-wheel-outer";
    Object.assign(outer.style, { height: "1200px", paddingTop: "10px" });
    const inner = document.createElement("div");
    inner.id = "uix02-wheel-inner";
    Object.assign(inner.style, { overflowY: "auto", height: "120px", width: "280px" });
    const content = document.createElement("div");
    content.style.height = "600px";
    content.textContent = "Nested scroll boundary verification";
    inner.append(content);
    outer.append(inner);
    document.body.append(outer);
    // The app intentionally starts with html/body overflow hidden and height
    // 100%. Give this synthetic fixture a *document* scroll owner rather than
    // turning body into a second nested scroller (which left html scrollTop=0).
    document.body.style.height = "auto";
    document.body.style.overflow = "visible";
    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    window.scrollTo(0, 0);
  });
  const rootScroll = await page.evaluate(() => {
    const scroller = document.scrollingElement!;
    return {
      available: scroller.scrollHeight - scroller.clientHeight,
      owner: scroller.tagName,
      bodyOverflow: getComputedStyle(document.body).overflowY
    };
  });
  console.log("UIX-02 document scroll fixture:", rootScroll);
  expect(rootScroll.owner).toBe("HTML");
  expect(rootScroll.available).toBeGreaterThan(200);
  const inner = page.locator("#uix02-wheel-inner");
  await inner.scrollIntoViewIfNeeded();
  await inner.hover();
  await page.mouse.wheel(0, 160);
  await expect.poll(() => inner.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await inner.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const before = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  await inner.hover();
  await page.mouse.wheel(0, 160);
  await expect.poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBeGreaterThan(before);
  await inner.evaluate((el) => { el.scrollTop = 0; });
  await page.evaluate(() => window.scrollTo(0, 200));
  const topBefore = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  await inner.hover();
  await page.mouse.wheel(0, -100);
  await expect.poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBeLessThan(topBefore);
});
