import {expect,test} from "@playwright/test";
const live=process.env.OCEANTWIN_LIVE_URL;
test("Arctic Mist is the default theme for a fresh visitor",async({page})=>{
 if(!live)throw Error("OCEANTWIN_LIVE_URL required");
 await page.goto(live,{waitUntil:"domcontentloaded"});
 await expect(page.locator("html")).toHaveAttribute("data-glass-theme","arctic-mist",{timeout:30000});
 await expect(page.getByRole("button",{name:/Appearance: Arctic Mist/})).toBeVisible();
 await expect(page.getByRole("button",{name:"Enter fullscreen Ocean Canvas"})).toBeVisible();
});
