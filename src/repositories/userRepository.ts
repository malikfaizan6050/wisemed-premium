import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getCRMUserById,mapCRMUser } from "@/lib/crmUserRepository";
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

export interface ListUsersOptions {
    limit?:number;
    status?:CRMUserStatus;
    roleId?:string;
}

export async function listUsers(options:ListUsersOptions = {}):Promise<CRMUser[]> {
    const safeLimit = Math.min(Math.max(options.limit ?? 50,1),100);
    let usersQuery:FirebaseFirestore.Query = db.collection("users");
    if(options.status) usersQuery = usersQuery.where("status","==",options.status);
    if(options.roleId) usersQuery = usersQuery.where("roleId","==",options.roleId);

    const snapshot = await usersQuery.limit(safeLimit).get();
    return snapshot.docs
        .map((document)=>mapCRMUser(document.id,document.data()))
        .filter((user):user is CRMUser=>user !== null)
        .sort((first,second)=>first.displayName.localeCompare(second.displayName));
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
