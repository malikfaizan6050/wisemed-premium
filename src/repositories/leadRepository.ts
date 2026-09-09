import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getLeadOwner,type LeadOwner } from "@/lib/leadOwnership";
import type { Lead } from "@/types/crm";

export async function getLeadById(id:string):Promise<Lead | null> {
    const snapshot = await db.collection("crm_leads").doc(id).get();
    if(!snapshot.exists) return null;
    return { id:snapshot.id,...snapshot.data() } as Lead;
}

export async function listLeadsForUser(ownerId?:string,limit=500):Promise<Lead[]> {
    return listLeadsForOwners(ownerId?[ownerId]:null,limit);
}

export async function listLeadsForOwners(ownerIds:string[]|null,limit=500):Promise<Lead[]> {
    const safeLimit=Math.min(Math.max(limit,1),2000);
    if(ownerIds&&ownerIds.length===0) return [];
    const chunks=ownerIds
        ? Array.from({ length:Math.ceil(ownerIds.length/30) },(_,index)=>ownerIds.slice(index*30,index*30+30))
        : [null];
    const snapshots=await Promise.all(chunks.map((chunk)=>{
        let query:FirebaseFirestore.Query=db.collection("crm_leads");
        if(chunk) query=chunk.length===1?query.where("ownerId","==",chunk[0]):query.where("ownerId","in",chunk);
        return query.limit(safeLimit).get();
    }));
    return snapshots.flatMap((snapshot)=>snapshot.docs).slice(0,safeLimit).map((document)=>{
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
    const notificationReference = db.collection("notifications").doc();

    return db.runTransaction(async(transaction)=>{
        const snapshot = await transaction.get(leadReference);
        if(!snapshot.exists) return null;

        const lead = { id:snapshot.id,...snapshot.data() } as Lead;
        const previousOwner = getLeadOwner(lead);
        if(lead.ownerId===input.owner.id){
            return { previousOwner,newOwner:input.owner,ownerSnapshot:lead.ownerSnapshot??null,changed:false,notificationId:typeof snapshot.data()?.assignmentNotificationId==="string"?snapshot.data()?.assignmentNotificationId:null,lead,assignedAt:lead.assignedAt };
        }
        const timestamp = Timestamp.now();
        const ownerSnapshot = {
            displayName:input.owner.displayName,
            email:input.owner.email
        };

        transaction.update(leadReference,{
            ownerId:input.owner.id,
            ownerSnapshot,
            assignedById:input.actorId,
            assignedAt:timestamp,
            assignmentNotificationId:notificationReference.id,
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
        transaction.create(notificationReference,{
            userId:input.owner.id,
            type:"lead_assigned",
            title:"New lead assigned",
            leadId:input.leadId,
            message:`${lead.firstName} ${lead.lastName}`.trim()||lead.organization||"A lead",
            entityType:"lead",
            entityId:input.leadId,
            read:false,
            emailStatus:"pending",
            createdAt:timestamp
        });

        return { previousOwner,newOwner:input.owner,ownerSnapshot,changed:true,notificationId:notificationReference.id,lead,assignedAt:timestamp };
    });
}
