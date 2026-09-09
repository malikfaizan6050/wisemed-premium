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
    mustChangePassword?:boolean;
    temporaryPasswordExpiresAt?:Date | null;
}

export type UpdateUserProfileInput = Partial<Pick<
    CRMUser,
    "email" | "displayName" | "phone" | "jobTitle" | "roleId" |
    "teamId" | "managerId" | "status" | "lastLoginAt" |
    "mustChangePassword" | "temporaryPasswordExpiresAt"
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

export async function listTeamMemberIds(manager:CRMUser):Promise<string[]> {
    let query:FirebaseFirestore.Query=db.collection("users").where("status","==","active");
    query=manager.teamId
        ? query.where("teamId","==",manager.teamId)
        : query.where("managerId","==",manager.uid);
    const snapshot=await query.limit(500).get();
    return Array.from(new Set([manager.uid,...snapshot.docs.map((document)=>document.id)]));
}

export { getCRMUserById as getUserById };

export async function createUserProfile(input:CreateUserProfileInput,audit:AuditInput) {
    const userReference = db.collection("users").doc(input.uid);
    const activityReference = db.collection("employee_activities").doc();
    const batch = db.batch();
    const timestamp = FieldValue.serverTimestamp();

    batch.create(userReference,{
        ...input,
        name:input.displayName,
        role:input.roleId,
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

    batch.update(userReference,{
        ...updates,
        ...(updates.displayName ? { name:updates.displayName } : {}),
        ...(updates.roleId ? { role:updates.roleId } : {}),
        updatedAt:timestamp
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

export async function createUserActivity(audit:AuditInput) {
    await db.collection("employee_activities").add({
        ...audit,
        actorType:"user",
        type:audit.action,
        entityType:"user",
        createdAt:FieldValue.serverTimestamp()
    });
}

export async function activateInvitedUser(uid:string) {
    const userReference = db.collection("users").doc(uid);
    const activityReference = db.collection("employee_activities").doc();
    await db.runTransaction(async(transaction)=>{
        const snapshot = await transaction.get(userReference);
        if(!snapshot.exists || snapshot.data()?.status !== "invited") return;
        const timestamp = FieldValue.serverTimestamp();
        transaction.update(userReference,{ status:"active",updatedAt:timestamp,lastLoginAt:timestamp });
        transaction.create(activityReference,{
            actorId:uid,
            actorType:"user",
            type:"user.invitation_accepted",
            action:"user.invitation_accepted",
            entityType:"user",
            entityId:uid,
            metadata:{ previousStatus:"invited",newStatus:"active" },
            createdAt:timestamp
        });
    });
}

export async function deleteUserData(user:CRMUser,actorId:string) {
    const [leadSnapshot,managedUserSnapshot,notificationSnapshot] = await Promise.all([
        db.collection("crm_leads").where("ownerId","==",user.uid).get(),
        db.collection("users").where("managerId","==",user.uid).get(),
        db.collection("notifications").where("userId","==",user.uid).get()
    ]);

    const operations:Array<(batch:FirebaseFirestore.WriteBatch)=>void> = [];
    leadSnapshot.docs.forEach((document)=>operations.push((batch)=>batch.update(document.ref,{
        ownerId:null,
        ownerSnapshot:null,
        assignedTo:null,
        updatedAt:FieldValue.serverTimestamp()
    })));
    managedUserSnapshot.docs.forEach((document)=>operations.push((batch)=>batch.update(document.ref,{
        managerId:null,
        updatedAt:FieldValue.serverTimestamp()
    })));
    notificationSnapshot.docs.forEach((document)=>operations.push((batch)=>batch.delete(document.ref)));

    for(let index=0;index<operations.length;index+=450){
        const batch=db.batch();
        operations.slice(index,index+450).forEach((operation)=>operation(batch));
        await batch.commit();
    }

    const batch=db.batch();
    const activityReference=db.collection("employee_activities").doc();
    batch.delete(db.collection("users").doc(user.uid));
    batch.create(activityReference,{
        actorId,
        actorType:"user",
        type:"user.deleted",
        action:"user.deleted",
        entityType:"user",
        entityId:user.uid,
        metadata:{
            deletedUserId:user.uid,
            deletedEmail:user.email,
            deletedRole:user.roleId,
            deletedByAdminId:actorId,
            unassignedLeadCount:leadSnapshot.size
        },
        createdAt:FieldValue.serverTimestamp()
    });
    await batch.commit();
}
