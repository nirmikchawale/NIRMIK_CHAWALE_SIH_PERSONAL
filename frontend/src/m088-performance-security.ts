/**
 * M088-M095: truthful measurement, source-index-only cache, stale-request
 * protection and safe source URL/user file intake. Does not fetch or publish.
 */
import { nativeDepthBalancedLodIndices } from "./main-block-lod";

const SHA=/^[0-9a-f]{64}$/;
const FRAME_PATH=/\/main-blocks\/data\/IO-\d{3}\/\d{4}-\d{2}-\d{2}\.json$/;
export type SourcePerf = {url:string; transferBytes:number;durationMs:number;
  entryType:"resource"|"unmeasured";gpuMeasured:false;scientificSamples:number|null};

export function sourceTransferObservation(resource:PerformanceResourceTiming|null,scientificSamples:number|null):SourcePerf {
  if(scientificSamples!==null && (!Number.isSafeInteger(scientificSamples)||scientificSamples<0)){
    throw new Error("M088 source sample count invalid");
  }
  if(!resource) return {url:"",transferBytes:0,durationMs:0,
    entryType:"unmeasured",gpuMeasured:false,scientificSamples};
  return {url:resource.name,transferBytes:resource.transferSize,durationMs:resource.duration,
    entryType:"resource",gpuMeasured:false,scientificSamples};
}

/** M089 preserve exact tuple values, indices and true depth layer representation. */
export function integrityPreservingLod(source:readonly (readonly number[])[],sampleBudget:number) {
  const indices=nativeDepthBalancedLodIndices(source,sampleBudget);
  return {indices,points:indices.map(i=>source[i]),
    newScientificValues:0,lossyNumericalResampling:false};
}

/**
 * M089 bounded cache stores verified raw source bytes ONLY AFTER original
 * SHA verification by the existing native loader. Callers supply verified=true.
 * A cached blob is never treated as a substitute for source rights or QC.
 */
export class VerifiedFrameCache {
  private items=new Map<string,Uint8Array>();
  private currentBytes=0;
  constructor(private readonly budgetBytes=32*1024*1024) {
    if(!Number.isSafeInteger(budgetBytes)||budgetBytes<1024) throw new Error("M089 cache budget invalid");
  }
  private key(block:string,date:string,digest:string) {
    if(!/^IO-\d{3}$/.test(block)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!SHA.test(digest)){
      throw new Error("M089 source address/hash is invalid");
    }
    return block+"|"+date+"|"+digest;
  }
  set(block:string,date:string,digest:string,bytes:Uint8Array,verified:boolean) {
    const key=this.key(block,date,digest);
    if(!verified)throw new Error("M089 unverified source never enters science cache");
    if(!bytes.length||bytes.length>this.budgetBytes)throw new Error("M089 source exceeds cache allowance");
    const old=this.items.get(key);
    if(old){this.currentBytes-=old.byteLength;this.items.delete(key);}
    while(this.items.size && this.currentBytes+bytes.length>this.budgetBytes){
      const oldest=this.items.keys().next().value;
      if(oldest===undefined)break;
      this.currentBytes-=this.items.get(oldest)!.byteLength;
      this.items.delete(oldest);
    }
    const immutableCopy=Uint8Array.from(bytes);
    this.items.set(key,immutableCopy);this.currentBytes+=immutableCopy.length;
  }
  /** Cryptographically verify native source bytes before inserting in a cache. */
  async setVerifiedSha256(block:string,date:string,digest:string,bytes:Uint8Array) {
    this.key(block,date,digest);
    const copy=Uint8Array.from(bytes);
    const hashed=await crypto.subtle.digest("SHA-256",copy as Uint8Array<ArrayBuffer>);
    const actual=[...new Uint8Array(hashed)].map(b=>b.toString(16).padStart(2,"0")).join("");
    if(actual!==digest) throw new Error("M089 source SHA-256 mismatch: cache write refused");
    this.set(block,date,digest,copy,true);
  }
  get(block:string,date:string,digest:string):Uint8Array|null{
    const bytes=this.items.get(this.key(block,date,digest));
    return bytes ? Uint8Array.from(bytes) : null;
  }
  clear(){this.items.clear();this.currentBytes=0;}
  stats(){return {entries:this.items.size,bytes:this.currentBytes,budget:this.budgetBytes};}
}

/** M090 reject late async/network results even if transport ignored abort. */
export class FailClosedRequest {
  private version=0;
  private running:AbortController|null=null;
  begin() {
    this.running?.abort();
    this.running=new AbortController();
    return {version:++this.version,signal:this.running.signal};
  }
  allow(version:number) {return this.running!==null && version>0 && version===this.version && !this.running.signal.aborted;}
  stop(){this.running?.abort();this.version++;}
}

/** M091 same-origin locked native pilot files, never third-party dynamic fetch. */
export function assertPilotAssetUrl(candidate:string,applicationOrigin:string):string {
  const app=new URL(applicationOrigin);
  const url=new URL(candidate,applicationOrigin);
  if(url.origin!==app.origin||url.username||url.password||url.search||url.hash||
    !(url.protocol==="https:" || (url.protocol==="http:" &&
     (url.hostname==="localhost"||url.hostname==="127.0.0.1"))) ||
    !FRAME_PATH.test(url.pathname)||/%2f|%5c|%2e/i.test(candidate)){
    throw new Error("M091 untrusted remote source URL rejected");
  }
  return url.href;
}

/** M091 defensive upload acceptance is a parser guard, NOT storage or publication. */
export function validateLocalScientificUpload(
  filename:string,byteSize:number,extensionType:string
):{filename:string;bytes:number;privacy:"never-auto-publish"} {
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}\.(nc|csv|json)$/.test(filename)||
    filename.includes("..")|| !Number.isSafeInteger(byteSize) || byteSize<=0 ||
    byteSize>128*1024*1024 ||
    !["application/x-netcdf","text/csv","application/json"].includes(extensionType)){
    throw new Error("M091 upload rejected: size, extension or media type invalid");
  }
  const suffix=filename.slice(filename.lastIndexOf(".")+1).toLowerCase();
  const mediaBySuffix:Record<string,string>={
    nc:"application/x-netcdf",csv:"text/csv",json:"application/json"
  };
  if(mediaBySuffix[suffix]!==extensionType) {
    throw new Error("M091 upload rejected: file extension and declared MIME disagree");
  }
  return {filename,bytes:byteSize,privacy:"never-auto-publish"};
}
