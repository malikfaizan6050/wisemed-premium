import { db } from "@/lib/firebase-admin";
import { calculateLeadScore, getLeadPriority } from "@/lib/leadScoring";
import {
    findDuplicateLead,
    normalizeEmail,
    normalizeNpi,
    normalizePhone
} from "@/lib/leadDuplicateDetection";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentCRMUser,requirePermission } from "@/lib/apiAuth";
import { DELETED_LEADS_COLLECTION,LEADS_COLLECTION } from "@/lib/crmCollections";
import { canAccessLeadForUser } from "@/services/leadVisibilityService";
import { recordActivity } from "@/services/activityService";
import { createNotification } from "@/services/notificationService";

const textFields = new Set([
    "firstName",
    "lastName",
    "email",
    "phone",
    "organization",
    "specialty",
    "npi",
    "practiceSize",
    "ehrSystem",
    "billingSetup",
    "billingChallenge",
    "interestedService",
    "preferredContactMethod",
    "status",
    "priority",
    "notes",
    "nextAction"
]);

const dateFields = new Set(["dueDate"]);

const numericFields = new Set([
    "monthlyClaims",
    "monthlyCollections",
    "providerCount"
]);

const scoringFields = new Set([
    "email",
    "phone",
    "organization",
    "specialty",
    "npi",
    "monthlyClaims",
    "monthlyCollections",
    "providerCount",
    "billingSetup",
    "billingChallenge",
    "interestedService",
    "preferredContactMethod"
]);

