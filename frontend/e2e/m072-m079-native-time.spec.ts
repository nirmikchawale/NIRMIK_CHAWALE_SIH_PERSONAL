import {expect,test} from "@playwright/test";
import {readFileSync} from "node:fs";
import {assertSourceNativeFrameTime,nativeFrameSelection,nativeTimeWindow,sourceVariableGate,
  eligibleDensityInput,eligibilityForOceanPhysics,linkedFrameKey} from "../src/m072-native-time-physics";
const inventory=JSON.parse(readFileSync(new URL("../public/main-blocks/manifest.json",import.meta.url),"utf8"));
test("M072-M074 real multi-frame timestamps only and no synthetic years",()=>{
 const block=inventory.blocks.find((b:{id:string})=>b.id==="IO-001");
 const frames=block.payloads.map((p:{date:string;sha256:string})=>({date:p.date,time:p.date+"T12:00:00Z",sourceSha256:p.sha256}));
 expect(frames).toHaveLength(2);
 expect(nativeFrameSelection(frames,"2004-03-15").date).toBe("2004-03-15");
 expect(()=>nativeFrameSelection(frames,"2024-01-02")).toThrow(/no synthetic/);
 expect(assertSourceNativeFrameTime(block.available_dates,frames[0].date,frames[0].time).timeSemantics).toBe("daily_mean");
 expect(()=>nativeTimeWindow("daily-model","2004-03-15T00:00:00Z","2004-03-16T00:00:00Z","2024-01-02T00:00:00Z")).toThrow();
 expect(linkedFrameKey(block.id,frames[0])).toContain(frames[0].sourceSha256);
});
test("M075-M079 source dimensionality/QC/physics deny invented products",()=>{
 expect(sourceVariableGate("satellite-surface","chlorophyll",0).geometry).toBe("surface");
 expect(()=>sourceVariableGate("satellite-surface","chlorophyll",10)).toThrow();
 expect(()=>sourceVariableGate("bgc-profile","thetao",20)).toThrow();
 expect(eligibleDensityInput({temperaturePotentialC:21,practicalSalinity:34,
 pressureDbar:null,longitude:67,latitude:12,sourceQcAccepted:true}).eligible).toBe(false);
 const physics=eligibilityForOceanPhysics({hasGenuineNativeProfiles:false,depthLevels:0,modelTimeFrames:1,
 maskVerified:false,densityCalculatedWithGsw:false,heatCapacityAvailable:false});
 expect(physics.heatContent).toBe(false);expect(physics.realPlayback).toBe(false);
 expect(physics.cyclonePrediction).toBe(false);
});
