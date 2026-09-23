import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requirePermission } from "@/lib/apiAuth";
import { recordActivity } from "@/services/activityService";
import { LEADS_COLLECTION } from "@/lib/crmCollections";
import {
    normalizeEmail,
    normalizeNpi,
    normalizeOrganization,
    normalizePhone
} from "@/lib/leadDuplicateDetection";

/**
 * Fills in the normalised lookup keys on leads written before they existed.
 *
 * Duplicate detection matches on `emailNormalized`, `phoneNormalized` and
 * `npiNormalized` so it can run as indexed queries instead of reading the
 * whole collection. Leads created by the older WhatsApp webhook, by the
 * migration route, or by the importer carry only some of those keys, so
 * without this pass a new enquiry could be accepted as fresh when a matching
 * lead was already on file under a differently formatted phone number.
 *
 * GET reports what is missing and changes nothing. POST writes the keys.
 * Re-running is safe: a lead whose keys already match is left alone.
 */
interface LeadKeys {
    emailNormalized:string;
    phoneNormalized:string;
    npiNormalized:string;
    organizationNormalized:string;
}

function expectedKeys(data:FirebaseFirestore.DocumentData):LeadKeys {
    return {
        emailNormalized:normalizeEmail(String(data.email ?? "")),
        phoneNormalized:normalizePhone(String(data.phone ?? "")),
        npiNormalized:normalizeNpi(String(data.npi ?? "")),
        organizationNormalized:normalizeOrganization(String(data.organization ?? ""))
    };
}

async function collectOutdated() {
    const snapshot = await db.collection(LEADS_COLLECTION)
        .select("email","phone","npi","organization","emailNormalized","phoneNormalized","npiNormalized","organizationNormalized")
        .get();

    return snapshot.docs.flatMap((document)=>{
        const data = document.data();
        const keys = expectedKeys(data);
        const stale = (Object.keys(keys) as Array<keyof LeadKeys>)
            .filter((key)=>data[key] !== keys[key]);
        return stale.length ? [{ id:document.id,keys,stale }] : [];
    });
}

export async function GET(request:NextRequest) {
    const authResult = await requirePermission(request,"system.migrate");
    if(!authResult.ok) return authResult.response;

    try {
        const outdated = await collectOutdated();
        return NextResponse.json({
            dryRun:true,
            leadsNeedingKeys:outdated.length,
            sample:outdated.slice(0,20).map(({ id,stale })=>({ id,missingKeys:stale }))
        });
    }
    catch {
        console.error("Search key scan failed");
        return NextResponse.json({ error:"Failed to scan lead search keys" },{ status:500 });
    }
}

export async function POST(request:NextRequest) {
    const authResult = await requirePermission(request,"system.migrate");
    if(!authResult.ok) return authResult.response;

    try {
        const outdated = await collectOutdated();

        let repaired = 0;
        // Chunked to stay within the Firestore batch limit.
        for(let index = 0;index < outdated.length;index += 400){
            const chunk = outdated.slice(index,index+400);
            const batch = db.batch();
            chunk.forEach(({ id,keys })=>{
                batch.update(db.collection(LEADS_COLLECTION).doc(id),{ ...keys });
            });
            await batch.commit();
            repaired += chunk.length;
        }

        if(repaired > 0){
            await recordActivity({
                actorId:authResult.user.uid,
                actorType:"user",
                action:"lead.search_keys_backfilled",
                entityType:"lead",
                entityId:"",
                metadata:{ count:repaired }
            }).catch(()=>undefined);
        }

        return NextResponse.json({ success:true,repaired });
    }
    catch {
        console.error("Search key backfill failed");
        return NextResponse.json({ error:"Failed to backfill lead search keys" },{ status:500 });
    }
}
