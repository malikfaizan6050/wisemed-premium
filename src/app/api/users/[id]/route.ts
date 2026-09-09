import { requirePermission } from "@/lib/apiAuth";
import { readJsonObject,userApiError } from "@/lib/userApiResponse";
import { deleteUser,getUser,updateUser,type UpdateUserInput } from "@/services/userService";
import { NextResponse } from "next/server";

export async function GET(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"users.read");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        return NextResponse.json({ user:await getUser(id) });
    }
    catch(error){
        return userApiError(error);
    }
}

export async function PATCH(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"users.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        const body = await readJsonObject(request);
        const user = await updateUser(id,body as unknown as UpdateUserInput,authorization.user);
        return NextResponse.json({ user });
    }
    catch(error){
        return userApiError(error);
    }
}

export async function DELETE(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const authorization = await requirePermission(request,"users.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const { id } = await params;
        return NextResponse.json(await deleteUser(id,authorization.user));
    }
    catch(error){
        return userApiError(error);
    }
}
