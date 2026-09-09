import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { isPermission } from "@/lib/permissions";
import type { Permission,Role,RoleStatus } from "@/types/crm-auth";

interface RoleAuditInput {
    actorId:string;
    action:string;
    entityId:string;
    metadata:Record<string,unknown>;
}

export interface CreateRoleRecord {
    name:string;
    description:string;
    permissions:Permission[];
    isSystemRole:boolean;
    status:RoleStatus;
    createdById:string;
    updatedById:string;
}

export type UpdateRoleRecord = Partial<Pick<Role,"name" | "description" | "permissions" | "status" | "updatedById">>;

function isDateValue(value:unknown):value is Role["createdAt"] {
    return value instanceof Date || Boolean(
        value && typeof value === "object" && "toDate" in value &&
        typeof value.toDate === "function"
    );
}

function mapRole(id:string,data:FirebaseFirestore.DocumentData | undefined):Role | null {
    if(!data){
        if(process.env.NODE_ENV === "development"){
            console.info("[CRM role validation] Failed",{ roleId:id,reason:"document_data_missing" });
        }
        return null;
    }
    if(!Array.isArray(data.permissions)){
        if(process.env.NODE_ENV === "development"){
            console.info("[CRM role validation] Failed",{
                roleId:id,
                reason:"permissions_missing_or_not_array",
                permissionsIsArray:false
            });
        }
        return null;
    }
    const permissions=Array.from(new Set(data.permissions.filter(isPermission)));
    const ignoredPermissions=data.permissions.filter((permission:unknown)=>!isPermission(permission));
    if(process.env.NODE_ENV === "development" && ignoredPermissions.length){
        console.info("[CRM role validation] Unknown permissions ignored",{
            roleId:id,
            ignoredPermissions
        });
    }
    const isSystemRole=data.isSystemRole === true || id === "admin" || id === "sales";
    const status=data.status === "active" || data.status === "disabled"
        ? data.status
        : isSystemRole ? "active" : "disabled";
    const fallbackDate=new Date(0);
    if(process.env.NODE_ENV === "development" && (!isDateValue(data.createdAt) || !isDateValue(data.updatedAt) || data.status === undefined)){
        console.info("[CRM role validation] Legacy fields defaulted",{
            roleId:id,
            missingFields:[
                ...(!isDateValue(data.createdAt) ? ["createdAt"] : []),
                ...(!isDateValue(data.updatedAt) ? ["updatedAt"] : []),
                ...(data.status === undefined ? ["status"] : [])
            ],
            resolvedStatus:status
        });
    }
    return {
        id,
        name:typeof data.name === "string" ? data.name : "",
        description:typeof data.description === "string" ? data.description : "",
        permissions,
        isSystemRole,
        status,
        createdAt:isDateValue(data.createdAt) ? data.createdAt : fallbackDate,
        updatedAt:isDateValue(data.updatedAt) ? data.updatedAt : fallbackDate,
        createdById:typeof data.createdById === "string" ? data.createdById : "system",
        updatedById:typeof data.updatedById === "string" ? data.updatedById : "system"
    };
}

export async function getRoleById(id:string):Promise<Role | null> {
    if(!id) return null;
    const snapshot = await db.collection("roles").doc(id).get();
    if(process.env.NODE_ENV === "development"){
        console.info("[CRM role lookup]",{
            firestorePath:`roles/${id}`,
            documentExists:snapshot.exists
        });
    }
    return snapshot.exists ? mapRole(snapshot.id,snapshot.data()) : null;
}

export async function listRoles():Promise<Role[]> {
    const snapshot = await db.collection("roles").orderBy("name").get();
    return snapshot.docs.map((document)=>mapRole(document.id,document.data())).filter((role):role is Role=>role !== null);
}

export async function roleNameExists(name:string,excludingId?:string) {
    const normalized = name.trim().toLocaleLowerCase();
    const roles = await listRoles();
    return roles.some((role)=>role.id !== excludingId && role.name.trim().toLocaleLowerCase() === normalized);
}

export async function createRoleRecord(record:CreateRoleRecord,audit:Omit<RoleAuditInput,"entityId">) {
    const roleReference = db.collection("roles").doc();
    const activityReference = db.collection("employee_activities").doc();
    const timestamp = FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.create(roleReference,{ ...record,createdAt:timestamp,updatedAt:timestamp });
    batch.create(activityReference,{
        actorId:audit.actorId,actorType:"user",type:audit.action,action:audit.action,
        entityType:"role",entityId:roleReference.id,metadata:audit.metadata,createdAt:timestamp
    });
    await batch.commit();
    return roleReference.id;
}

export async function updateRoleRecord(id:string,updates:UpdateRoleRecord,audit:RoleAuditInput) {
    const roleReference = db.collection("roles").doc(id);
    const activityReference = db.collection("employee_activities").doc();
    const timestamp = FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.update(roleReference,{ ...updates,updatedAt:timestamp });
    batch.create(activityReference,{
        actorId:audit.actorId,actorType:"user",type:audit.action,action:audit.action,
        entityType:"role",entityId:id,metadata:audit.metadata,createdAt:timestamp
    });
    await batch.commit();
}

export async function deleteRoleRecord(id:string,audit:RoleAuditInput) {
    const roleReference = db.collection("roles").doc(id);
    const activityReference = db.collection("employee_activities").doc();
    return db.runTransaction(async(transaction)=>{
        const assignedUsers = await transaction.get(
            db.collection("users").where("roleId","==",id).limit(1)
        );
        if(!assignedUsers.empty) return false;

        transaction.delete(roleReference);
        transaction.create(activityReference,{
            actorId:audit.actorId,actorType:"user",type:audit.action,action:audit.action,
            entityType:"role",entityId:id,metadata:audit.metadata,createdAt:FieldValue.serverTimestamp()
        });
        return true;
    });
}
