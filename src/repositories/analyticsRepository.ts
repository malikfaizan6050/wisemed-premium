import "server-only";

import { db } from "@/lib/firebase-admin";
import { listActivityRecords } from "@/repositories/activityRepository";
import type { CRMUser } from "@/types/crm-auth";
import type { Lead } from "@/types/crm";
import { mapCRMUser } from "@/lib/crmUserRepository";

export async function getAnalyticsLeads(ownerId?:string):Promise<Lead[]> {
    let query:FirebaseFirestore.Query = db.collection("crm_leads");
    if(ownerId) query = query.where("ownerId","==",ownerId);
    const snapshot = await query.limit(2000).get();
    return snapshot.docs.map((document)=>({ id:document.id,...document.data() } as Lead));
}

export async function getAnalyticsEmployees(employeeId?:string):Promise<CRMUser[]> {
    if(employeeId){
        const document = await db.collection("users").doc(employeeId).get();
        const user = document.exists ? mapCRMUser(document.id,document.data()) : null;
        return user?.status === "active" ? [user] : [];
    }
    const query:FirebaseFirestore.Query = db.collection("users").where("status","==","active");
    const snapshot = await query.limit(500).get();
    return snapshot.docs.map((document)=>mapCRMUser(document.id,document.data())).filter((user):user is CRMUser=>user !== null);
}

export async function getAnalyticsActivities(actorId?:string) {
    return listActivityRecords({ actorId,limit:100 });
}
