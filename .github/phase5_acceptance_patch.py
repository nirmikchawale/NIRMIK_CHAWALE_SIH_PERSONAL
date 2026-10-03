from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one match in {path}, found {count}: {old[:100]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


live = "frontend/e2e/live.spec.ts"
replace_once(
    live,
    '''const liveUrl = process.env.OCEANTWIN_LIVE_URL;\n\nasync function revealCanvasTools(page: Page) {''',
    '''const liveUrl = process.env.OCEANTWIN_LIVE_URL;\nconst GLASS_THEME_KEY = "oceantwin-glass-theme-v2";\n\nasync function switchToLightGlassTheme(page: Page) {\n  const trigger = page.getByRole("button", { name: /Appearance: .*Open glass theme gallery/ });\n  await expect(trigger).toBeVisible();\n  await trigger.click();\n  const gallery = page.getByRole("dialog", { name: "Glass appearance gallery" });\n  await expect(gallery).toBeVisible();\n  await gallery.getByRole("button", { name: /Lavender Haze/i }).click();\n  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");\n  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), GLASS_THEME_KEY)).toBe("lavender-haze");\n}\n\nasync function revealCanvasTools(page: Page) {'''
)
replace_once(
    live,
    '''  const documentRoot = page.locator("html");\n  await expect(documentRoot).toHaveAttribute("data-theme", "dark");\n  await page.getByRole("button", { name: "Switch to light theme" }).click();\n  await expect(documentRoot).toHaveAttribute("data-theme", "light");\n  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-theme"))).toBe("light");\n\n  await page.reload({ waitUntil: "domcontentloaded" });''',
    '''  const documentRoot = page.locator("html");\n  await expect(documentRoot).toHaveAttribute("data-theme", "dark");\n  await switchToLightGlassTheme(page);\n  await expect(documentRoot).toHaveAttribute("data-theme", "light");\n\n  await page.reload({ waitUntil: "domcontentloaded" });'''
)
replace_once(
    live,
    '''  const documentRoot = page.locator("html");\n  await expect(documentRoot).toHaveAttribute("data-theme", "dark");\n  await page.getByRole("button", { name: "Switch to light theme" }).click();\n  await expect(documentRoot).toHaveAttribute("data-theme", "light");\n  await expect(page.locator(".app-shell")).toHaveAttribute("data-page", "explore");''',
    '''  const documentRoot = page.locator("html");\n  await expect(documentRoot).toHaveAttribute("data-theme", "dark");\n  await switchToLightGlassTheme(page);\n  await expect(documentRoot).toHaveAttribute("data-theme", "light");\n  await expect(page.locator(".app-shell")).toHaveAttribute("data-page", "explore");'''
)

replace_once(
    "frontend/e2e/time-engine.spec.ts",
    '''  await expect(timeEngine.getByLabel("Native date")).toBeVisible();\n  await expect(timeEngine.getByLabel("Native UTC time")).toBeVisible();''',
    '''  await expect(timeEngine.getByLabel("Native date", { exact: true })).toBeVisible();\n  await expect(timeEngine.getByLabel("Native UTC time", { exact: true })).toBeVisible();'''
)

print("Current-MVP browser acceptance assertions repaired.")
