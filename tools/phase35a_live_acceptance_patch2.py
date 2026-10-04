from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "frontend/e2e/live.spec.ts"
text = PATH.read_text(encoding="utf-8")

light_helper = '''async function selectLightGlassTheme(page: Page) {
  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await expect(gallery).toBeVisible();
  await gallery.getByRole("button", { name: /Lavender Haze/i }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("lavender-haze");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
}
'''

dark_helper = light_helper + '''
async function selectDarkGlassTheme(page: Page) {
  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });
  await expect(gallery).toBeVisible();
  await gallery.getByRole("button", { name: /Aurora Borealis/i }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("aurora-borealis");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
}
'''

if text.count(light_helper) != 1:
    raise RuntimeError(f"light helper anchor count={text.count(light_helper)}")
text = text.replace(light_helper, dark_helper, 1)

stale_summary = '  await expect(page.locator(".judge-summary")).toContainText("sensor plugin profiles");\n'
if text.count(stale_summary) != 1:
    raise RuntimeError(f"stale imported-profile summary count={text.count(stale_summary)}")
text = text.replace(stale_summary, "", 1)

old_dark = '''  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-theme"))).toBe("dark");
'''
new_dark = '''  await selectDarkGlassTheme(page);
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-glass-theme-v2"))).toBe("aurora-borealis");
'''
if text.count(old_dark) != 1:
    raise RuntimeError(f"legacy dark theme block count={text.count(old_dark)}")
text = text.replace(old_dark, new_dark, 1)

PATH.write_text(text, encoding="utf-8")
print("Patched remaining live acceptance expectations for the current Ocean Canvas UI.")
