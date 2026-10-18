import {expect,test} from "@playwright/test";
import {VerifiedFrameCache,FailClosedRequest,assertPilotAssetUrl,
  validateLocalScientificUpload,integrityPreservingLod,sourceTransferObservation
} from "../src/m088-performance-security";
test("M088 measurements are explicitly unmeasured until real browser resources exist",()=>{
 const data=sourceTransferObservation(null,null);
 expect(data.entryType).toBe("unmeasured");
 expect(data.gpuMeasured).toBe(false);
 expect(data.scientificSamples).toBeNull();
});
test("M089 source cache accepts only verified original bytes and never mutates caller",()=>{
 const cache=new VerifiedFrameCache(1024),sha="a".repeat(64);
 const sample=Uint8Array.from([11,24,35]);
 expect(()=>cache.set("IO-001","2004-03-15",sha,sample,false)).toThrow();
 cache.set("IO-001","2004-03-15",sha,sample,true);
 sample[0]=0;
 const returned=cache.get("IO-001","2004-03-15",sha)!;
 expect(returned[0]).toBe(11);
 returned[0]=0;
 expect(cache.get("IO-001","2004-03-15",sha)![0]).toBe(11);
 const points=[[67,12,0.5,21],[67,12,20,19]] as const;
 const lod=integrityPreservingLod(points,1);
 expect(lod.newScientificValues).toBe(0);
 expect(lod.points.every(p=>points.includes(p))).toBe(true);
});
test("M090 stale and cancelled results cannot become source science",()=>{
 const q=new FailClosedRequest(),a=q.begin(),b=q.begin();
 expect(a.signal.aborted).toBe(true);expect(q.allow(a.version)).toBe(false);
 expect(q.allow(b.version)).toBe(true);
 q.stop();expect(q.allow(b.version)).toBe(false);
});
test("M091 only safe same-origin raw pilot asset paths and uploads",()=>{
 const origin="https://example.org";
 expect(assertPilotAssetUrl("/main-blocks/data/IO-001/2004-03-15.json",origin))
 .toBe("https://example.org/main-blocks/data/IO-001/2004-03-15.json");
 for(const url of ["https://attacker.invalid/main-blocks/data/IO-001/2004-03-15.json",
 "/main-blocks/data/IO-001/2004-03-15.json?token=private",
 "/main-blocks/data/IO-001/%2e%2e/test.json"]){
   expect(()=>assertPilotAssetUrl(url,origin)).toThrow();
 }
 expect(validateLocalScientificUpload("ARGO_1.nc",2048,"application/x-netcdf").privacy)
 .toBe("never-auto-publish");
 expect(()=>validateLocalScientificUpload("../../secrets.csv",1024,"text/csv")).toThrow();
});
