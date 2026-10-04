from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "frontend/e2e/live.spec.ts"
text = PATH.read_text(encoding="utf-8")

anchor = 'const liveUrl = process.env.OCEANTWIN_LIVE_URL;\n'
helper = '''const liveUrl = process.env.OCEANTWIN_LIVE_URL;\n\nasync function selectLightGlassTheme(page: Page) {\n  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });\n  await expect(trigger).toBeVisible();\n  await trigger.click();\n  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });\n  await expect(gallery).toBeVisible();\n  await gallery.getByRole("button", { name: /Lavender Haze/i }).click();\n  await expect.poll(() => page.locator("html").getAttribute("data-glass-theme")).toBe("lavender-haze");\n  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");\n}\n'''
if text.count(anchor) != 1:
    raise RuntimeError(f"liveUrl anchor count={text.count(anchor)}")
text = text.replace(anchor, helper, 1)

old_click = 'await page.getByRole("button", { name: "Switch to light theme" }).click();'
if text.count(old_click) != 2:
    raise RuntimeError(f"legacy theme click count={text.count(old_click)}")
text = text.replace(old_click, 'await selectLightGlassTheme(page);')

old_storage = 'await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-theme"))).toBe("light");'
new_storage = 'await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-glass-theme-v2"))).toBe("lavender-haze");'
if text.count(old_storage) != 1:
    raise RuntimeError(f"legacy storage assertion count={text.count(old_storage)}")
text = text.replace(old_storage, new_storage, 1)

PATH.write_text(text, encoding="utf-8")
print("Patched frontend/e2e/live.spec.ts for current Glass Appearance Gallery.")
