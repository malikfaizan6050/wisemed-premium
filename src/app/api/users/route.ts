import { getCurrentCRMUser,hasPermission,requirePermission } from "@/lib/apiAuth";
import { readJsonObject,userApiError } from "@/lib/userApiResponse";
import { createUser,getUsers,type CreateUserInput } from "@/services/userService";
import { NextResponse } from "next/server";
import type { CRMUserStatus } from "@/types/crm-auth";
import { getRoleById } from "@/repositories/roleRepository";
import { isSalesUser } from "@/lib/roleClassification";

export async function GET(request:Request) {
    const user = await getCurrentCRMUser(request);
    if(!user) return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });

    const searchParams = new URL(request.url).searchParams;
    const activeOnly = searchParams.get("active") === "true";
    const canReadUsers = hasPermission(user,"users.read");
    const canReadAssignable = activeOnly && hasPermission(user,"users.assignable.read");
    if(!canReadUsers && !canReadAssignable){
        return NextResponse.json({ error:"Insufficient permissions" },{ status:403 });
    }

    try {
        const requestedLimit = Number(searchParams.get("limit") ?? 50);
        const status = activeOnly ? "active" : searchParams.get("status") ?? undefined;
        const users = await getUsers({
            limit:Number.isFinite(requestedLimit) ? requestedLimit : 50,
            status:status as CRMUserStatus | undefined,
            roleId:searchParams.get("roleId") ?? undefined
        });

        if(activeOnly){
            const roleEntries = await Promise.all(Array.from(new Set(users.map((entry)=>entry.roleId))).map(async(roleId)=>[roleId,await getRoleById(roleId)] as const));
            const roles = new Map(roleEntries);
            const assignableUsers = users.filter((entry)=>{
                const role = roles.get(entry.roleId);
                return Boolean(role && role.status === "active" && isSalesUser(role));
            });
            if(canReadUsers) return NextResponse.json({ users:assignableUsers });
            return NextResponse.json({ users:assignableUsers.map((entry)=>{
                const role = roles.get(entry.roleId)!;
                return { uid:entry.uid,displayName:entry.displayName,email:entry.email,role:{ id:role.id,name:role.name } };
            }) });
        }

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
        return NextResponse.json(result,{ status:201,headers:{ "Cache-Control":"no-store" } });
    }
    catch(error){
        return userApiError(error);
    }
}
