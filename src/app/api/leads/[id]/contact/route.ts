import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { canAccessLeadForUser } from "@/services/leadVisibilityService";
import { recordActivity } from "@/services/activityService";
import { enforceRateLimit } from "@/lib/rateLimit";
import { LEADS_COLLECTION } from "@/lib/crmCollections";

const channels = new Set(["call","email","whatsapp"]);

const channelLabels:Record<string,string> = {
    call:"Called",
    email:"Emailed",
    whatsapp:"Messaged on WhatsApp"
};

/**
 * Records that someone contacted a lead.
 *
 * Calls and emails left no trace at all: the drawer's Call and Email buttons
 * opened the phone or mail client and nothing was written down, so there was no
 * way to see whether a lead had been chased. The buttons now log the attempt
 * against the lead, and the entry carries the actor so the timeline attributes
 * it.
 *
 * This records an outbound attempt, not a completed conversation; a click means
 * the handoff to the phone or mail client happened, nothing more.
 */
export async function POST(
    request:NextRequest,
    { params }:{ params:Promise<{ id:string }> }
) {
    const limited = enforceRateLimit(request,"lead.contact",120);
    if(limited) return limited;

    const currentUser = await getCurrentCRMUser(request);
    if(!currentUser){
        return NextResponse.json({ error:"Active CRM user profile required" },{ status:401 });
    }

    try {
        const { id } = await params;
        const body:unknown = await request.json().catch(()=>null);
        const channel = body && typeof body === "object" && "channel" in body && typeof body.channel === "string"
            ? body.channel
            : "";

        if(!channels.has(channel)){
            return NextResponse.json({ error:"Unknown contact channel" },{ status:400 });
        }

        const snapshot = await db.collection(LEADS_COLLECTION).doc(id).get();
        if(!snapshot.exists){
            return NextResponse.json({ error:"Lead not found" },{ status:404 });
        }

        if(!await canAccessLeadForUser(currentUser,snapshot.data() ?? {},"read")){
            return NextResponse.json({ error:"You do not have access to this lead" },{ status:403 });
        }

        const now = new Date();
        await Promise.all([
            recordActivity({
                actorId:currentUser.uid,
                actorType:currentUser.authType === "service" ? "integration" : "user",
                action:`lead.contacted.${channel}`,
                entityType:"lead",
                entityId:id,
                metadata:{ channel,label:channelLabels[channel] }
            }),
            // Surfaces "last contacted" on the lead itself, so an untouched lead
            // is visible without reading the whole activity trail.
            db.collection(LEADS_COLLECTION).doc(id).update({
                lastContactedAt:now,
                lastContactedById:currentUser.uid,
                lastContactChannel:channel
            })
        ]);

        return NextResponse.json({ success:true });
    }
    catch {
        console.error("Contact logging failed");
        return NextResponse.json({ error:"Failed to log contact" },{ status:500 });
    }
}
