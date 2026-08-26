import { db } from "@/lib/firebase-admin";
import { calculateLeadScore, getLeadPriority } from "@/lib/leadScoring";
import {
    findDuplicateLead,
    normalizeEmail,
    normalizeNpi,
    normalizePhone
} from "@/lib/leadDuplicateDetection";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";

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
    "assignedTo",
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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id:string }> }
) {
    const authResult = await requirePermission(request,"leads.update.all");
    if(!authResult.ok){
        return authResult.response;
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

        if("assignedTo" in updates){
            updates.assignedTo = updates.assignedTo || null;
            updates.assignedAt = new Date();
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
