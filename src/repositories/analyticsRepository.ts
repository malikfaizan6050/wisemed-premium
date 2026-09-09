import "server-only";

import { db } from "@/lib/firebase-admin";
import { FieldPath } from "firebase-admin/firestore";
import { listActivityRecords } from "@/repositories/activityRepository";
import type { CRMUser } from "@/types/crm-auth";
import type { Lead } from "@/types/crm";
import { mapCRMUser } from "@/lib/crmUserRepository";
import { listLeadsForOwners } from "@/repositories/leadRepository";

export async function getAnalyticsLeads(ownerIds?:string[]):Promise<Lead[]> {
    return listLeadsForOwners(ownerIds??null,2000);
}

export async function getAnalyticsEmployees(employeeIds?:string[]):Promise<CRMUser[]> {
    if(employeeIds){
        if(!employeeIds.length) return [];
        const chunks=Array.from({ length:Math.ceil(employeeIds.length/30) },(_,index)=>employeeIds.slice(index*30,index*30+30));
        const snapshots=await Promise.all(chunks.map((ids)=>db.collection("users").where(FieldPath.documentId(),"in",ids).get()));
        return snapshots.flatMap((snapshot)=>snapshot.docs).map((document)=>mapCRMUser(document.id,document.data())).filter((user):user is CRMUser=>user?.status==="active");
    }
    const query:FirebaseFirestore.Query = db.collection("users").where("status","==","active");
    const snapshot = await query.limit(500).get();
    return snapshot.docs.map((document)=>mapCRMUser(document.id,document.data())).filter((user):user is CRMUser=>user !== null);
}

export async function getAnalyticsActivities(actorIds?:string[]) {
    const activities=await listActivityRecords({ limit:100 });
    return actorIds?activities.filter((activity)=>actorIds.includes(activity.actorId)):activities;
}
