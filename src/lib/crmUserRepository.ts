import "server-only";

import { db } from "@/lib/firebase-admin";
import type { CRMUser } from "@/types/crm-auth";

export const CRM_USERS_COLLECTION = "users";

function isDateValue(value:unknown):value is CRMUser["createdAt"] {
    return value instanceof Date || Boolean(
        value && typeof value === "object" && "toDate" in value &&
        typeof value.toDate === "function"
    );
}

export function mapCRMUser(uid:string,data:FirebaseFirestore.DocumentData | undefined):CRMUser | null {
    if(!data || !isDateValue(data.createdAt) || !isDateValue(data.updatedAt)) return null;
    if(!["active","suspended","invited"].includes(data.status)) return null;

    return {
        uid,
        email:typeof data.email === "string" ? data.email : "",
        displayName:typeof data.displayName === "string" ? data.displayName : "",
        phone:typeof data.phone === "string" ? data.phone : "",
        jobTitle:typeof data.jobTitle === "string" ? data.jobTitle : "",
        roleId:typeof data.roleId === "string" ? data.roleId : "",
        teamId:typeof data.teamId === "string" ? data.teamId : null,
        managerId:typeof data.managerId === "string" ? data.managerId : null,
        status:data.status as CRMUser["status"],
        createdAt:data.createdAt,
        createdById:typeof data.createdById === "string" ? data.createdById : "",
        updatedAt:data.updatedAt,
        lastLoginAt:isDateValue(data.lastLoginAt) ? data.lastLoginAt : null
    };
}

export async function getCRMUserById(uid:string):Promise<CRMUser | null> {
    const snapshot = await db.collection(CRM_USERS_COLLECTION).doc(uid).get();
    return snapshot.exists ? mapCRMUser(snapshot.id,snapshot.data()) : null;
}
