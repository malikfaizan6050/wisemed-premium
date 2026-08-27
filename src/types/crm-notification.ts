import type { CRMDateValue } from "@/types/crm-auth";

export interface CRMNotification {
    id:string;
    userId:string;
    type:"lead.assigned"|"lead.status_changed"|"user.created"|"activity.created";
    title:string;
    message:string;
    entityType:string;
    entityId:string;
    read:boolean;
    createdAt:CRMDateValue;
}
