import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { AnalyticsServiceError,getDashboardAnalytics } from "@/services/analyticsService";

export async function GET(request:Request) {
    const viewer = await getCurrentCRMUser(request);
    if(!viewer) return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    try {
        return NextResponse.json(await getDashboardAnalytics(viewer));
    }
    catch(error){
        if(error instanceof AnalyticsServiceError) return NextResponse.json({ error:error.message },{ status:error.status });
        return NextResponse.json({ error:"Unable to load dashboard analytics" },{ status:500 });
    }
}
