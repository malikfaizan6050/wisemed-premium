import { NextResponse } from "next/server";
import { RoleServiceError } from "@/services/roleService";

export function roleApiError(error:unknown) {
    if(error instanceof RoleServiceError){
        return NextResponse.json({ error:error.message,code:error.code },{ status:error.status });
    }
    return NextResponse.json({ error:"Role operation failed" },{ status:500 });
}

export async function readRoleJson(request:Request) {
    const body:unknown = await request.json();
    if(!body || typeof body !== "object" || Array.isArray(body)){
        throw new RoleServiceError("Invalid request body",400,"invalid_body");
    }
    return body as Record<string,unknown>;
}
