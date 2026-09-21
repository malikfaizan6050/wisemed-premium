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
    createdAt:CRMDateValue | null;
    createdById:string;
    updatedAt:CRMDateValue;
    lastLoginAt:CRMDateValue | null;
    mustChangePassword:boolean;
    temporaryPasswordExpiresAt:CRMDateValue | null;
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
    /** Resolved display name for actorId. Set by the activity service on read. */
    actorName?:string;
    entityType:string;
    entityId:string;
    /** Human-readable name of the affected record, when it can be resolved. */
    entityLabel?:string;
    metadata:Record<string,unknown>;
    createdAt:CRMDateValue;
}

export interface EmployeePerformance {
    totalLeads:number;
    assignedLeads:number;
    completedLeads:number;
    pendingLeads:number;
    recentActivityCount:number;
    conversionRate:number;
    recentActivities:ActivityEvent[];
    employee:Pick<CRMUser,"uid"|"email"|"displayName"|"jobTitle"|"roleId"|"status">;
    role:Role | null;
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

export interface AssignableCRMUser {
    uid:string;
    displayName:string;
    email:string;
    role:{
        id:string;
        name:string;
    };
}

export interface CurrentCRMUser extends CRMUser {
    permissions:Permission[];
    role:Role;
    authType:"firebase" | "service";
}
