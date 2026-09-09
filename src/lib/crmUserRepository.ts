import "server-only";

import { db } from "@/lib/firebase-admin";
import type { CRMDateValue,CRMUser } from "@/types/crm-auth";

export const CRM_USERS_COLLECTION = "users";

function isDateValue(value:unknown):value is CRMDateValue {
    return value instanceof Date || Boolean(
        value && typeof value === "object" && "toDate" in value &&
        typeof value.toDate === "function"
    );
}

export function mapCRMUser(uid:string,data:FirebaseFirestore.DocumentData | undefined):CRMUser | null {
    if(!data){
        if(process.env.NODE_ENV === "development"){
            console.info("[CRM user validation] Failed",{ uid,reason:"document_data_missing",missingRequiredFields:["document"] });
        }
        return null;
    }

    const roleId=typeof data.roleId==="string"&&data.roleId.trim()
        ? data.roleId.trim()
        : typeof data.role==="string" ? data.role.trim() : "";
    const displayName=typeof data.displayName==="string"&&data.displayName.trim()
        ? data.displayName
        : typeof data.name==="string" ? data.name : "";
    const missingRequiredFields:string[] = [];
    if(!roleId) missingRequiredFields.push("roleId");
    if(!["active","suspended","invited"].includes(data.status)) missingRequiredFields.push("status");
    const missingLegacyFields:string[] = [];
    if(!isDateValue(data.createdAt)) missingLegacyFields.push("createdAt");
    if(!isDateValue(data.updatedAt)) missingLegacyFields.push("updatedAt");

    if(missingRequiredFields.length){
        if(process.env.NODE_ENV === "development"){
            console.info("[CRM user validation] Failed",{
                uid,
                reason:"required_fields_invalid",
                missingRequiredFields,
                fieldTypes:{ roleId:typeof data.roleId,role:typeof data.role,status:typeof data.status }
            });
        }
        return null;
    }

    if(process.env.NODE_ENV === "development" && missingLegacyFields.length){
        console.info("[CRM user validation] Legacy fields defaulted",{
            uid,
            missingRequiredFields:[],
            missingLegacyFields
        });
    }

    const fallbackDate = new Date(0);

    return {
        uid,
        email:typeof data.email === "string" ? data.email : "",
        displayName,
        phone:typeof data.phone === "string" ? data.phone : "",
        jobTitle:typeof data.jobTitle === "string" ? data.jobTitle : "",
        roleId,
        teamId:typeof data.teamId === "string" ? data.teamId : null,
        managerId:typeof data.managerId === "string" ? data.managerId : null,
        status:data.status as CRMUser["status"],
        createdAt:isDateValue(data.createdAt) ? data.createdAt : null,
        createdById:typeof data.createdById === "string" ? data.createdById : "",
        updatedAt:isDateValue(data.updatedAt) ? data.updatedAt : fallbackDate,
        lastLoginAt:isDateValue(data.lastLoginAt) ? data.lastLoginAt : null,
        mustChangePassword:data.mustChangePassword === true,
        temporaryPasswordExpiresAt:isDateValue(data.temporaryPasswordExpiresAt) ? data.temporaryPasswordExpiresAt : null
    };
}

export async function getCRMUserById(uid:string):Promise<CRMUser | null> {
    const snapshot = await db.collection(CRM_USERS_COLLECTION).doc(uid).get();
    return snapshot.exists ? mapCRMUser(snapshot.id,snapshot.data()) : null;
}
