import { apiError } from "@/lib/apiResponse";

interface Bucket { count:number;resetAt:number }
const buckets = new Map<string,Bucket>();

// Expired buckets used to stay in the map for the lifetime of the process, so
// a long-running instance accumulated one entry per scope per client address
// and never gave any of them back. Sweeping on a bounded interval keeps the map
// proportional to live traffic instead of to traffic ever seen.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweepExpired(now:number) {
    if(now-lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;
    for(const [key,bucket] of buckets){
        if(bucket.resetAt <= now) buckets.delete(key);
    }
}

export function enforceRateLimit(request:Request,scope:string,limit:number,windowMs=60_000) {
    const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const identity=forwarded || request.headers.get("x-real-ip") || "local";
    const key=`${scope}:${identity}`;const now=Date.now();
    sweepExpired(now);
    const current=buckets.get(key);
    if(!current || current.resetAt<=now){ buckets.set(key,{count:1,resetAt:now+windowMs});return null; }
    if(current.count>=limit) return apiError("Too many requests. Please try again shortly.",429,"rate_limit_exceeded");
    current.count+=1;return null;
}
