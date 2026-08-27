import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { ActivityServiceError,getActivities } from "@/services/activityService";

function dateParameter(value:string | null,endOfDay=false) {
    if(!value) return undefined;
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) throw new ActivityServiceError("Invalid date range",400);
    if(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23,59,59,999);
    return date;
}

export async function GET(request:Request) {
    const viewer = await getCurrentCRMUser(request);
    if(!viewer) return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    try {
        const params = new URL(request.url).searchParams;
        const requestedLimit = Number(params.get("limit") ?? 50);
        const activities = await getActivities({
            actorId:params.get("employee") ?? undefined,
            action:params.get("action") ?? undefined,
            from:dateParameter(params.get("from")),
            to:dateParameter(params.get("to"),true),
            limit:Number.isFinite(requestedLimit) ? requestedLimit : 50
        },viewer);
        return NextResponse.json({ activities });
    }
    catch(error){
        if(error instanceof ActivityServiceError) return NextResponse.json({ error:error.message },{ status:error.status });
        return NextResponse.json({ error:"Unable to load activities" },{ status:500 });
    }
}
