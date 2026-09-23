import "server-only";

import { db } from "@/lib/firebase-admin";
import { calculateLeadScore,getLeadPriority } from "@/lib/leadScoring";
import {
    findDuplicateLead,
    normalizeEmail,
    normalizeNpi,
    normalizeOrganization,
    normalizePhone
} from "@/lib/leadDuplicateDetection";
import { recordActivity } from "@/services/activityService";
import { createNotification } from "@/services/notificationService";
import { listUsers } from "@/repositories/userRepository";
import { listRoles } from "@/repositories/roleRepository";
import { hasPermission } from "@/lib/permissions";
import { DEFAULT_LEAD_STAGE } from "@/lib/leadStages";
import { LEADS_COLLECTION } from "@/lib/crmCollections";
import { sendLeadArrivalEmailOnce,type LeadArrivalEmailInput } from "@/services/leadArrivalEmailService";

export interface PublicLeadIntake {
    firstName:string;
    lastName:string;
    email:string;
    phone:string;
    organization:string;
    npi:string;
    specialty:string;
    claimsVolume:number;
    currentBillingMethod:string;
    ehrSystem:string;
    message:string;
    billingChallenges:string[];
    contactConsent:boolean;
    source:string;
    /** Set for enquiries arriving over WhatsApp, so the thread can be traced. */
    whatsappNumber?:string;
}

export type LeadIntakeResult =
    | { ok:true; id:string }
    | { ok:false; reason:"duplicate"; duplicateId:string; matchingFields:string[] };

/**
 * Notifies everyone whose role can see every lead, because a lead arriving from
 * the public site has no owner yet and would otherwise sit unseen.
 * Never throws: a failed notification must not lose the lead itself.
 */
async function notifyLeadWatchers(
    leadId:string,
    summary:string,
    lead:LeadArrivalEmailInput["lead"],
    receivedAt:Date
) {
    try {
        const roles = await listRoles();
        const watchingRoleIds = new Set(
            roles
                .filter((role)=>role.status === "active" && hasPermission(role.permissions,"leads.read.all"))
                .map((role)=>role.id)
        );
        if(watchingRoleIds.size === 0) return;

        const users = await listUsers({ status:"active",limit:100 });
        const watchers = users.filter((user)=>watchingRoleIds.has(user.roleId));

        await Promise.all(watchers.map(async(user)=>{
            const notification = await createNotification({
                userId:user.uid,
                type:"lead.created",
                title:"New website enquiry",
                message:summary,
                entityType:"lead",
                entityId:leadId,
                leadId,
                // Marks the notification as awaiting an email so the send can be
                // claimed exactly once, matching how assignment emails work.
                emailStatus:"pending"
            }).catch(()=>null);

            if(!notification || !user.email) return;

            // Email is best-effort: an unconfigured or failing provider must not
            // discard a lead that is already saved.
            await sendLeadArrivalEmailOnce({
                notificationId:notification.id,
                recipient:{ email:user.email,displayName:user.displayName },
                lead,
                receivedAt
            }).catch(()=>undefined);
        }));
    }
    catch {
        // Swallowed deliberately; the lead is already saved.
        console.error("Lead watcher notification failed");
    }
}

/**
 * The one path a public enquiry takes into the CRM.
 *
 * The consultation form used to write to a `consultations` collection that no
 * CRM screen reads, so website enquiries never reached the pipeline. Everything
 * now lands in the same collection the CRM reads, with the same duplicate
 * check, scoring, activity trail and alerts that internally created leads get.
 */
export async function createPublicLead(input:PublicLeadIntake):Promise<LeadIntakeResult> {
    const duplicate = await findDuplicateLead({
        email:input.email,
        phone:input.phone,
        npi:input.npi,
        organization:input.organization
    });

    if(duplicate){
        return {
            ok:false,
            reason:"duplicate",
            duplicateId:duplicate.id,
            matchingFields:duplicate.matchingFields
        };
    }

    const leadScore = calculateLeadScore(input);
    const now = new Date();

    const storedLead = {
        firstName:input.firstName,
        lastName:input.lastName,
        email:input.email,
        phone:input.phone,
        organization:input.organization,
        specialty:input.specialty,
        npi:input.npi,
        claimsVolume:input.claimsVolume,
        monthlyClaims:input.claimsVolume,
        estimatedRevenue:0,
        denialRate:0,
        currentBillingMethod:input.currentBillingMethod || "unknown",
        billingChallenge:input.billingChallenges.join(", "),
        challenges:input.billingChallenges,
        ehrSystem:input.ehrSystem,
        message:input.message,
        contactConsent:input.contactConsent,
        source:input.source,
        status:DEFAULT_LEAD_STAGE,
        leadScore,
        opportunityScore:leadScore,
        priority:getLeadPriority(leadScore),
        emailNormalized:normalizeEmail(input.email),
        phoneNormalized:normalizePhone(input.phone),
        npiNormalized:normalizeNpi(input.npi),
        organizationNormalized:normalizeOrganization(input.organization),
        ...(input.whatsappNumber ? { whatsappNumber:input.whatsappNumber } : {}),
        assignedTo:null,
        ownerId:null,
        ownerSnapshot:null,
        assignedById:null,
        assignedAt:null,
        notes:"",
        nextAction:"Review website enquiry",
        dueDate:null,
        activity:[],
        createdAt:now,
        updatedAt:now
    };

    const document = await db.collection(LEADS_COLLECTION).add(storedLead);

    await recordActivity({
        actorId:"website",
        actorType:"system",
        action:"lead.created",
        entityType:"lead",
        entityId:document.id,
        metadata:{ source:input.source }
    }).catch(()=>undefined);

    const summary = `${input.firstName} ${input.lastName}`.trim() || input.organization || "A new lead";
    await notifyLeadWatchers(document.id,summary,{
        firstName:input.firstName,
        lastName:input.lastName,
        organization:input.organization,
        specialty:input.specialty,
        email:input.email,
        phone:input.phone,
        priority:storedLead.priority,
        leadScore
    },now);

    return { ok:true,id:document.id };
}
