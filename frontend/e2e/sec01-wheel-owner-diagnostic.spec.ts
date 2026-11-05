import { test, expect } from "@playwright/test";

// SEC-01-E: one real browser case against the same immutable build artifact as failed shard 4.
// Instrumentation is diagnostic only. Do not alter Telemetry, UI/CSS, science, or production test.
test("SEC01 isolated original Telemetry nested-wheel upward boundary", async ({ page }) => {
  const liveBase = process.env.OCEANTWIN_LIVE_URL;
  if (!liveBase?.startsWith("http")) throw new Error("Explicit local static URL required");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(liveBase.replace(/#.*$/, "") + "#/telemetry", { waitUntil: "domcontentloaded" });
  const workspace = page.locator(".ocean-workbench");
  const owner = workspace.locator(".telemetry-page");
  await expect(owner).toBeVisible();
  await owner.evaluate(el => {
    const outer = document.createElement("div");
    outer.id = "uix02-wheel-outer";
    Object.assign(outer.style, {height:"1500px", paddingTop:"360px", boxSizing:"border-box"});
    const inner = document.createElement("div");
    inner.id = "uix02-wheel-inner";
    Object.assign(inner.style, {overflowY:"auto", height:"120px", width:"280px"});
    const content = document.createElement("div");
    content.style.height = "600px";
    content.textContent = "Nested scroll boundary verification";
    inner.append(content); outer.append(inner); el.prepend(outer); el.scrollTop = 0;
  });
  await page.evaluate(() => {
    const own = document.querySelector(".telemetry-page");
    const inn = document.querySelector("#uix02-wheel-inner");
    const events: Array<Record<string, unknown>> = [];
    (window as any).__sec01WheelEvents = events;
    const snap = (event: string, more: Record<string, unknown> = {}) => {
      const rect = inn?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width/2 : 0;
      const y = rect ? rect.top + rect.height/2 : 0;
      const hit = document.elementFromPoint(x,y);
      events.push({event, t: Math.round(performance.now()), outer: (own as HTMLElement)?.scrollTop,
        inner: (inn as HTMLElement)?.scrollTop, doc: document.scrollingElement?.scrollTop,
        x: Math.round(x), y: Math.round(y),
        innerTop: Math.round(rect?.top ?? -1),
        hit: (hit as HTMLElement)?.id || (hit as HTMLElement)?.className?.toString()?.slice(0,80),
        outerScrollBehavior: own ? getComputedStyle(own).scrollBehavior : null, ...more});
    };
    (window as any).__sec01WheelSnap = snap;
    document.addEventListener("wheel", e => snap("wheel-capture",
      {deltaY:e.deltaY, target:(e.target as HTMLElement)?.id || (e.target as HTMLElement)?.tagName}), {capture:true,passive:true});
    own?.addEventListener("scroll", () => snap("owner-scroll"),{passive:true});
    inn?.addEventListener("scroll", () => snap("inner-scroll"),{passive:true});
    snap("installed");
  });
  const snapshot = async (label: string) => {
    await page.evaluate((name) => (window as any).__sec01WheelSnap(name), label);
    const e = await page.evaluate(() => (window as any).__sec01WheelEvents.slice(-15));
    console.log("SEC01-WHEEL-SNAPSHOT " + label + " " + JSON.stringify(e));
  };
  const inner = page.locator("#uix02-wheel-inner");
  try {
    await inner.hover();
    const startOwner = await owner.evaluate(el => el.scrollTop);
    await page.mouse.wheel(0,160);
    await expect.poll(() => inner.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await owner.evaluate(el=>el.scrollTop)).toBe(startOwner);
    await inner.evaluate(el => {el.scrollTop=el.scrollHeight;});
    await inner.hover();
    const beforeDown = await owner.evaluate(el=>el.scrollTop);
    await page.mouse.wheel(0,160);
    await expect.poll(()=>owner.evaluate(el=>el.scrollTop)).toBeGreaterThan(beforeDown);
    await inner.evaluate(el => {el.scrollTop=0;});
    await owner.evaluate(el => {el.scrollTop=200;});
    await inner.hover();
    expect(await inner.evaluate(el=>el.scrollTop)).toBe(0);
    const beforeUp = await owner.evaluate(el=>el.scrollTop);
    await snapshot("before-up");
    await page.mouse.wheel(0,-100);
    await snapshot("after-up");
    await expect.poll(()=>owner.evaluate(el=>el.scrollTop),{timeout:20000}).toBeLessThan(beforeUp);
    console.log("SEC01-WHEEL-RESULT PASS before="+beforeUp+" after="+await owner.evaluate(el=>el.scrollTop));
  } finally {
    await snapshot("finally");
    const all = await page.evaluate(() => (window as any).__sec01WheelEvents);
    console.log("SEC01-WHEEL-ALL-EVENTS " + JSON.stringify(all.slice(-130)));
  }
});
