import "server-only";

import type { Lead } from "@/types/crm";
import { claimNotificationEmail,completeNotificationEmail } from "@/repositories/notificationRepository";
import { escapeEmailHtml,sendEmail } from "@/services/emailService";
import { crmLoginUrl } from "@/lib/crmUrl";

interface LeadAssignmentEmailInput {
    notificationId:string;
    employee:{ email:string;displayName:string };
    lead:Lead;
    assignedBy:string;
    assignedAt:Date;
}

export async function sendLeadAssignmentEmailOnce(input:LeadAssignmentEmailInput) {
    if(!await claimNotificationEmail(input.notificationId)) return false;
    const providerName=`${input.lead.firstName??""} ${input.lead.lastName??""}`.trim()||"Not provided";
    const loginUrl=crmLoginUrl();
    const fields=[
        ["Employee",input.employee.displayName],
        ["Lead provider",providerName],
        ["Practice",input.lead.organization||"Not provided"],
        ["Specialty",input.lead.specialty||"Not provided"],
        ["Priority",input.lead.priority||"Not provided"],
        ["Pipeline stage",input.lead.status||"Not provided"],
        ["Assigned by",input.assignedBy],
        ["Assigned at",input.assignedAt.toLocaleString("en-US",{ timeZone:"UTC",timeZoneName:"short" })]
    ];
    const text=[`Hello ${input.employee.displayName},`,`A new lead has been assigned to you.`,...fields.slice(1).map(([label,value])=>`${label}: ${value}`),`CRM login: ${loginUrl}`].join("\n");
    const rows=fields.map(([label,value])=>`<tr><td style="padding:6px 12px 6px 0;font-weight:600">${escapeEmailHtml(label)}</td><td style="padding:6px 0">${escapeEmailHtml(value)}</td></tr>`).join("");
    try {
        await sendEmail({
            to:input.employee.email,
            subject:"New Lead Assigned to You - WiseMedBilling CRM",
            text,
            html:`<p>Hello ${escapeEmailHtml(input.employee.displayName)},</p><p>A new lead has been assigned to you.</p><table>${rows}</table><p><a href="${escapeEmailHtml(loginUrl)}">Log in to WiseMedBilling CRM</a></p>`
        });
        await completeNotificationEmail(input.notificationId,true);
        return true;
    }
    catch(error){
        await completeNotificationEmail(input.notificationId,false).catch(()=>undefined);
        throw error;
    }
}
