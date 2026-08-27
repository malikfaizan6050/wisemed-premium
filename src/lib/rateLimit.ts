import { apiError } from "@/lib/apiResponse";

interface Bucket { count:number;resetAt:number }
const buckets = new Map<string,Bucket>();

export function enforceRateLimit(request:Request,scope:string,limit:number,windowMs=60_000) {
    const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const identity=forwarded || request.headers.get("x-real-ip") || "local";
    const key=`${scope}:${identity}`;const now=Date.now();const current=buckets.get(key);
    if(!current || current.resetAt<=now){ buckets.set(key,{count:1,resetAt:now+windowMs});return null; }
    if(current.count>=limit) return apiError("Too many requests. Please try again shortly.",429,"rate_limit_exceeded");
    current.count+=1;return null;
}
