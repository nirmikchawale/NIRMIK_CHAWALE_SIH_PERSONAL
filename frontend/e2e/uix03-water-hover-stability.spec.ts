import {expect,test} from "@playwright/test";
const url=process.env.OCEANTWIN_LIVE_URL;
test("Water Column science tooltip never changes the canvas/control-row geometry",async({page})=>{
  test.setTimeout(180000);
  if(!url||!/^https?:\/\//.test(url)) throw Error("actual browser URL required");
  await page.setViewportSize({width:1440,height:900});
  await page.goto(url.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const skip=page.getByRole("button",{name:"Skip journey"});
  if(await skip.isVisible().catch(()=>false)) await skip.click();
  const area=page.getByTestId("mpr-12-water-column-section");
  const shell=area.locator(".water-column-shell:not(.water-column-loading)");
  const canvas=shell.locator("canvas.water-column-canvas");
  await expect(canvas).toBeVisible({timeout:60000});
  await canvas.scrollIntoViewIfNeeded();
  const tools=shell.locator(".renderer-tools");
  const tooltip=shell.locator(".water-column-hover");
  const nativeDepth=await area.getAttribute("data-native-depth");
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const initial=await Promise.all([canvas.boundingBox(),tools.boundingBox()]);
  const c=initial[0];if(!c||!initial[1])throw Error("real canvas/tools missing");
  let found=false;
  for(let ix=1;ix<=13&&!found;ix++){
    for(let iy=1;iy<=11&&!found;iy++){
      await page.mouse.move(c.x+c.width*ix/14,c.y+c.height*iy/12);
      if(await tooltip.count()===1){found=true;break;}
    }
  }
  expect(found,"a real scientific hovered model point must be inspectable").toBe(true);
  await expect(tooltip).toContainText("Scientific inspection");
  const position=await tooltip.evaluate(node=>getComputedStyle(node).position);
  expect(position,"hover must not enter or resize renderer-tools flex layout").toBe("absolute");
  const hovered=await Promise.all([canvas.boundingBox(),tools.boundingBox()]);
  expect(Math.abs(hovered[0]!.height-c.height)).toBeLessThanOrEqual(2);
  expect(Math.abs(hovered[1]!.height-initial[1]!.height)).toBeLessThanOrEqual(2);
  await page.mouse.move(2,2);
  await expect(tooltip).toHaveCount(0);
  const cleared=await tools.boundingBox();
  expect(Math.abs(cleared!.height-initial[1]!.height)).toBeLessThanOrEqual(2);
  await expect(area).toHaveAttribute("data-native-depth",nativeDepth??"");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source??"glorys");
});

test("Water Column mobile pointer inspection keeps control-row geometry stable",async({page})=>{
  test.setTimeout(180000);
  if(!url||!/^https?:\/\//.test(url)) throw Error("actual browser URL required");
  await page.setViewportSize({width:390,height:844});
  await page.goto(url.replace(/#.*$/,"")+"#/explore",{waitUntil:"domcontentloaded"});
  const skip=page.getByRole("button",{name:"Skip journey"});
  if(await skip.isVisible().catch(()=>false)) await skip.click();
  const area=page.getByTestId("mpr-12-water-column-section");
  const shell=area.locator(".water-column-shell:not(.water-column-loading)");
  const canvas=shell.locator("canvas.water-column-canvas");
  await expect(canvas).toBeVisible({timeout:60000});
  await canvas.scrollIntoViewIfNeeded();
  const tools=shell.locator(".renderer-tools");
  const tooltip=shell.locator(".water-column-hover");
  const nativeDepth=await area.getAttribute("data-native-depth");
  const source=await page.locator(".ocean-workbench").getAttribute("data-explore-source");
  const initial=await Promise.all([canvas.boundingBox(),tools.boundingBox()]);
  const c=initial[0];if(!c||!initial[1])throw Error("real canvas/tools missing");
  let found=false;
  for(let ix=1;ix<=13&&!found;ix++){
    for(let iy=1;iy<=11&&!found;iy++){
      await page.mouse.move(c.x+c.width*ix/14,c.y+c.height*iy/12);
      if(await tooltip.count()===1){found=true;break;}
    }
  }
  expect(found,"a real scientific hovered model point must be inspectable").toBe(true);
  await expect(tooltip).toContainText("Scientific inspection");
  const position=await tooltip.evaluate(node=>getComputedStyle(node).position);
  expect(position,"hover must not enter or resize renderer-tools flex layout").toBe("absolute");
  const hovered=await Promise.all([canvas.boundingBox(),tools.boundingBox()]);
  expect(Math.abs(hovered[0]!.height-c.height)).toBeLessThanOrEqual(2);
  expect(Math.abs(hovered[1]!.height-initial[1]!.height)).toBeLessThanOrEqual(2);
  await page.mouse.move(2,2);
  await expect(tooltip).toHaveCount(0);
  const cleared=await tools.boundingBox();
  expect(Math.abs(cleared!.height-initial[1]!.height)).toBeLessThanOrEqual(2);
  await expect(area).toHaveAttribute("data-native-depth",nativeDepth??"");
  await expect(page.locator(".ocean-workbench")).toHaveAttribute("data-explore-source",source??"glorys");
});
