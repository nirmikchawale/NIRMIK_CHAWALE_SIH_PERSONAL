/** M072–M079 source-native time/variables/physics; never fabricate temporal frames. */
export type NativeSourceClass = "daily-model"|"instantaneous-model"|"satellite-surface"|"bgc-profile";
export interface NativeTimeFrame {date:string; time:string; sourceSha256:string;}
const SHA=/^[0-9a-f]{64}$/;
const DATE=/^\d{4}-\d\d-\d\d$/;

export function assertSourceNativeFrameTime(availableDates:readonly string[],date:string,stamp:string) {
  if (!availableDates.includes(date) || !DATE.test(date) ||
      !stamp.endsWith("Z") || !Number.isFinite(Date.parse(stamp)) ||
      stamp.slice(0,10)!==date) throw new Error("M072 native source time and manifest date disagree");
  return {date,time:stamp,timeSemantics:"daily_mean" as const};
}
export function nativeFrameSelection(frames:readonly NativeTimeFrame[],date:string):NativeTimeFrame {
  if (new Set(frames.map(f=>f.date)).size!==frames.length ||
      frames.some(f=>!DATE.test(f.date) || f.time.slice(0,10)!==f.date ||
        !f.time.endsWith("Z") || !Number.isFinite(Date.parse(f.time)) ||
        !SHA.test(f.sourceSha256))) {
    throw new Error("M073 original source frame date/time/hash inventory inconsistent");
  }
  const match=frames.find(f=>f.date===date);
  if(!match)throw new Error("M074 unavailable source frame: no synthetic timestamp interpolation");
  return match;
}
export function nativeTimeWindow(
  kind:NativeSourceClass,modelStartUtc:string,modelEndUtc:string|null,observationUtc:string
) {
  const start=Date.parse(modelStartUtc), obs=Date.parse(observationUtc), end=modelEndUtc?Date.parse(modelEndUtc):NaN;
  if(!modelStartUtc.endsWith("Z")||!observationUtc.endsWith("Z") ||
     !Number.isFinite(start)||!Number.isFinite(obs))throw new Error("M072 invalid UTC source times");
  if(kind==="daily-model") {
    if(!modelEndUtc?.endsWith("Z") || !Number.isFinite(end) || end<=start ||
       end-start>86400_000 || !(start<=obs&&obs<end))throw new Error("M074 observation outside native daily-mean coverage");
    return {kind,windowStart:modelStartUtc,windowEndExclusive:modelEndUtc,interpretation:"interval-average" as const};
  }
  if(kind==="instantaneous-model") {
    if(obs!==start)throw new Error("M074 instantaneous sample cannot inherit neighbouring time");
    return {kind,windowStart:modelStartUtc,windowEndExclusive:null,interpretation:"instantaneous" as const};
  }
  throw new Error("M072 surface and BGC observations are not model-time forecasts");
}
/** M075: a surface chlorophyll image cannot become a fabricated BGC 3D column. */
export function sourceVariableGate(kind:NativeSourceClass,variable:string,requestedDepthM:number) {
  if(!Number.isFinite(requestedDepthM)||requestedDepthM<0)throw new Error("M075 depth invalid");
  if(kind==="satellite-surface") {
    if(variable!=="chlorophyll"||requestedDepthM!==0)throw new Error("M075 satellite only provides source surface chlorophyll");
    return {geometry:"surface" as const,independentValidation:false};
  }
  if(kind==="bgc-profile") {
    if(!["dissolved_oxygen","chlorophyll","nitrate","ph"].includes(variable)) {
      throw new Error("M076 BGC profile requires measured native variable");
    }
    return {geometry:"measured-profile" as const,independentValidation:false};
  }
  if(!["thetao","so","uo","vo"].includes(variable))throw new Error("M076 unsupported native model variable");
  return {geometry:"native-water-column" as const,independentValidation:false};
}
export function eligibleDensityInput(input:{
  temperaturePotentialC:number|null; practicalSalinity:number|null; pressureDbar:number|null;
  longitude:number;latitude:number;sourceQcAccepted:boolean;
}) {
  const vals=[input.temperaturePotentialC,input.practicalSalinity,input.pressureDbar,input.longitude,input.latitude];
  if(!input.sourceQcAccepted||vals.some(v=>v===null||!Number.isFinite(v))) {
    return {eligible:false as const,reason:"M077 native T/S/pressure/QC missing"};
  }
  if(input.pressureDbar!<0||input.practicalSalinity!<0 || input.practicalSalinity!>50) {
    return {eligible:false as const,reason:"M077 source pressure/salinity outside domain"};
  }
  return {eligible:true as const,reason:"Provider inputs eligible for separately computed TEOS-10; no density fabricated"};
}
/** M078: scientific derived fields are not computed from missing physics or sparse slices. */
export function eligibilityForOceanPhysics(input:{
  hasGenuineNativeProfiles:boolean;depthLevels:number;modelTimeFrames:number;
  maskVerified:boolean; densityCalculatedWithGsw:boolean;heatCapacityAvailable:boolean;
}) {
  const base=input.hasGenuineNativeProfiles && input.maskVerified && input.depthLevels>=3;
  return {
    thermocline:base,
    mixedLayerDepth:base&&input.densityCalculatedWithGsw,
    heatContent:base&&input.heatCapacityAvailable && input.densityCalculatedWithGsw,
    cyclonePrediction:false,
    realPlayback:input.modelTimeFrames>=2,
    note:"Eligibility only; no derived values or model-skill scores asserted"
  };
}
/** M079: one synchronised native identifier across all scientific views. */
export function linkedFrameKey(blockId:string,frame:NativeTimeFrame) {
  if(!/^IO-\d{3}$/.test(blockId)||!SHA.test(frame.sourceSha256))throw new Error("M079 source/frame identity invalid");
  return [blockId,frame.date,frame.sourceSha256].join("|");
}
