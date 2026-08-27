import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { apiError } from "@/lib/apiResponse";
import { requiredId,ValidationError } from "@/lib/apiValidation";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readNotification } from "@/services/notificationService";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){ const limited=enforceRateLimit(request,"notifications.write",60);if(limited)return limited;const user=await getCurrentCRMUser(request);if(!user)return apiError("Active CRM user profile required",401,"unauthenticated");try{const {id}=await params;const found=await readNotification(requiredId(id,"Notification"),user.uid);return found?NextResponse.json({success:true}):apiError("Notification not found",404,"not_found");}catch(error){return error instanceof ValidationError?apiError(error.message,400,error.code):apiError("Unable to update notification",500,"notification_update_failed");} }
