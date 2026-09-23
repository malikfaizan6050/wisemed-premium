import { timingSafeEqual } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createNotification } from "@/services/notificationService";
import { recordActivity } from "@/services/activityService";
import { getUserById } from "@/repositories/userRepository";
import { escapeEmailHtml,sendEmail } from "@/services/emailService";
import { isLeadOverdue,toLeadDate } from "@/lib/leadDates";
import { getLeadStageLabel } from "@/lib/leadStages";
import { LEADS_COLLECTION } from "@/lib/crmCollections";

// Re-notifying about the same lead every night would train people to ignore the
// alert, so a lead is chased again only after this long.
const REMINDER_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Only the shared secret authorises this sweep.
 *
 * `x-vercel-cron` used to be enough on its own, but any client can set a
 * header: sending it was all it took for an anonymous caller to make the CRM
 * email every lead owner and stamp every overdue lead. Vercel Cron sends the
 * `CRON_SECRET` value as a bearer token, so the secret alone identifies a
 * genuine scheduled run. Set CRON_SECRET in the Vercel project settings, or
 * the schedule in vercel.json cannot authenticate and the sweep never runs.
 */
function isAuthorized(request:NextRequest) {
    const configured = process.env.CRON_SECRET;
    if(!configured) return false;

    const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i,"") ?? "";
    const suppliedBuffer = Buffer.from(supplied);
    const configuredBuffer = Buffer.from(configured);
    return suppliedBuffer.length === configuredBuffer.length &&
        timingSafeEqual(suppliedBuffer,configuredBuffer);
}

/**
 * Chases leads whose follow-up date has passed.
 *
 * Nothing acted on an overdue lead: isLeadOverdue only tinted a row, so a lead
 * with a missed follow-up sat untouched indefinitely. This notifies and emails
 * the owner, records the chase in the audit trail, and stamps the lead so the
 * same one is not re-sent nightly.
 *
 * Intended to run from a scheduled job. Safe to re-run: leads already chased
 * within the interval are skipped.
 */
async function runOverdueSweep(request:NextRequest) {
    if(!isAuthorized(request)){
        return NextResponse.json({ error:"Unauthorized" },{ status:401 });
    }

    try {
        const snapshot = await db.collection(LEADS_COLLECTION).limit(2000).get();
        const now = Date.now();
        let chased = 0;
        let skipped = 0;
        let unassigned = 0;

        for(const document of snapshot.docs){
            const lead = document.data();

            if(!isLeadOverdue(lead.dueDate,String(lead.status ?? ""))) continue;

            const lastReminder = toLeadDate(lead.overdueRemindedAt);
            if(lastReminder && now - lastReminder.getTime() < REMINDER_INTERVAL_MS){
                skipped += 1;
                continue;
            }

            const ownerId = typeof lead.ownerId === "string" ? lead.ownerId : "";
            if(!ownerId){
                // Nobody owns it, so there is nobody to chase. Counted so an
                // unassigned backlog is visible in the response.
                unassigned += 1;
                continue;
            }

            const owner = await getUserById(ownerId).catch(()=>null);
            if(!owner || owner.status !== "active") continue;

            const providerName = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() ||
                String(lead.organization ?? "") ||
                "A lead";
            const dueDate = toLeadDate(lead.dueDate);
            const dueLabel = dueDate ? dueDate.toISOString().slice(0,10) : "an earlier date";

            const notification = await createNotification({
                userId:ownerId,
                type:"lead.status_changed",
                title:"Overdue follow-up",
                message:`${providerName} was due for follow-up on ${dueLabel}.`,
                entityType:"lead",
                entityId:document.id,
                leadId:document.id
            }).catch(()=>null);

            if(owner.email){
                const loginUrl=`${(process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000").replace(/\/$/,"")}/login`;
                const lines=[
                    `Hello ${owner.displayName},`,
                    `${providerName} was due for follow-up on ${dueLabel} and has not been moved on.`,
                    `Practice: ${lead.organization || "Not provided"}`,
                    `Stage: ${getLeadStageLabel(lead.status)}`,
                    `Next action: ${lead.nextAction || "Not set"}`,
                    `CRM login: ${loginUrl}`
                ];
                await sendEmail({
                    to:owner.email,
                    subject:`Overdue follow-up: ${providerName} - WiseMedBilling CRM`,
                    text:lines.join("\n"),
                    html:`${lines.map((line)=>`<p>${escapeEmailHtml(line)}</p>`).join("")}<p><a href="${escapeEmailHtml(loginUrl)}">Open the CRM</a></p>`
                }).catch(()=>undefined);
            }

            await document.ref.update({ overdueRemindedAt:new Date() }).catch(()=>undefined);

            await recordActivity({
                actorId:"system",
                actorType:"system",
                action:"lead.overdue_reminder_sent",
                entityType:"lead",
                entityId:document.id,
                metadata:{ ownerId,dueDate:dueLabel,notificationId:notification?.id ?? null }
            }).catch(()=>undefined);

            chased += 1;
        }

        return NextResponse.json({ success:true,chased,skipped,unassigned });
    }
    catch {
        console.error("Overdue reminder sweep failed");
        return NextResponse.json({ error:"Failed to run overdue reminders" },{ status:500 });
    }
}

// Vercel Cron invokes scheduled paths with GET, so that is the scheduled entry
// point. POST is kept so the sweep can be triggered by hand during testing.
export async function GET(request:NextRequest) { return runOverdueSweep(request); }
export async function POST(request:NextRequest) { return runOverdueSweep(request); }
