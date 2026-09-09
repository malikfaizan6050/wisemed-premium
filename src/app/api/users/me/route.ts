import { NextResponse } from "next/server";
import { authenticateCRMUser } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET(request:Request) {
    const result=await authenticateCRMUser(request);
    const headers={ "Cache-Control":"private, no-store" };
    if(!result.ok) return NextResponse.json({ error:result.error,code:result.code },{ status:result.status,headers });
    const user=result.user;
    return NextResponse.json({
        user:{ uid:user.uid,email:user.email,displayName:user.displayName,roleId:user.roleId,status:user.status },
        role:{ id:user.role.id,name:user.role.name },
        permissions:user.permissions
    },{ headers });
}
