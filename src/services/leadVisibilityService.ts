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

export async function canAccessLeadForUser(user:CurrentCRMUser,lead:Pick<Lead,"ownerId">,access:"read"|"update"="read") {
    const permission=access==="read"?"leads.read.owned":"leads.update.owned";
    const allPermission=access==="read"?"leads.read.all":"leads.update.all";
    if(!hasPermission(user,permission)&&!hasPermission(user,allPermission)) return false;
    const scope=await getLeadVisibilityScope(user);
    return scope.kind==="all"||Boolean(lead.ownerId&&scope.ownerIds.includes(lead.ownerId));
}
