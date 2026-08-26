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
import { getLeadContactError } from "@/lib/leadValidation";

type LeadInput = Record<string, unknown>;

function firstValue(data: LeadInput, ...keys:string[]) {
    for(const key of keys){
        const value = data[key];
        if(value !== undefined && value !== null && value !== ""){
            return value;
        }
    }

    return undefined;
}

function textValue(data: LeadInput, ...keys:string[]) {
    const value = firstValue(data,...keys);
    return typeof value === "string" ? value.trim() : "";
}

function numberValue(data: LeadInput, ...keys:string[]) {
    const value = firstValue(data,...keys);
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}

function booleanValue(data: LeadInput, ...keys:string[]) {
    const value = firstValue(data,...keys);
    return typeof value === "boolean" ? value : false;
}

function stringList(data: LeadInput, ...keys:string[]) {
    const value = firstValue(data,...keys);

    if(Array.isArray(value)){
        return value.filter((item):item is string => typeof item === "string");
    }

    return [];
}

export async function POST(request: NextRequest) {
    const authResult = await requirePermission(request,"leads.create");
    if(!authResult.ok){
        return authResult.response;
    }

    try {
        const body:unknown = await request.json();

        if(!body || typeof body !== "object" || Array.isArray(body)){
            return NextResponse.json(
                { error:"Invalid lead data" },
                { status:400 }
            );
        }

        const data = body as LeadInput;
        const fullName = textValue(data,"name","full_name");
        const nameParts = fullName ? fullName.split(/\s+/) : [];
        const billingSetup = textValue(
            data,
            "billingSetup",
            "billing_setup",
            "currentBillingMethod"
        );
        const billingChallenge = textValue(
            data,
            "billingChallenge",
            "billing_challenge"
        );
        const challenges = stringList(
            data,
            "challenges",
            "billingChallenges",
            "billing_challenges"
        );

        const lead = {
            firstName:
                textValue(data,"firstName","first_name") ||
                nameParts[0] ||
                "",
            lastName:
                textValue(data,"lastName","last_name") ||
                nameParts.slice(1).join(" "),
            email:textValue(data,"email"),
            phone:textValue(data,"phone"),
            organization:textValue(
                data,
                "organization",
                "practiceName",
                "practice_name"
            ),
            specialty:textValue(data,"specialty","medical_specialty"),
            npi:textValue(data,"npi"),
            practiceLocation:textValue(
                data,
                "practiceLocation",
                "practice_location"
            ),
            providerCount:numberValue(
                data,
                "providerCount",
                "provider_count",
                "numberOfProviders",
                "providers"
            ),
            practiceSize:textValue(data,"practiceSize","practice_size"),
            claimsVolume:numberValue(
                data,
                "claimsVolume",
                "monthlyClaims",
                "monthlyClaimsVolume",
                "monthly_claim_volume"
            ),
            monthlyClaims:numberValue(
                data,
                "monthlyClaims",
                "claimsVolume",
                "monthlyClaimsVolume",
                "monthly_claim_volume"
            ),
            monthlyCollections:numberValue(
                data,
                "monthlyCollections",
                "monthly_collections"
            ),
            estimatedRevenue:numberValue(
                data,
                "estimatedRevenue",
                "estimated_revenue"
            ),
            denialRate:numberValue(data,"denialRate","denial_rate"),
            currentBillingMethod:
                textValue(data,"currentBillingMethod","billing_setup","billingSetup") ||
                "unknown",
            billingSetup,
            billingChallenge:
                billingChallenge || challenges.join(", "),
            challenges,
            interestedService:textValue(
                data,
                "interestedService",
                "interested_service"
            ),
            ehrSystem:textValue(data,"ehrSystem","ehr_system","ehr"),
            conversationSummary:textValue(
                data,
                "conversationSummary",
                "conversation_summary"
            ),
            preferredContactMethod:textValue(
                data,
                "preferredContactMethod",
                "preferred_contact_method"
            ),
            preferredContactTime:textValue(
                data,
                "preferredContactTime",
                "preferred_contact_time"
            ),
            contactConsent:booleanValue(
                data,
                "contactConsent",
                "contact_consent"
            ),
            message:textValue(data,"message","conversation_summary"),
            source:textValue(data,"source") || "whatsapp_ai",
            status:textValue(data,"status") || "new_inquiry",
            assignedTo:null,
            notes:textValue(data,"notes"),
            nextAction:
                textValue(data,"nextAction","next_action") ||
                "Review provider inquiry",
            dueDate:null,
            activity:[],
            createdAt:new Date(),
            updatedAt:new Date()
        };

        const contactError = getLeadContactError(lead);
        if(contactError){
            return NextResponse.json(
                { error:contactError },
                { status:400 }
            );
        }

        const duplicate = await findDuplicateLead({
            email:lead.email,
            phone:lead.phone,
            npi:lead.npi
        });

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

        const leadScore = calculateLeadScore(lead);
        const priority = getLeadPriority(leadScore);
        const storedLead = {
            ...lead,
            emailNormalized:normalizeEmail(lead.email),
            phoneNormalized:normalizePhone(lead.phone),
            npiNormalized:normalizeNpi(lead.npi),
            leadScore,
            opportunityScore:leadScore,
            priority
        };

        const document = await db
            .collection("crm_leads")
            .add(storedLead);

        return NextResponse.json({
            success:true,
            message:"Lead created successfully",
            id:document.id,
            lead:storedLead
        });
    }
    catch {
        console.error("Lead creation failed");

        return NextResponse.json(
            {
                error:
                    "Failed to create lead"
            },
            { status:500 }
        );
    }
}
