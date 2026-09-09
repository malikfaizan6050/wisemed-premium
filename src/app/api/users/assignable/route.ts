import { getCurrentCRMUser } from "@/lib/apiAuth";
import { userApiError } from "@/lib/userApiResponse";
import { getAssignableUsers } from "@/services/userService";
import { NextResponse } from "next/server";

export async function GET(request:Request) {
    const actor=await getCurrentCRMUser(request);
    if(!actor){
        return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    }

    try {
        return NextResponse.json(
            { users:await getAssignableUsers(actor) },
            { headers:{ "Cache-Control":"no-store" } }
        );
    }
    catch(error){
        return userApiError(error);
    }
}
