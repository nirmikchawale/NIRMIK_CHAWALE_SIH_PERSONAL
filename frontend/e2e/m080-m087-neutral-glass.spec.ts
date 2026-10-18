import {expect,test} from "@playwright/test";
import {DEFAULT_GLASS_THEME, GLASS_THEME_IDS, GLASS_THEMES, GLASS_THEME_STORAGE_KEY} from "../src/theme";
test("M080-M087 preserves all original 16 IDs and adds distinct true neutral Light and Dark",()=>{
 const originals=["abyss-noir","aurora-borealis","midnight-indigo","deep-sea-emerald",
 "bioluminescent-cyan","coral-dusk","solar-amber","graphite-clear",
 "polar-frost","arctic-mist","pearl-lagoon","glacier-mint","rose-quartz",
 "lavender-haze","sandglass","cloud-prism"];
 expect(GLASS_THEME_IDS.slice(0,16)).toEqual(originals);
 expect(GLASS_THEME_IDS).toHaveLength(18);
 expect(GLASS_THEMES.filter(x=>x.scheme==="dark")).toHaveLength(9);
 expect(GLASS_THEMES.filter(x=>x.scheme==="light")).toHaveLength(9);
 expect(DEFAULT_GLASS_THEME).toBe("arctic-mist");
 expect(GLASS_THEMES.find(x=>x.id==="system-light")?.swatches[0]).toBe("#f5f6f8");
 expect(GLASS_THEMES.find(x=>x.id==="system-dark")?.swatches[0]).toBe("#111418");
 expect(GLASS_THEME_STORAGE_KEY).toBe("oceantwin-glass-theme-v2");
});
test("M087 saved theme applies without changing source science",async({page})=>{
 test.skip(!process.env.OCEANTWIN_LIVE_URL,"development HTTP server required");
 await page.goto(process.env.OCEANTWIN_LIVE_URL!,{waitUntil:"domcontentloaded"});
 const button=page.getByRole("button",{name:/Appearance: .*Open glass theme gallery/});
 await expect(button).toBeVisible({timeout:30000});
 await button.click();
 const modal=page.getByRole("dialog",{name:"Glass appearance gallery"});
 await expect(modal.locator(".theme-option")).toHaveCount(18);
 await modal.getByRole("button",{name:/Neutral Dark/}).click();
 await expect(page.locator("html")).toHaveAttribute("data-glass-theme","system-dark");
 await expect.poll(()=>page.evaluate(key=>localStorage.getItem(key),GLASS_THEME_STORAGE_KEY)).toBe("system-dark");
 await page.reload({waitUntil:"domcontentloaded"});
 await expect(page.locator("html")).toHaveAttribute("data-glass-theme","system-dark",{timeout:30000});
});
