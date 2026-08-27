import "server-only";

import { canAssignLead } from "@/lib/leadOwnership";
import { getRoleById } from "@/repositories/roleRepository";
import { assignLeadOwner } from "@/repositories/leadRepository";
import { getUserById } from "@/repositories/userRepository";
import type { CurrentCRMUser } from "@/types/crm-auth";
import { createNotification } from "@/services/notificationService";

export class LeadOwnershipError extends Error {
    constructor(message:string,public readonly status:number,public readonly code:string) {
        super(message);
    }
}

function isSalesRelatedRole(permissions:readonly string[]) {
    return permissions.some((permission)=>[
        "leads.read.all",
        "leads.read.owned",
        "leads.update.all",
        "leads.update.owned"
    ].includes(permission));
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

    const owner = await getUserById(ownerId.trim());
    if(!owner) throw new LeadOwnershipError("Owner not found",404,"owner_not_found");
    if(owner.status !== "active") throw new LeadOwnershipError("Owner must be active",400,"inactive_owner");

    const role = await getRoleById(owner.roleId);
    if(!role || role.status !== "active" || !isSalesRelatedRole(role.permissions)){
        throw new LeadOwnershipError("Owner must have an active sales-related role",400,"invalid_owner_role");
    }

    const result = await assignLeadOwner({
        leadId,
        owner:{ id:owner.uid,displayName:owner.displayName,email:owner.email },
        actorId:actor.uid,
        actorDisplayName:actor.displayName
    });
    if(!result) throw new LeadOwnershipError("Lead not found",404,"lead_not_found");
    await createNotification({
        userId:owner.uid,type:"lead.assigned",title:"Lead assigned",
        message:"A lead has been assigned to you.",entityType:"lead",entityId:leadId
    }).catch(()=>undefined);
    return result;
}
