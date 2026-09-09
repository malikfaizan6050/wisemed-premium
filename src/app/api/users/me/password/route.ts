import { adminAuth } from "@/lib/firebase-admin";
import { readJsonObject,userApiError } from "@/lib/userApiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";
import { completeTemporaryPasswordSetup,UserServiceError } from "@/services/userService";
import { NextResponse } from "next/server";

export async function PATCH(request:Request) {
    const limited = enforceRateLimit(request,"temporary-password-change",5,15*60_000);
    if(limited) return limited;

    try {
        const authorization = request.headers.get("authorization");
        if(!authorization?.startsWith("Bearer ")){
            throw new UserServiceError("Authentication required",401,"unauthenticated");
        }
        const decoded = await adminAuth.verifyIdToken(authorization.slice(7),true).catch(()=>{
            throw new UserServiceError("Authentication required",401,"unauthenticated");
        });
        const body = await readJsonObject(request);
        return NextResponse.json(await completeTemporaryPasswordSetup(decoded.uid,body.newPassword),{ headers:{ "Cache-Control":"no-store" } });
    }
    catch(error){
        return userApiError(error);
    }
}
