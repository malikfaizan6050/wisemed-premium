import "server-only";

import { getUserById } from "@/repositories/userRepository";

// Non-human actors, labelled without a user lookup.
const systemActorLabels:Record<string,string> = {
    system:"System",
    website:"Website enquiry",
    "crm-service":"CRM integration"
};

/**
 * Resolves actor ids to display names, for any actor.
 *
 * Activity records store only an actorId. Screens that tried to resolve it
 * against a list they already had on hand got it wrong whenever the actor was
 * not in that list: the analytics dashboard matched against sales staff only,
 * so every action by an admin or a manager fell through to the literal string
 * "CRM User". Looking each id up directly means the actor's role, or whether
 * they are still active, has no bearing on whether their name appears.
 */
export async function resolveActorNames(actorIds:Iterable<string>):Promise<Map<string,string>> {
    const unique = Array.from(new Set(
        Array.from(actorIds).filter((id)=>id && !(id in systemActorLabels))
    ));

    const names = new Map<string,string>();
    await Promise.all(unique.map(async(id)=>{
        const user = await getUserById(id).catch(()=>null);
        if(user) names.set(id,user.displayName || user.email || id);
    }));

    return names;
}

/**
 * Picks the label for one actor. Falls back to "Deleted user" only when the
 * account genuinely cannot be found, so a real name is never replaced by a
 * placeholder just because a lookup was scoped too narrowly.
 */
export function actorDisplayName(actorId:string,resolved:Map<string,string>):string {
    return systemActorLabels[actorId] ??
        resolved.get(actorId) ??
        (actorId ? "Deleted user" : "System");
}