/**
 * Removes a lead from the CRM.
 *
 * Deletion is a soft delete: the record moves to `crm_leads_deleted` rather
 * than being destroyed, so a mistaken deletion is recoverable and the audit
 * trail keeps something to point at. Requires the `leads.delete` permission,
 * which no role holds until an administrator grants it.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id:string }> }
) {
    const authResult = await requirePermission(request,"leads.delete");
    if(!authResult.ok) return authResult.response;
    const currentUser = authResult.user;

    try {
        const { id } = await params;
        const reference = db.collection(LEADS_COLLECTION).doc(id);
        const snapshot = await reference.get();

        if(!snapshot.exists){
            return NextResponse.json({ error:"Lead not found" },{ status:404 });
        }

        const lead = snapshot.data() ?? {};
        if(!await canAccessLeadForUser(currentUser,lead,"update")){
            return NextResponse.json(
                { error:"You do not have permission to delete this lead" },
                { status:403 }
            );
        }

        await db.runTransaction(async(transaction)=>{
            transaction.create(db.collection(DELETED_LEADS_COLLECTION).doc(id),{
                ...lead,
                deletedAt:new Date(),
                deletedById:currentUser.uid,
                deletedByName:currentUser.displayName
            });
            transaction.delete(reference);
        });

        await recordActivity({
            actorId:currentUser.uid,
            actorType:currentUser.authType === "service" ? "integration" : "user",
            action:"lead.deleted",
            entityType:"lead",
            entityId:id,
            metadata:{
                organization:lead.organization ?? null,
                email:lead.email ?? null,
                status:lead.status ?? null,
                recoverableFrom:DELETED_LEADS_COLLECTION
            }
        }).catch(()=>undefined);

        return NextResponse.json({ success:true });
    }
    catch {
        console.error("Lead deletion failed");
        return NextResponse.json({ error:"Failed to delete lead" },{ status:500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id:string }> }
) {
    const currentUser = await getCurrentCRMUser(request);
    if(!currentUser){
        return NextResponse.json(
            { error:"Active CRM user profile required" },
            { status:401 }
        );
    }

    try {
        const { id } = await params;
        const body:unknown = await request.json();

        if(!body || typeof body !== "object" || Array.isArray(body)){
            return NextResponse.json(
                { error:"Invalid update data" },
                { status:400 }
            );
        }

        const entries = Object.entries(body);
        if(entries.length === 0){
            return NextResponse.json(
                { error:"No lead fields supplied" },
                { status:400 }
            );
        }

        const updates:Record<string,string | number | Date | null> = {};

        for(const [field,value] of entries){
            if(dateFields.has(field) && typeof value === "string"){
                if(value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)){
                    updates[field] = value || null;
                    continue;
                }
            }

            if(textFields.has(field) && typeof value === "string"){
                updates[field] = value.trim();
                continue;
            }

            if(numericFields.has(field)){
                const number = Number(value);
                if(Number.isFinite(number) && number >= 0){
                    updates[field] = number;
                    continue;
                }
            }

            return NextResponse.json(
                { error:`Invalid lead field: ${field}` },
                { status:400 }
            );
        }

        if("monthlyClaims" in updates){
            updates.claimsVolume = updates.monthlyClaims;
        }

        if("billingSetup" in updates){
            updates.currentBillingMethod = updates.billingSetup;
        }

        const reference = db.collection("crm_leads").doc(id);
        const snapshot = await reference.get();

        if(!snapshot.exists){
            return NextResponse.json(
                { error:"Lead not found" },
                { status:404 }
            );
        }

        const currentLead = snapshot.data() ?? {};
        if(!await canAccessLeadForUser(currentUser,currentLead,"update")){
            return NextResponse.json(
                { error:"You do not have permission to update this lead" },
                { status:403 }
            );
        }
        const mergedLead = {
            ...currentLead,
            ...updates
        };

        if(!mergedLead.email && !mergedLead.phone){
            return NextResponse.json(
                { error:"Email or phone required" },
                { status:400 }
            );
        }

        if(entries.some(([field]) => ["email","phone","npi"].includes(field))){
            const duplicate = await findDuplicateLead(
                {
                    email:String(mergedLead.email ?? ""),
                    phone:String(mergedLead.phone ?? ""),
                    npi:String(mergedLead.npi ?? "")
                },
                id
            );

            if(duplicate){
                return NextResponse.json(
                    {
                        error:
                            `Duplicate lead found with matching ${duplicate.matchingFields.join(", ")}`,
                        duplicateId:duplicate.id,
                        matchingFields:duplicate.matchingFields
                    },
                    { status:409 }
                );
            }

            updates.emailNormalized = normalizeEmail(String(mergedLead.email ?? ""));
            updates.phoneNormalized = normalizePhone(String(mergedLead.phone ?? ""));
            updates.npiNormalized = normalizeNpi(String(mergedLead.npi ?? ""));
        }

        if(entries.some(([field]) => scoringFields.has(field))){
            const score = calculateLeadScore(mergedLead);
            updates.leadScore = score;
            updates.opportunityScore = score;
            updates.priority = getLeadPriority(score);
        }

        updates.updatedAt = new Date();
        await reference.update(updates);

        const changedFields = entries.map(([field])=>field);
        const activities = [recordActivity({
            actorId:currentUser.uid,
            actorType:currentUser.authType === "service" ? "integration" : "user",
            action:"lead.updated",
            entityType:"lead",
            entityId:id,
            metadata:{ changedFields }
        })];
        if("status" in updates && updates.status !== currentLead.status){
            activities.push(recordActivity({
                actorId:currentUser.uid,actorType:"user",action:"lead.status_changed",entityType:"lead",entityId:id,
                metadata:{ previousStatus:currentLead.status ?? null,newStatus:updates.status }
            }));
            if(typeof currentLead.ownerId === "string") activities.push(createNotification({
                userId:currentLead.ownerId,type:"lead.status_changed",title:"Lead status changed",
                message:`Lead status changed to ${String(updates.status).replaceAll("_"," ")}.`,entityType:"lead",entityId:id
            }).then(()=>""));
        }
        if("notes" in updates && updates.notes !== currentLead.notes){
            activities.push(recordActivity({
                actorId:currentUser.uid,actorType:"user",action:"lead.notes_changed",entityType:"lead",entityId:id,
                metadata:{ changed:true }
            }));
        }
        await Promise.all(activities).catch(()=>undefined);

        return NextResponse.json({ success:true });
    }
    catch {
        console.error("Lead update failed");

        return NextResponse.json(
            {
                error:
                "Failed to update lead"
            },
            { status:500 }
        );
    }
}
