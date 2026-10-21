import { expect, test } from "@playwright/test";

const base = process.env.OCEANTWIN_LIVE_URL;
type TraceEvent = { atMs: number; event: string; element: string };

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test("UIX-04C native Analyze focus at 1440px, motion=" + reducedMotion, async ({ page }, testInfo) => {
    test.setTimeout(110_000);
    if (!base || !/^https?:\/\//.test(base)) throw new Error("Real absolute OCEANTWIN_LIVE_URL required");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(() => {
      const target = window as Window & { __uix04cFocusTrace?: TraceEvent[] };
      target.__uix04cFocusTrace = [];
      for (const name of ["focusin", "focusout"]) {
        document.addEventListener(name, (event) => {
          const el = event.target;
          target.__uix04cFocusTrace?.push({
            atMs: Math.round(performance.now()),
            event: name,
            element: el instanceof HTMLElement ? el.outerHTML.slice(0, 240) : String(el)
          });
        }, true);
      }
    });
    await page.goto(base.replace(/#.*$/, "") + "#/explore");
    const scene = page.locator(".workspace-frame > .workspace");
    const widthBefore = (await scene.boundingBox())!.width;
    const trigger = page.getByRole("button", { name: "Open Analyze workspaces" });
    await trigger.click();
    const nav = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
    const target = nav.getByRole("button", { name: "Analyze", exact: true });
    try {
      await expect(nav).toBeVisible();
      await expect(page.getByTestId("app-navigation-root")).toHaveAttribute("data-drawer-open", "true");
      await expect(nav).not.toHaveAttribute("inert", "");
      // Original real auto-focus assertion; DO NOT artificially focus the target in this test.
      await expect(target).toBeFocused({ timeout: 20_000 });
    } finally {
      const evidence = await page.evaluate(() => {
        const typedWindow = window as Window & { __uix04cFocusTrace?: TraceEvent[] };
        const nav = document.getElementById("ocean-canvas-workspace-navigation");
        const selected = nav?.querySelector<HTMLElement>(".mpr-drawer-category.is-selected");
        const active = document.activeElement;
        const css = nav ? window.getComputedStyle(nav) : null;
        return {
          url: location.href,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          rootOpen: document.querySelector("[data-testid='app-navigation-root']")?.getAttribute("data-drawer-open"),
          ariaHidden: nav?.getAttribute("aria-hidden"),
          inert: nav?.hasAttribute("inert"),
          visibility: css?.visibility,
          opacity: css?.opacity,
          transitionDuration: css?.transitionDuration,
          activeElement: active instanceof HTMLElement ? active.outerHTML.slice(0, 350) : String(active),
          selectedElement: selected?.outerHTML.slice(0, 350),
          nativeAutofocusSucceeded: !!selected && selected === active,
          events: (typedWindow.__uix04cFocusTrace || []).slice(-60)
        };
      });
      console.log("UIX04C_FOCUS_EVIDENCE " + JSON.stringify(evidence));
      await testInfo.attach("native-focus-evidence-" + reducedMotion + ".json", {
        body: Buffer.from(JSON.stringify(evidence, null, 2)),
        contentType: "application/json"
      });
    }
    await nav.getByRole("button", { name: "Close workspace directory" }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(nav.getByRole("button", { name: "Anomaly Screening" })).toBeFocused();
    expect(Math.abs((await scene.boundingBox())!.width - widthBefore)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page).toHaveURL(/#\/explore$/);
  });
}
