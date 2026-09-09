import "server-only";

import { canAssignLead } from "@/lib/leadOwnership";
import { getRoleById } from "@/repositories/roleRepository";
import { assignLeadOwner,getLeadById } from "@/repositories/leadRepository";
import { getUserById } from "@/repositories/userRepository";
import type { CurrentCRMUser } from "@/types/crm-auth";
import { isManager,isSalesUser } from "@/lib/roleClassification";
import { sendLeadAssignmentEmailOnce } from "@/services/leadAssignmentEmailService";
import { canAccessLeadForUser,getLeadVisibilityScope } from "@/services/leadVisibilityService";

export class LeadOwnershipError extends Error {
    constructor(message:string,public readonly status:number,public readonly code:string) {
        super(message);
    }
}

export async function assignLead(
    leadId:string,
    ownerId:string,
    actor:CurrentCRMUser
) {
    if(!canAssignLead(actor)){
        throw new LeadOwnershipError("Insufficient permissions",403,"insufficient_permissions");
    }
    if(!ownerId.trim()){
        throw new LeadOwnershipError("Owner is required",400,"invalid_owner");
    }

    const lead=await getLeadById(leadId);
    if(!lead) throw new LeadOwnershipError("Lead not found",404,"lead_not_found");
    if(!await canAccessLeadForUser(actor,lead,"read")){
        throw new LeadOwnershipError("You cannot assign this lead",403,"lead_access_denied");
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

    const result = await assignLeadOwner({
        leadId,
        owner:{ id:owner.uid,displayName:owner.displayName,email:owner.email },
        actorId:actor.uid,
        actorDisplayName:actor.displayName
    });
    if(!result) throw new LeadOwnershipError("Lead not found",404,"lead_not_found");
    let emailSent=false;
    if(result.notificationId){
        const assignedAt=result.assignedAt instanceof Date
            ? result.assignedAt
            : result.assignedAt&&typeof result.assignedAt==="object"&&"toDate" in result.assignedAt&&typeof result.assignedAt.toDate==="function"
                ? result.assignedAt.toDate()
                : new Date();
        emailSent=await sendLeadAssignmentEmailOnce({
            notificationId:result.notificationId,
            employee:{ email:owner.email,displayName:owner.displayName },
            lead:result.lead,
            assignedBy:actor.displayName,
            assignedAt
        }).catch(()=>false);
    }
    const { lead:_lead,...assignment }=result;
    void _lead;
    return { ...assignment,emailSent };
}
