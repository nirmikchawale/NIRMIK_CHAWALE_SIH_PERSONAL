import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`content routes own scrolling inside the app viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(process.env.OCEANTWIN_LIVE_URL!);
    await expect(page.locator(".ocean-workbench")).toBeVisible();

    const rootContract = await page.evaluate(() => {
      const root = document.getElementById("root");
      const shell = document.querySelector(".ocean-workbench");
      if (!(root instanceof HTMLElement) || !(shell instanceof HTMLElement)) {
        throw new Error("Ocean Canvas app shell was not ready for scroll-contract inspection.");
      }
      return {
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
        bodyOverflowY: getComputedStyle(document.body).overflowY,
        rootOverflowY: getComputedStyle(root).overflowY,
        shellOverflowY: getComputedStyle(shell).overflowY,
        shellHeight: shell.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
      };
    });
    expect(rootContract.htmlOverflowY).toBe("hidden");
    expect(rootContract.bodyOverflowY).toBe("hidden");
    expect(rootContract.rootOverflowY).toBe("hidden");
    // MPR-02: the landing Explorer intentionally owns shell scrolling.
    // Content routes below retain the original locked viewport contract.
    expect(rootContract.shellOverflowY).toBe("auto");
    expect(Math.abs(rootContract.shellHeight - rootContract.viewportHeight)).toBeLessThanOrEqual(2);

    const contextHeader = page.getByTestId("scientific-context-header");
    await expect(contextHeader).toBeInViewport();
    // The footer stays in the document for accessibility; only its *viewport*
    // visibility matters before a user scrolls to the bottom of Explorer.
    await expect(page.locator(".science-footer")).not.toBeInViewport();

    const routes = [
      { route: "telemetry", category: "Analyze" },
      { route: "compare", category: "Analyze" },
      { route: "anomaly", category: "Analyze" },
      { route: "data-lab", category: "Data" },
      { route: "about", category: "Science" }
    ] as const;
    for (const { route, category } of routes) {
      const directory = page.getByRole("navigation", { name: "Ocean Canvas workspaces" });
      if (width <= 900) {
        const mobileTrigger = page.getByRole("button", { name: "Open workspace navigation" });
        await expect(mobileTrigger).toBeVisible();
        await mobileTrigger.click();
        await directory.getByRole("button", { name: category, exact: true }).click();
      } else {
        await page.getByRole("button", { name: `Open ${category} workspaces` }).click();
      }
      await expect(directory).toBeVisible();

      // The MPR-03 overlay defaults closed: open the correct group first and
      // retain original NAV-01 stable route IDs and scrolling assertions.
      await directory.locator(`[data-workspace-id="${route}"]`).click();
      await expect(page.locator(".ocean-workbench")).toHaveCSS("overflow-y", "hidden");
      const content = page.locator(`main[data-page="${route}"]`);
      await expect(content).toBeVisible();

      const geometry = await content.evaluate(element => {
        const parent = element.parentElement!;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          height: rect.height,
          parentHeight: parent.getBoundingClientRect().height,
          position: style.position,
          overflowY: style.overflowY,
          room: element.scrollHeight - element.clientHeight,
          width: rect.width,
          viewport: document.documentElement.clientWidth,
          documentScrollTop: document.scrollingElement?.scrollTop ?? 0,
        };
      });

      expect(geometry.position).toBe("absolute");
      expect(["auto", "scroll"]).toContain(geometry.overflowY);
      expect(geometry.height).toBeGreaterThan(200);
      expect(geometry.height).toBeLessThanOrEqual(geometry.parentHeight + 2);
      expect(geometry.width).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.documentScrollTop).toBe(0);

      // A route is allowed to fit exactly at a particular viewport. In that case,
      // create temporary test-only overflow so we can still prove that this main
      // element owns scrolling and the document itself remains locked.
      const injectedScrollProbe = geometry.room <= 0;
      if (injectedScrollProbe) {
        await content.evaluate(element => {
          const probe = document.createElement("div");
          probe.dataset.documentLayoutScrollProbe = "true";
          probe.setAttribute("aria-hidden", "true");
          probe.style.height = "600px";
          probe.style.minHeight = "600px";
          probe.style.flex = "0 0 600px";
          probe.style.width = "1px";
          probe.style.pointerEvents = "none";
          element.appendChild(probe);
        });
      }

      await expect.poll(() => content.evaluate(element => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
      await content.evaluate(element => { element.scrollTop = 0; });
      await content.locator("h2").first().hover();
      await page.mouse.wheel(0, 600);
      await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);

      if (injectedScrollProbe) {
        await content.evaluate(element => {
          element.querySelector('[data-document-layout-scroll-probe="true"]')?.remove();
          element.scrollTop = 0;
        });
      }

      await expect(contextHeader).toBeInViewport();
    }
  });
}
