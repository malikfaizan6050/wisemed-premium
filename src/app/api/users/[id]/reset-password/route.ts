import { requirePermission } from "@/lib/apiAuth";
import { userApiError } from "@/lib/userApiResponse";
import { handlePasswordAction } from "@/services/userService";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const limited = enforceRateLimit(request,"employee-invitation",10);
    if(limited) return limited;
    const authorization = await requirePermission(request,"users.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        return NextResponse.json(await handlePasswordAction(id,authorization.user),{ headers:{ "Cache-Control":"no-store" } });
    }
    catch(error){
        return userApiError(error);
    }
}
