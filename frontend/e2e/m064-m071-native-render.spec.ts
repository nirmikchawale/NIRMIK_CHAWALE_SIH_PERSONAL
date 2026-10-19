import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  inspectSourceBackedRenderFrame, ScientificRenderGeneration,
  clipNativeSamples, horizontalCurrentSpeed, planNativeRenderBudget,
  assertSynchronizedScience
} from "../src/m064-scientific-render-pipeline";
import type { PilotBlockPayload } from "../src/pilot-main-block-loader";
const readOriginal = () => JSON.parse(readFileSync(
  new URL("../public/main-blocks/data/IO-001/2004-03-15.json", import.meta.url),"utf8")) as PilotBlockPayload;
test("M064 preserves genuine pilot source shape, native mask and original depth", () => {
  const p=readOriginal(), verified=inspectSourceBackedRenderFrame(p);
  expect(verified.blockId).toBe("IO-001");
  expect(verified.depthCount).toBe(p.coordinates.depth_m.length);
  expect(verified.verticalCurrentAvailable).toBe(false);
  expect(verified.modelObservationValidated).toBe(false);
  const fake=structuredClone(p);fake.integrity.synthetic_measurements=true;
  expect(()=>inspectSourceBackedRenderFrame(fake)).toThrow(/synthetic/);
});
test("M065 aborts obsolete source generation",()=>{
  const g=new ScientificRenderGeneration(), first=g.begin(), second=g.begin();
  expect(first.signal.aborted).toBe(true);expect(g.isCurrent(first.token)).toBe(false);
  expect(g.isCurrent(second.token)).toBe(true);g.cancel();expect(g.isCurrent(second.token)).toBe(false);
});
test("M067-M071 original tuples, u/v only, depth LOD and view consistency",()=>{
  const p=[[67,12,1,25],[67.5,12.2,80,22]] as const;
  const filtered=clipNativeSamples(p,{west:66,east:69,south:11,north:13,minDepthM:0,maxDepthM:30});
  expect(filtered).toHaveLength(1);expect(filtered[0]).toBe(p[0]);
  expect(horizontalCurrentSpeed(3,4)).toBe(5);
  expect(horizontalCurrentSpeed(null,4)).toBeNull();
  const plan=planNativeRenderBudget(p,1);expect(plan.indices.every(i=>i<p.length)).toBe(true);
  const a={blockId:"IO-001",date:"2004-03-15"};
  expect(()=>assertSynchronizedScience(a,a,a)).not.toThrow();
  expect(()=>assertSynchronizedScience(a,a,{...a,date:"2024-01-02"})).toThrow();
});
