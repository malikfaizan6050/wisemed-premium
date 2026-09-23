import "server-only";

import { hasPermission } from "@/lib/apiAuth";
import { isAdmin,isManager } from "@/lib/roleClassification";
import { listTeamMemberIds } from "@/repositories/userRepository";
import type { CurrentCRMUser } from "@/types/crm-auth";
import type { Lead } from "@/types/crm";

export type LeadVisibilityScope={ kind:"all" }|{ kind:"owners";ownerIds:string[] };

export async function getLeadVisibilityScope(user:CurrentCRMUser):Promise<LeadVisibilityScope> {
    if(isAdmin(user.role)) return { kind:"all" };
    if(isManager(user.role)) return { kind:"owners",ownerIds:await listTeamMemberIds(user) };
    if(user.role.id==="sales") return { kind:"owners",ownerIds:[user.uid] };
    if(hasPermission(user,"leads.read.all")) return { kind:"all" };
    return { kind:"owners",ownerIds:[user.uid] };
}

/**
 * Decides whether a user may read or write one particular lead.
 *
 * The access level is checked against its own permission pair. This used to
 * derive the row scope first and let anyone whose scope was "all" through, but
 * that scope is built from *read* permissions: a role holding
 * `leads.read.all` together with only `leads.update.owned` was granted
 * company-wide scope and could therefore edit — and delete — leads belonging
 * to other people. The all-permission is still narrowed by the scope
 * afterwards, so a sales manager stays inside their own team.
 */
export async function canAccessLeadForUser(user:CurrentCRMUser,lead:Pick<Lead,"ownerId">,access:"read"|"update"="read") {
    const ownedPermission=access==="read"?"leads.read.owned":"leads.update.owned";
    const allPermission=access==="read"?"leads.read.all":"leads.update.all";
    const ownsLead=Boolean(lead.ownerId&&lead.ownerId===user.uid);

    // The built-in salesperson role is ownership-scoped whatever its role
    // document says, matching canAccessLead() in lib/leadOwnership.
    if(user.role.id==="sales"){
        return ownsLead&&(hasPermission(user,ownedPermission)||hasPermission(user,allPermission));
    }

    if(hasPermission(user,allPermission)){
        const scope=await getLeadVisibilityScope(user);
        return scope.kind==="all"||ownsLead||Boolean(lead.ownerId&&scope.ownerIds.includes(lead.ownerId));
    }

    return ownsLead&&hasPermission(user,ownedPermission);
}
