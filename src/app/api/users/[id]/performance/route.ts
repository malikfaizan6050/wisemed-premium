import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { ActivityServiceError,getEmployeePerformance } from "@/services/activityService";

export async function GET(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const viewer = await getCurrentCRMUser(request);
    if(!viewer) return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    try {
        const { id } = await params;
        return NextResponse.json(await getEmployeePerformance(id,viewer));
    }
    catch(error){
        if(error instanceof ActivityServiceError) return NextResponse.json({ error:error.message },{ status:error.status });
        return NextResponse.json({ error:"Unable to load employee performance" },{ status:500 });
    }
}
