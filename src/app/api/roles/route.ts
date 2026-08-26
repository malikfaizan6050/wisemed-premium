import { requirePermission } from "@/lib/apiAuth";
import { readRoleJson,roleApiError } from "@/lib/roleApiResponse";
import { createRole,getRoles,type CreateRoleInput } from "@/services/roleService";
import { NextResponse } from "next/server";

export async function GET(request:Request) {
    const authorization = await requirePermission(request,"roles.read");
    if(!authorization.ok) return authorization.response;

    try {
        return NextResponse.json({ roles:await getRoles() });
    }
    catch(error){
        return roleApiError(error);
    }
}

export async function POST(request:Request) {
    const authorization = await requirePermission(request,"roles.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const body = await readRoleJson(request);
        return NextResponse.json(
            { role:await createRole(body as unknown as CreateRoleInput,authorization.user) },
            { status:201 }
        );
    }
    catch(error){
        return roleApiError(error);
    }
}
