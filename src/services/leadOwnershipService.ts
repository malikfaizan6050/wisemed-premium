import "server-only";

import { canAssignLead } from "@/lib/leadOwnership";
import { getRoleById } from "@/repositories/roleRepository";
import { assignLeadOwner,getLeadById } from "@/repositories/leadRepository";
import { getUserById } from "@/repositories/userRepository";
import type { CRMUser,CurrentCRMUser } from "@/types/crm-auth";
import type { Lead } from "@/types/crm";
import { isAdmin,isManager,isSalesUser } from "@/lib/roleClassification";
import { sendBulkLeadAssignmentEmailOnce,sendLeadAssignmentEmailOnce } from "@/services/leadAssignmentEmailService";
import { describeEmailFailure } from "@/services/emailService";
import { canAccessLeadForUser,getLeadVisibilityScope } from "@/services/leadVisibilityService";

// One request may not move more leads than this. The cap keeps a bulk
// assignment inside the serverless function's time budget and bounds how much
// a mistaken click can rewrite in one go.
export const BULK_ASSIGN_LIMIT = 200;

// Firestore takes each assignment as its own transaction, so a handful run at
// once; going wider adds contention without finishing meaningfully sooner.
const BULK_ASSIGN_CONCURRENCY = 5;

export class LeadOwnershipError extends Error {
    constructor(message:string,public readonly status:number,public readonly code:string) {
        super(message);
    }
}

export interface BulkAssignFailure {
    leadId:string;
    error:string;
    code:string;
}

type AssignmentOutcome =
    | { ok:true; result:NonNullable<Awaited<ReturnType<typeof assignLeadOwner>>> }
    | { ok:false; failure:BulkAssignFailure };

/**
 * Resolves and vets the salesperson a lead is about to be handed to. Shared by
 * the single and bulk paths so both reject the same owners for the same
 * reasons, and so a bulk request pays for these lookups once rather than once
 * per lead.
 */
async function resolveAssignmentOwner(ownerId:string,actor:CurrentCRMUser):Promise<CRMUser> {
    if(!ownerId.trim()){
        throw new LeadOwnershipError("Owner is required",400,"invalid_owner");
    }

    const owner = await getUserById(ownerId.trim());
    if(!owner) throw new LeadOwnershipError("Owner not found",404,"owner_not_found");
    if(owner.status !== "active") throw new LeadOwnershipError("Owner must be active",400,"inactive_owner");

    const role = await getRoleById(owner.roleId);
    if(!role || role.status !== "active" || !isSalesUser(role)){
        throw new LeadOwnershipError("Owner must have an active sales-related role",400,"invalid_owner_role");
    }
    if(isManager(actor.role)){
        const scope=await getLeadVisibilityScope(actor);
        if(scope.kind!=="owners"||!scope.ownerIds.includes(owner.uid)){
            throw new LeadOwnershipError("Sales managers can only assign leads within their team",403,"owner_outside_team");
        }
    }
    return owner;
}

/**
 * Moves one lead onto an already vetted owner. No email is sent here: the
 * caller decides whether that is one message per lead or a single summary for
 * a whole batch.
 */
async function applyAssignment(leadId:string,owner:CRMUser,actor:CurrentCRMUser) {
    const lead=await getLeadById(leadId);
    if(!lead) throw new LeadOwnershipError("Lead not found",404,"lead_not_found");
    if(!await canAccessLeadForUser(actor,lead,"read")){
        throw new LeadOwnershipError("You cannot assign this lead",403,"lead_access_denied");
    }

    const result = await assignLeadOwner({
        leadId,
        owner:{ id:owner.uid,displayName:owner.displayName,email:owner.email },
        actorId:actor.uid,
        actorDisplayName:actor.displayName
    });
    if(!result) throw new LeadOwnershipError("Lead not found",404,"lead_not_found");
    return result;
}

function toAssignedDate(value:unknown):Date {
    if(value instanceof Date) return value;
    if(value&&typeof value==="object"&&"toDate" in value&&typeof (value as { toDate:unknown }).toDate==="function"){
        return (value as { toDate:()=>Date }).toDate();
    }
    return new Date();
}

