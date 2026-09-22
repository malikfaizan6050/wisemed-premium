import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requirePermission } from "@/lib/apiAuth";
import { recordActivity } from "@/services/activityService";
import { isLeadStage,LEAD_STAGE_KEYS } from "@/lib/leadStages";
import { LEADS_COLLECTION } from "@/lib/crmCollections";

/**
 * Retired stages and where they belong now.
 *
 * types/lead.ts used to declare `qualified` and `converted`, which no screen
 * ever rendered, so any lead written with one was invisible everywhere. These
 * map onto the closest surviving stage.
 */
const retiredStageMap:Record<string,string> = {
    qualified:"initial_review",
    converted:"active_client",
    closed_won:"active_client",
    closed_lost:"lost",
    contacted:"initial_review",
    negotiation:"contract_review",
    proposal:"proposal_sent"
};

interface StageFinding {
    stage:string;
    count:number;
    mapsTo:string | null;
    leadIds:string[];
}

/**
 * Reports, and optionally repairs, leads sitting in a stage no screen shows.
 *
 * GET is a dry run: it lists what would change and changes nothing. POST
 * applies the mapping and records an activity per lead so the repair is
 * auditable. A stage with no known mapping is reported but never guessed at,
 * because silently reassigning an unrecognised stage would lose information.
 */
async function collectFindings() {
    const snapshot = await db.collection(LEADS_COLLECTION).select("status").get();
    const byStage = new Map<string,string[]>();

    snapshot.docs.forEach((document)=>{
        const status = String(document.data().status ?? "");
        if(isLeadStage(status)) return;
        const existing = byStage.get(status) ?? [];
        existing.push(document.id);
        byStage.set(status,existing);
    });

    const findings:StageFinding[] = Array.from(byStage.entries()).map(([stage,leadIds])=>({
        stage:stage || "(empty)",
        count:leadIds.length,
        mapsTo:retiredStageMap[stage] ?? null,
        leadIds
    }));

    return { findings,scanned:snapshot.size };
}

export async function GET(request:NextRequest) {
    const authResult = await requirePermission(request,"system.migrate");
    if(!authResult.ok) return authResult.response;

    try {
        const { findings,scanned } = await collectFindings();
        return NextResponse.json({
            dryRun:true,
            scanned,
            validStages:LEAD_STAGE_KEYS,
            affected:findings.reduce((total,finding)=>total+finding.count,0),
            repairable:findings.filter((finding)=>finding.mapsTo !== null),
            needsManualReview:findings.filter((finding)=>finding.mapsTo === null)
        });
    }
    catch {
        console.error("Stage scan failed");
        return NextResponse.json({ error:"Failed to scan lead stages" },{ status:500 });
    }
}

export async function POST(request:NextRequest) {
    const authResult = await requirePermission(request,"system.migrate");
    if(!authResult.ok) return authResult.response;

    try {
        const { findings } = await collectFindings();
        const repairable = findings.filter((finding)=>finding.mapsTo !== null);

        let repaired = 0;
        for(const finding of repairable){
            // Chunked to stay within the Firestore batch limit.
            for(let index = 0; index < finding.leadIds.length; index += 400){
                const chunk = finding.leadIds.slice(index,index+400);
                const batch = db.batch();
                chunk.forEach((leadId)=>{
                    batch.update(db.collection(LEADS_COLLECTION).doc(leadId),{
                        status:finding.mapsTo,
                        updatedAt:new Date()
                    });
                });
                await batch.commit();
                repaired += chunk.length;
            }

            await recordActivity({
                actorId:authResult.user.uid,
                actorType:"user",
                action:"lead.stage_normalized",
                entityType:"lead",
                entityId:"",
                metadata:{
                    fromStage:finding.stage,
                    toStage:finding.mapsTo,
                    count:finding.leadIds.length
                }
            }).catch(()=>undefined);
        }

        return NextResponse.json({
            success:true,
            repaired,
            needsManualReview:findings.filter((finding)=>finding.mapsTo === null)
        });
    }
    catch {
        console.error("Stage normalization failed");
        return NextResponse.json({ error:"Failed to normalize lead stages" },{ status:500 });
    }
}
