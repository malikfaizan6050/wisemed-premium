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

interface BulkLeadAssignmentEmailInput {
    notificationIds:readonly string[];
    employee:{ email:string;displayName:string };
    leads:readonly Lead[];
    assignedBy:string;
    assignedAt:Date;
}

function providerNameOf(lead:Lead) {
    return `${lead.firstName??""} ${lead.lastName??""}`.trim()||lead.organization||"Not provided";
}

// A batch of two hundred assignments would otherwise be two hundred separate
// emails to the same salesperson, which reads as spam and runs into the email
// provider's rate limit. One message lists the whole batch; the in-app
// notifications stay one per lead, since each of those opens its own lead.
const BULK_EMAIL_ROW_LIMIT = 25;

export async function sendBulkLeadAssignmentEmailOnce(input:BulkLeadAssignmentEmailInput) {
    const claimed=(await Promise.all(input.notificationIds.map(async(id)=>
        await claimNotificationEmail(id).catch(()=>false) ? id : null
    ))).filter((id):id is string=>Boolean(id));
    if(claimed.length===0) return false;

    const loginUrl=crmLoginUrl();
    const listed=input.leads.slice(0,BULK_EMAIL_ROW_LIMIT);
    const remaining=input.leads.length-listed.length;
    const count=input.leads.length;
    const heading=`${count} lead${count===1?"":"s"} ${count===1?"has":"have"} been assigned to you by ${input.assignedBy}.`;
    const lines=listed.map((lead)=>`- ${providerNameOf(lead)}${lead.organization?` (${lead.organization})`:""}`);
    if(remaining>0) lines.push(`- ...and ${remaining} more`);

    const text=[
        `Hello ${input.employee.displayName},`,
        heading,
        ...lines,
        `Assigned at: ${input.assignedAt.toLocaleString("en-US",{ timeZone:"UTC",timeZoneName:"short" })}`,
        `CRM login: ${loginUrl}`
    ].join("\n");
    const items=listed.map((lead)=>`<li>${escapeEmailHtml(providerNameOf(lead))}${lead.organization?` <span style="color:#64748b">(${escapeEmailHtml(lead.organization)})</span>`:""}</li>`).join("");
    const more=remaining>0?`<li>...and ${remaining} more</li>`:"";

    try {
        await sendEmail({
            to:input.employee.email,
            subject:`${count} New Lead${count===1?"":"s"} Assigned to You - WiseMedBilling CRM`,
            text,
            html:`<p>Hello ${escapeEmailHtml(input.employee.displayName)},</p><p>${escapeEmailHtml(heading)}</p><ul>${items}${more}</ul><p>Assigned at: ${escapeEmailHtml(input.assignedAt.toLocaleString("en-US",{ timeZone:"UTC",timeZoneName:"short" }))}</p><p><a href="${escapeEmailHtml(loginUrl)}">Log in to WiseMedBilling CRM</a></p>`
        });
        await Promise.all(claimed.map((id)=>completeNotificationEmail(id,true).catch(()=>undefined)));
        return true;
    }
    catch(error){
        await Promise.all(claimed.map((id)=>completeNotificationEmail(id,false).catch(()=>undefined)));
        throw error;
    }
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
