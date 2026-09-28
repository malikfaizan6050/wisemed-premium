import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { BULK_ASSIGN_LIMIT,bulkAssignLeads,LeadOwnershipError } from "@/services/leadOwnershipService";
import { enforceRateLimit } from "@/lib/rateLimit";
import { objectBody,requiredId,ValidationError } from "@/lib/apiValidation";

function leadIds(value:unknown):string[] {
    if(!Array.isArray(value)) throw new ValidationError("Select at least one lead","no_leads_selected");
    if(value.length>BULK_ASSIGN_LIMIT) throw new ValidationError(`Assign at most ${BULK_ASSIGN_LIMIT} leads at a time`,"too_many_leads");
    return value.map((id,index)=>requiredId(id,`Lead ${index+1}`));
}

/**
 * Assigns many leads to one salesperson in a single request.
 *
 * The service, not this handler, enforces that only administrators may do it.
 * The rate limit is deliberately tighter than the single-lead route: each call
 * can rewrite up to BULK_ASSIGN_LIMIT leads.
 */
export async function POST(request:Request) {
    const limited = enforceRateLimit(request,"lead.bulkAssign",10);
    if(limited) return limited;

    const actor = await getCurrentCRMUser(request);
    if(!actor){
        return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    }

    try {
        const body = objectBody(await request.json());
        const ownerId = requiredId(body.ownerId,"Owner");
        return NextResponse.json({
            success:true,
            result:await bulkAssignLeads(leadIds(body.leadIds),ownerId,actor)
        });
    }
    catch(error){
        if(error instanceof ValidationError) return NextResponse.json({ error:error.message,code:error.code },{ status:400 });
        if(error instanceof LeadOwnershipError){
            return NextResponse.json({ error:error.message,code:error.code },{ status:error.status });
        }
        return NextResponse.json({ error:"Bulk lead assignment failed" },{ status:500 });
    }
}