export async function assignLead(
    leadId:string,
    ownerId:string,
    actor:CurrentCRMUser
) {
    if(!canAssignLead(actor)){
        throw new LeadOwnershipError("Insufficient permissions",403,"insufficient_permissions");
    }

    const owner = await resolveAssignmentOwner(ownerId,actor);
    const result = await applyAssignment(leadId,owner,actor);
    let emailSent=false;
    let emailError:string|null=null;
    if(result.notificationId){
        try {
            emailSent=await sendLeadAssignmentEmailOnce({
                notificationId:result.notificationId,
                employee:{ email:owner.email,displayName:owner.displayName },
                lead:result.lead,
                assignedBy:actor.displayName,
                assignedAt:toAssignedDate(result.assignedAt)
            });
        }
        catch(error){
            // The assignment itself already succeeded, so the failure is
            // reported rather than thrown - but it is no longer swallowed:
            // the reason reaches both the server log and the screen.
            emailError=describeEmailFailure(error);
            console.error("Lead assignment email failed",emailError);
        }
    }
    const { lead:_lead,...assignment }=result;
    void _lead;
    return { ...assignment,emailSent,emailError };
}

/**
 * Hands a whole selection of leads to one salesperson.
 *
 * Administrators only: a sales manager assigning in bulk would need every lead
 * in the selection checked against their team, and the screen that offers this
 * is admin-only, so the service refuses the role outright rather than half
 * supporting it.
 *
 * A lead that cannot be moved - deleted between listing and submitting, or
 * outside the actor's reach - is reported in `failures` instead of aborting the
 * rest, so one bad id in a selection of two hundred does not undo the other
 * hundred and ninety-nine. The owner receives a single summary email for the
 * batch rather than one message per lead, which would otherwise arrive as
 * hundreds of near-identical emails.
 */
export async function bulkAssignLeads(
    leadIds:readonly string[],
    ownerId:string,
    actor:CurrentCRMUser
) {
    if(!isAdmin(actor.role)||!canAssignLead(actor)){
        throw new LeadOwnershipError("Insufficient permissions",403,"insufficient_permissions");
    }

    const uniqueIds=Array.from(new Set(leadIds.map((id)=>id.trim()).filter(Boolean)));
    if(uniqueIds.length===0){
        throw new LeadOwnershipError("Select at least one lead",400,"no_leads_selected");
    }
    if(uniqueIds.length>BULK_ASSIGN_LIMIT){
        throw new LeadOwnershipError(`Assign at most ${BULK_ASSIGN_LIMIT} leads at a time`,400,"too_many_leads");
    }

    const owner=await resolveAssignmentOwner(ownerId,actor);
    const assignedLeads:Lead[]=[];
    const notificationIds:string[]=[];
    const failures:BulkAssignFailure[]=[];
    let assigned=0;
    let unchanged=0;
    let assignedAt=new Date();

    for(let index=0;index<uniqueIds.length;index+=BULK_ASSIGN_CONCURRENCY){
        const batch=uniqueIds.slice(index,index+BULK_ASSIGN_CONCURRENCY);
        const results=await Promise.all(batch.map(async(leadId):Promise<AssignmentOutcome>=>{
            try { return { ok:true,result:await applyAssignment(leadId,owner,actor) }; }
            catch(error){
                return {
                    ok:false,
                    failure:error instanceof LeadOwnershipError
                        ? { leadId,error:error.message,code:error.code }
                        : { leadId,error:"Lead assignment failed",code:"assignment_failed" }
                };
            }
        }));

        for(const entry of results){
            if(!entry.ok){ failures.push(entry.failure);continue; }
            if(!entry.result.changed){ unchanged+=1;continue; }
            assigned+=1;
            assignedAt=toAssignedDate(entry.result.assignedAt);
            assignedLeads.push(entry.result.lead);
            if(entry.result.notificationId) notificationIds.push(entry.result.notificationId);
        }
    }

    let emailSent=false;
    let emailError:string|null=null;
    if(notificationIds.length>0){
        try {
            emailSent=await sendBulkLeadAssignmentEmailOnce({
                notificationIds,
                employee:{ email:owner.email,displayName:owner.displayName },
                leads:assignedLeads,
                assignedBy:actor.displayName,
                assignedAt
            });
        }
        catch(error){
            emailError=describeEmailFailure(error);
            console.error("Bulk lead assignment email failed",emailError);
        }
    }

    return {
        owner:{ id:owner.uid,displayName:owner.displayName,email:owner.email },
        requested:uniqueIds.length,
        assigned,
        unchanged,
        failures,
        emailSent,
        emailError
    };
}
