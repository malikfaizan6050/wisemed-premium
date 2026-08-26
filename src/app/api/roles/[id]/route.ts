import { requirePermission } from "@/lib/apiAuth";
import { readRoleJson,roleApiError } from "@/lib/roleApiResponse";
import { deleteRole,getRole,updateRole,type UpdateRoleInput } from "@/services/roleService";
import { NextResponse } from "next/server";

export async function GET(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"roles.read");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        return NextResponse.json({ role:await getRole(id) });
    }
    catch(error){
        return roleApiError(error);
    }
}

export async function PATCH(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"roles.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        const body = await readRoleJson(request);
        return NextResponse.json({
            role:await updateRole(id,body as unknown as UpdateRoleInput,authorization.user)
        });
    }
    catch(error){
        return roleApiError(error);
    }
}

export async function DELETE(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"roles.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        await deleteRole(id,authorization.user);
        return NextResponse.json({ success:true });
    }
    catch(error){
        return roleApiError(error);
    }
}
