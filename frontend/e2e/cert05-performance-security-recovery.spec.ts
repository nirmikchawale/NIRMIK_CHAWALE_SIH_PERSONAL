import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {expect,test} from "@playwright/test";
import {FailClosedRequest,VerifiedFrameCache,assertPilotAssetUrl,
validateLocalScientificUpload,sourceTransferObservation,integrityPreservingLod
} from "../src/m088-performance-security";
const live=process.env.OCEANTWIN_LIVE_URL;
function preview(){
 if(!live)throw new Error("CERT05 requires the actual running preview");
 return live.replace(/#.*$/,"")+"#/explore";
}
const manifest=JSON.parse(readFileSync(new URL("../public/main-blocks/manifest.json",import.meta.url),"utf8"));
const record=manifest.blocks.find((b:{id:string})=>b.id==="IO-001").payloads[0];
const originalBytes=readFileSync(new URL("../public/main-blocks/data/IO-001/2004-03-15.json",import.meta.url));
test("CERT05 verifies genuine original SHA before cache insertion",async()=>{
 const cache=new VerifiedFrameCache(originalBytes.length*2+1024);
 const valid=Uint8Array.from(originalBytes);
 await cache.setVerifiedSha256("IO-001","2004-03-15",record.sha256,valid);
 expect(cache.stats().bytes).toBe(valid.length);
 const tampered=Uint8Array.from(valid);tampered[128]^=1;
 await expect(cache.setVerifiedSha256("IO-001","2004-03-15",record.sha256,tampered)).rejects.toThrow(/SHA-256 mismatch/);
 expect(cache.stats().entries).toBe(1);
 expect(cache.get("IO-001","2004-03-15",record.sha256)?.[128]).toBe(valid[128]);
});
test("CERT05 bounded eviction, stale requests and no pre-begin acceptance",()=>{
 const cache=new VerifiedFrameCache(1024),sha=(c:string)=>c.repeat(64);
 cache.set("IO-001","2004-03-15",sha("a"),new Uint8Array(610),true);
 cache.set("IO-002","2004-03-15",sha("b"),new Uint8Array(610),true);
 expect(cache.stats()).toMatchObject({entries:1,bytes:610,budget:1024});
 expect(cache.get("IO-001","2004-03-15",sha("a"))).toBeNull();
 expect(()=>cache.set("IO-003","2004-03-15",sha("c"),new Uint8Array(1025),true)).toThrow();
 const gate=new FailClosedRequest();
 expect(gate.allow(0)).toBe(false);
 const a=gate.begin(),b=gate.begin();
 expect(a.signal.aborted).toBe(true);
 expect(gate.allow(a.version)).toBe(false);
 expect(gate.allow(b.version)).toBe(true);
 gate.stop();
 expect(gate.allow(b.version)).toBe(false);
});
test("CERT05 same-origin source URL, strict upload MIME and immutable LOD",()=>{
 const origin="https://example.org";
 for(const url of ["//evil.invalid/main-blocks/data/IO-001/2004-03-15.json",
  "/main-blocks/data/IO-001/2004-03-15.json#secret",
  "/main-blocks/data/IO-001/%2e%2e/2004-03-15.json",
  "/main-blocks/data/IO-001/2004-03-15.json?private=1",
  "https://attacker.invalid/main-blocks/data/IO-001/2004-03-15.json"]) {
  expect(()=>assertPilotAssetUrl(url,origin)).toThrow();
 }
 expect(validateLocalScientificUpload("native.nc",1024,"application/x-netcdf").privacy).toBe("never-auto-publish");
 for(const [name,mime] of [["native.json","text/csv"],["native.csv","application/json"],
  ["native.nc","text/csv"],["../../secret.nc","application/x-netcdf"]]){
  expect(()=>validateLocalScientificUpload(name,1200,mime)).toThrow();
 }
 const exact=[[60,23,0.5,20],[61,23,20,18],[62,23,50,16]] as const;
 const lod=integrityPreservingLod(exact,2);
 expect(lod.lossyNumericalResampling).toBe(false);
 expect(lod.points.every(p=>exact.includes(p))).toBe(true);
 expect(sourceTransferObservation(null,null)).toMatchObject({entryType:"unmeasured",gpuMeasured:false});
});
test("CERT05 actual source-backed browser timing; GPU explicitly unmeasured",async({page},info)=>{
 test.setTimeout(210_000);
 await page.setViewportSize({width:1440,height:900});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.addInitScript(()=>localStorage.setItem("oceancanvas-active-main-block-v1","IO-001"));
 const started=Date.now();
 await page.goto(preview(),{waitUntil:"domcontentloaded"});
 const geo=page.locator("#mpr-3d-stage"),water=page.getByTestId("mpr-12-water-column-section");
 await expect(geo).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
 await expect(water).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
 const resources=await page.evaluate(()=>{
  const n=performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const e=performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  return {navigationMs:n[0]?.duration??null,resourceCount:e.length,
   originalFrameResources:e.filter(x=>x.name.includes("main-blocks/data/IO-001/"))
    .map(x=>({name:x.name,durationMs:x.duration,transferBytes:x.transferSize,decodedBodyBytes:x.decodedBodySize}))};
 });
 expect(resources.resourceCount).toBeGreaterThan(0);
 expect(resources.originalFrameResources.length).toBeGreaterThan(0);
 const report={schema:"oceancanvas-cert05-browser-resource-v1",realBrowser:true,
  measuredAtUtc:new Date().toISOString(),elapsedToBothVerifiedMs:Date.now()-started,
  observedResources:resources,gpuMeasured:false,gpuTimings:"UNMEASURED",jsHeapBytes:"UNMEASURED"};
 mkdirSync("certification-evidence/cert05",{recursive:true});
 writeFileSync("certification-evidence/cert05/performance.json",JSON.stringify(report,null,2)+"\n");
 await info.attach("cert05-actual-resource-measurements.json",{body:Buffer.from(JSON.stringify(report,null,2)),contentType:"application/json"});
});
test("CERT05 denied genuine source frame fails closed; retry recovers original data",async({page})=>{
 test.setTimeout(180_000);
 await page.addInitScript(()=>localStorage.setItem("oceancanvas-active-main-block-v1","IO-001"));
 let rejected=0;
 await page.route("**/main-blocks/data/IO-001/2004-03-15.json",route=>{rejected++;return route.abort("failed");});
 await page.goto(preview(),{waitUntil:"domcontentloaded"});
 await expect(page.locator(".boot-error-card")).toBeVisible({timeout:45_000});
 expect(rejected).toBeGreaterThan(0);
 await expect(page.locator(".water-column-shell")).toHaveCount(0);
 await page.unroute("**/main-blocks/data/IO-001/2004-03-15.json");
 await page.reload({waitUntil:"domcontentloaded"});
 await expect(page.locator("#mpr-3d-stage")).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
 await expect(page.getByTestId("mpr-12-water-column-section")).toHaveAttribute("data-linked-evidence","verified",{timeout:60_000});
});