import type { Permission } from "@/lib/permissions";
export type { Permission } from "@/lib/permissions";

export type CRMUserStatus = "active" | "suspended" | "invited";
export type RoleStatus = "active" | "disabled";

export type CRMDateValue = Date | {
    toDate:()=>Date;
};

export interface CRMUser {
    uid:string;
    email:string;
    displayName:string;
    phone:string;
    jobTitle:string;
    roleId:string;
    teamId:string | null;
    managerId:string | null;
    status:CRMUserStatus;
    createdAt:CRMDateValue;
    createdById:string;
    updatedAt:CRMDateValue;
    lastLoginAt:CRMDateValue | null;
}

export interface Role {
    id:string;
    name:string;
    description:string;
    permissions:Permission[];
    isSystemRole:boolean;
    status:RoleStatus;
    createdAt:CRMDateValue;
    updatedAt:CRMDateValue;
    createdById:string;
    updatedById:string;
}

export type ActivityActorType = "user" | "integration" | "system";

export interface ActivityEvent {
    id:string;
    action:string;
    actorType:ActivityActorType;
    actorId:string;
    entityType:"lead" | "user" | "role";
    entityId:string;
    metadata:Record<string,unknown>;
    createdAt:CRMDateValue;
}

export interface LeadOwnership {
    ownerId:string | null;
    ownerSnapshot:{
        displayName:string;
        email:string;
    } | null;
    assignedById:string | null;
    assignedAt:CRMDateValue | null;
}

export interface CurrentCRMUser extends CRMUser {
    permissions:Permission[];
    role:Role;
    authType:"firebase" | "service";
}
