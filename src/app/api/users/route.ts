import { requirePermission } from "@/lib/apiAuth";
import { readJsonObject,userApiError } from "@/lib/userApiResponse";
import { createUser,getUsers,type CreateUserInput } from "@/services/userService";
import { NextResponse } from "next/server";

export async function GET(request:Request) {
    const authorization = await requirePermission(request,"users.read");
    if(!authorization.ok) return authorization.response;

    try {
        const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 100);
        const users = await getUsers(Number.isFinite(requestedLimit) ? requestedLimit : 100);
        return NextResponse.json({ users });
    }
    catch(error){
        return userApiError(error);
    }
}

export async function POST(request:Request) {
    const authorization = await requirePermission(request,"users.manage");
    if(!authorization.ok) return authorization.response;

    try {
        const body = await readJsonObject(request);
        const result = await createUser(body as unknown as CreateUserInput,authorization.user);
        return NextResponse.json(result,{ status:201 });
    }
    catch(error){
        return userApiError(error);
    }
}
