import { getCurrentCRMUser } from "@/lib/apiAuth";
import { assignLead,LeadOwnershipError } from "@/services/leadOwnershipService";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { objectBody,requiredId,ValidationError } from "@/lib/apiValidation";

export async function POST(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
    const limited = enforceRateLimit(request,"lead.assign",30);
    if(limited) return limited;
    const actor = await getCurrentCRMUser(request);
    if(!actor){
        return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    }

    try {
        const body = objectBody(await request.json());
        const ownerId = requiredId(body.ownerId,"Owner");
        const { id } = await params;
        return NextResponse.json({
            success:true,
            assignment:await assignLead(id,ownerId,actor)
        });
    }
    catch(error){
        if(error instanceof ValidationError) return NextResponse.json({ error:error.message,code:error.code },{ status:400 });
        if(error instanceof LeadOwnershipError){
            return NextResponse.json({ error:error.message,code:error.code },{ status:error.status });
        }
        return NextResponse.json({ error:"Lead assignment failed" },{ status:500 });
    }
}
