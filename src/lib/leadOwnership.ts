import type { CurrentCRMUser,Permission } from "@/types/crm-auth";
import type { Lead } from "@/types/crm";
import { hasPermission } from "@/lib/apiAuth";

type LeadWithOwnership = Pick<Lead,"ownerId" | "ownerSnapshot">;

export interface LeadOwner {
    id:string;
    displayName:string;
    email:string;
}

export function getLeadOwner(lead:LeadWithOwnership):LeadOwner | null {
    if(!lead.ownerId) return null;
    return {
        id:lead.ownerId,
        displayName:lead.ownerSnapshot?.displayName ?? "",
        email:lead.ownerSnapshot?.email ?? ""
    };
}

export function canAssignLead(user:CurrentCRMUser) {
    return user.role.id!=="sales"&&hasPermission(user,"leads.assign");
}

export function canAccessLead(
    user:CurrentCRMUser,
    lead:LeadWithOwnership,
    access:"read" | "update" = "update"
) {
    const ownedPermission:Permission = access === "read" ? "leads.read.owned" : "leads.update.owned";
    const allPermission:Permission = access === "read" ? "leads.read.all" : "leads.update.all";
    const ownsLead = Boolean(lead.ownerId && lead.ownerId === user.uid);

    // The built-in salesperson role is always ownership-scoped, including
    // installations whose legacy role document still contains update-all.
    if(user.role.id === "sales"){
        return ownsLead && (
            hasPermission(user,ownedPermission) ||
            hasPermission(user,allPermission)
        );
    }

    return hasPermission(user,allPermission) || (
        ownsLead && hasPermission(user,ownedPermission)
    );
}
import "server-only";
