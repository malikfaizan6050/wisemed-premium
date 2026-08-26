import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getCRMUserById } from "@/lib/crmUserRepository";
import type { CRMUser,CRMUserStatus } from "@/types/crm-auth";

export interface CreateUserProfileInput {
    uid:string;
    email:string;
    displayName:string;
    phone:string;
    jobTitle:string;
    roleId:string;
    teamId:string | null;
    managerId:string | null;
    status:CRMUserStatus;
    createdById:string;
}

export type UpdateUserProfileInput = Partial<Pick<
    CRMUser,
    "email" | "displayName" | "phone" | "jobTitle" | "roleId" |
    "teamId" | "managerId" | "status" | "lastLoginAt"
>>;

interface AuditInput {
    actorId:string;
    action:string;
    entityId:string;
    metadata:Record<string,unknown>;
}

export async function listUsers(limit=100):Promise<CRMUser[]> {
    const safeLimit = Math.min(Math.max(limit,1),100);
    const snapshot = await db.collection("users").orderBy("displayName").limit(safeLimit).get();
    const users = await Promise.all(snapshot.docs.map((document)=>getCRMUserById(document.id)));
    return users.filter((user):user is CRMUser=>user !== null);
}

export { getCRMUserById as getUserById };

export async function createUserProfile(input:CreateUserProfileInput,audit:AuditInput) {
    const userReference = db.collection("users").doc(input.uid);
    const activityReference = db.collection("employee_activities").doc();
    const batch = db.batch();
    const timestamp = FieldValue.serverTimestamp();

    batch.create(userReference,{
        ...input,
        createdAt:timestamp,
        updatedAt:timestamp,
        lastLoginAt:null
    });
    batch.create(activityReference,{
        actorId:audit.actorId,
        actorType:"user",
        type:audit.action,
        action:audit.action,
        entityType:"user",
        entityId:audit.entityId,
        metadata:audit.metadata,
        createdAt:timestamp
    });
    await batch.commit();
}

export async function updateUserProfile(uid:string,updates:UpdateUserProfileInput,audit:AuditInput) {
    const userReference = db.collection("users").doc(uid);
    const activityReference = db.collection("employee_activities").doc();
    const batch = db.batch();
    const timestamp = FieldValue.serverTimestamp();

    batch.update(userReference,{ ...updates,updatedAt:timestamp });
    batch.create(activityReference,{
        actorId:audit.actorId,
        actorType:"user",
        type:audit.action,
        action:audit.action,
        entityType:"user",
        entityId:audit.entityId,
        metadata:audit.metadata,
        createdAt:timestamp
    });
    await batch.commit();
}

export async function createUserActivity(audit:AuditInput) {
    await db.collection("employee_activities").add({
        ...audit,
        actorType:"user",
        type:audit.action,
        entityType:"user",
        createdAt:FieldValue.serverTimestamp()
    });
}
