import type { CRMDateValue } from "@/types/crm-auth";

export interface CRMNotification {
    id:string;
    userId:string;
    type:"lead.assigned"|"lead_assigned"|"lead.created"|"lead.status_changed"|"lead.notes_changed"|"user.created"|"activity.created";
    title:string;
    message:string;
    entityType:string;
    entityId:string;
    leadId?:string;
    /** Set when the notification also has an email to deliver, so the send can be claimed once. */
    emailStatus?:"pending"|"sending"|"sent"|"failed";
    read:boolean;
    createdAt:CRMDateValue;
}
