import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getNotifications } from "@/services/notificationService";

export async function GET(request:Request){ const limited=enforceRateLimit(request,"notifications.read",60);if(limited)return limited;const user=await getCurrentCRMUser(request);if(!user)return NextResponse.json({error:"Active CRM user profile required",code:"unauthenticated"},{status:401});const requested=Number(new URL(request.url).searchParams.get("limit")??20);return NextResponse.json(await getNotifications(user.uid,Number.isFinite(requested)?requested:20)); }
