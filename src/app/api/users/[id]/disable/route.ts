import { requirePermission } from "@/lib/apiAuth";
import { userApiError } from "@/lib/userApiResponse";
import { disableUser } from "@/services/userService";
import { NextResponse } from "next/server";

export async function POST(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"users.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        return NextResponse.json({ user:await disableUser(id,authorization.user) });
    }
    catch(error){
        return userApiError(error);
    }
}
