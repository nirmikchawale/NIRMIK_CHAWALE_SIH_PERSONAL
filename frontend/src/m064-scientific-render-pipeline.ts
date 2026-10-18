/** M064-M071: source-native extra integrity, request, LOD and sync gates. */
import type { PilotBlockPayload } from "./pilot-main-block-loader";
import { nativeDepthBalancedLodIndices } from "./main-block-lod";

export interface NativeRenderEvidence {
  blockId: string; date: string; depthCount: number; wetSamples: number;
  pairedHorizontalVectors: number; verticalCurrentAvailable: false;
  originalCoordinatesPreserved: true; modelObservationValidated: false;
}
function axis(values: readonly number[], name: string) {
  if (values.length < 2) throw new Error("M066 " + name + " missing native axis");
  if (values.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= values[i-1]))) {
    throw new Error("M066 " + name + " not ascending and finite");
  }
}
export function inspectSourceBackedRenderFrame(payload: PilotBlockPayload): NativeRenderEvidence {
  const c = payload.coordinates, b = payload.bounds;
  if (payload.schema !== "oceancanvas-main-block-pilot-v1" || payload.ocean_relevance === "land") {
    throw new Error("M064 only source-backed ocean frames");
  }
  if (payload.integrity.synthetic_measurements || payload.integrity.synthetic_depths ||
      payload.integrity.vertical_component_available || c.depth_positive !== "down") {
    throw new Error("M064 synthetic science or unsupported vertical currents");
  }
  axis(c.longitude, "longitude"); axis(c.latitude, "latitude"); axis(c.depth_m, "depth");
  if (c.depth_m[0] < 0 ||
      c.longitude[0] < b.west - 0.0001 || c.longitude[c.longitude.length-1] > b.east + 0.0001 ||
      c.latitude[0] < b.south - 0.0001 || c.latitude[c.latitude.length-1] > b.north + 0.0001) {
    throw new Error("M069 native source grid outside canonical block bounds");
  }
  const n = c.longitude.length * c.latitude.length * c.depth_m.length;
  if (payload.shape.longitude !== c.longitude.length ||
      payload.shape.latitude !== c.latitude.length || payload.shape.depth !== c.depth_m.length) {
    throw new Error("M066 source dimensions disagree with native grid");
  }
  const {thetao, so, uo, vo} = payload.variables;
  const fields = [thetao, so, uo, vo];
  if (fields.some(f => !f || f.values.length !== n)) throw new Error("M066 source cube dimensions mismatch");
  let wet = 0, horizontal = 0, scalars = 0;
  for (let i = 0; i < n; i++) {
    const row = fields.map(f => f.values[i]);
    if (row.some(v => v !== null && (typeof v !== "number" || !Number.isFinite(v)))) {
      throw new Error("M069 missing wet masks not retained as null");
    }
    if (row.some(v => v !== null)) wet++;
    if (thetao.values[i] !== null || so.values[i] !== null) scalars++;
    if (uo.values[i] !== null && vo.values[i] !== null) horizontal++;
  }
  if (!wet || !horizontal || !scalars) throw new Error("M064 no finite native ocean samples");
  if (payload.time_semantics !== "daily_mean" || !payload.time.endsWith("Z") ||
      !Number.isFinite(Date.parse(payload.time))) throw new Error("M064 native time unavailable");
  return {blockId:payload.block_id, date:payload.time.slice(0,10),
    depthCount:c.depth_m.length, wetSamples:wet, pairedHorizontalVectors:horizontal,
    verticalCurrentAvailable:false, originalCoordinatesPreserved:true,
    modelObservationValidated:false};
}
export class ScientificRenderGeneration {
  private generation=0;
  private pending: AbortController | null=null;
  begin() {
    this.pending?.abort();
    this.pending=new AbortController();
    return {token:++this.generation, signal:this.pending.signal};
  }
  isCurrent(token:number) {return this.generation===token && this.pending?.signal.aborted===false;}
  cancel() {this.pending?.abort();this.generation++;}
}
export function clipNativeSamples<T extends readonly number[]>(
  source:readonly T[], area:{west:number;east:number;south:number;north:number;minDepthM:number;maxDepthM:number}
):readonly T[] {
  const {west,east,south,north,minDepthM,maxDepthM}=area;
  if (![west,east,south,north,minDepthM,maxDepthM].every(Number.isFinite) ||
      west>=east || south>=north || minDepthM<0 || minDepthM>maxDepthM) {
    throw new Error("M067 invalid source clipping region");
  }
  return source.filter(p=>p.length>=4 && p.every(Number.isFinite) &&
    p[0]>=west && p[0]<=east && p[1]>=south && p[1]<=north &&
    p[2]>=minDepthM && p[2]<=maxDepthM);
}
export function horizontalCurrentSpeed(u:number|null,v:number|null):number|null {
  return u===null||v===null ? null : Number.isFinite(u)&&Number.isFinite(v) ? Math.hypot(u,v):null;
}
export function planNativeRenderBudget(source:readonly (readonly number[])[],budget:number,focusDepth?:number) {
  const indices=nativeDepthBalancedLodIndices(source,budget,focusDepth);
  return {sourceSamples:source.length,indices,selectedSamples:indices.length,
    sourceValuesRetained:true,gpuBenchmarkMeasured:false};
}
export function assertSynchronizedScience(a:{blockId:string;date:string},
    b:{blockId:string;date:string},c:{blockId:string;date:string}) {
  if(a.blockId!==b.blockId || a.blockId!==c.blockId || a.date!==b.date || a.date!==c.date) {
    throw new Error("M071 geographic/water/inspector source mismatch");
  }
}
