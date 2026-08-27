import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getLeadOwner,type LeadOwner } from "@/lib/leadOwnership";
import type { Lead } from "@/types/crm";

export async function getLeadById(id:string):Promise<Lead | null> {
    const snapshot = await db.collection("crm_leads").doc(id).get();
    if(!snapshot.exists) return null;
    return { id:snapshot.id,...snapshot.data() } as Lead;
}

export async function listLeadsForUser(ownerId?:string,limit=500):Promise<Lead[]> {
    let leadsQuery:FirebaseFirestore.Query = db.collection("crm_leads");
    if(ownerId) leadsQuery = leadsQuery.where("ownerId","==",ownerId);
    const snapshot = await leadsQuery.limit(Math.min(Math.max(limit,1),500)).get();
    return snapshot.docs.map((document)=>{
        const { emailNormalized:_email,phoneNormalized:_phone,npiNormalized:_npi,...data }=document.data();
        void _email;void _phone;void _npi;
        return { id:document.id,...data } as Lead;
    });
}

export interface AssignLeadInput {
    leadId:string;
    owner:LeadOwner;
    actorId:string;
    actorDisplayName:string;
}

export async function assignLeadOwner(input:AssignLeadInput) {
    const leadReference = db.collection("crm_leads").doc(input.leadId);
    const activityReference = db.collection("employee_activities").doc();

    return db.runTransaction(async(transaction)=>{
        const snapshot = await transaction.get(leadReference);
        if(!snapshot.exists) return null;

        const lead = { id:snapshot.id,...snapshot.data() } as Lead;
        const previousOwner = getLeadOwner(lead);
        const timestamp = FieldValue.serverTimestamp();
        const ownerSnapshot = {
            displayName:input.owner.displayName,
            email:input.owner.email
        };

        transaction.update(leadReference,{
            ownerId:input.owner.id,
            ownerSnapshot,
            assignedById:input.actorId,
            assignedAt:timestamp,
            updatedAt:timestamp,
            // Temporary compatibility mirrors; authorization never reads them.
            assignedTo:input.owner.displayName,
            assignedBy:input.actorDisplayName
        });
        transaction.create(activityReference,{
            type:"lead.assigned",
            action:"lead.assigned",
            actorType:"user",
            actorId:input.actorId,
            entityType:"lead",
            entityId:input.leadId,
            changes:{
                previousOwner,
                newOwner:input.owner
            },
            metadata:{},
            createdAt:timestamp
        });

        return { previousOwner,newOwner:input.owner,ownerSnapshot };
    });
}
