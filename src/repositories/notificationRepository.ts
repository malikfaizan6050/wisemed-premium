import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import type { CRMNotification } from "@/types/crm-notification";

export type NotificationInput=Omit<CRMNotification,"id"|"read"|"createdAt">;

export async function createNotificationRecord(input:NotificationInput){ return db.collection("notifications").add({ ...input,read:false,createdAt:FieldValue.serverTimestamp() }); }
export async function listNotificationRecords(userId:string,limit=20):Promise<CRMNotification[]> {
    const snapshot=await db.collection("notifications").where("userId","==",userId).orderBy("createdAt","desc").limit(Math.min(Math.max(limit,1),50)).get();
    return snapshot.docs.map((document)=>({ id:document.id,...document.data() } as CRMNotification));
}
export async function markNotificationRead(id:string,userId:string){
    const reference=db.collection("notifications").doc(id);
    return db.runTransaction(async(transaction)=>{ const snapshot=await transaction.get(reference);if(!snapshot.exists || snapshot.data()?.userId!==userId) return false;transaction.update(reference,{ read:true });return true; });
}
