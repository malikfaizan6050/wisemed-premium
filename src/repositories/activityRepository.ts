import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import type { ActivityActorType,ActivityEvent } from "@/types/crm-auth";

export interface ActivityRecordInput {
    actorId:string;
    actorType:ActivityActorType;
    action:string;
    entityType:string;
    entityId:string;
    metadata?:Record<string,unknown>;
}

export interface ActivityListOptions {
    actorId?:string;
    action?:string;
    from?:Date;
    to?:Date;
    limit?:number;
}

export async function createActivityRecord(input:ActivityRecordInput) {
    const reference = await db.collection("employee_activities").add({
        ...input,
        metadata:input.metadata ?? {},
        createdAt:FieldValue.serverTimestamp()
    });
    return reference.id;
}

export async function listActivityRecords(options:ActivityListOptions = {}):Promise<ActivityEvent[]> {
    const safeLimit = Math.min(Math.max(options.limit ?? 50,1),100);
    // Fetch a bounded window and apply optional filters in memory so deployments
    // do not require a new composite index for every filter combination.
    const snapshot = await db.collection("employee_activities").orderBy("createdAt","desc").limit(500).get();
    return snapshot.docs.flatMap((document)=>{
        const data = document.data();
        const createdAt = data.createdAt;
        if(!createdAt || typeof createdAt.toDate !== "function") return [];
        const date = createdAt.toDate();
        if(options.actorId && data.actorId !== options.actorId) return [];
        if(options.action && data.action !== options.action) return [];
        if(options.from && date < options.from) return [];
        if(options.to && date > options.to) return [];
        return [{
            id:document.id,
            actorId:typeof data.actorId === "string" ? data.actorId : "system",
            actorType:data.actorType === "integration" || data.actorType === "system" ? data.actorType : "user",
            action:typeof data.action === "string" ? data.action : "unknown",
            entityType:typeof data.entityType === "string" ? data.entityType : "unknown",
            entityId:typeof data.entityId === "string" ? data.entityId : "",
            metadata:data.metadata && typeof data.metadata === "object" ? data.metadata as Record<string,unknown> : {},
            createdAt
        }];
    }).slice(0,safeLimit);
}
