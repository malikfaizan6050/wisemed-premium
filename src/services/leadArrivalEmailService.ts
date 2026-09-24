import "server-only";

import { claimNotificationEmail,completeNotificationEmail } from "@/repositories/notificationRepository";
import { escapeEmailHtml,sendEmail } from "@/services/emailService";
import { crmLoginUrl } from "@/lib/crmUrl";

export interface LeadArrivalEmailInput {
    notificationId:string;
    recipient:{ email:string;displayName:string };
    lead:{
        firstName:string;
        lastName:string;
        organization:string;
        specialty:string;
        email:string;
        phone:string;
        priority:string;
        leadScore:number;
    };
    receivedAt:Date;
}

/**
 * Emails a new website enquiry to someone who can act on it.
 *
 * A new lead previously produced only an in-app bell notification, so nobody
 * learned an enquiry had arrived unless they happened to be signed in. Claiming
 * the notification first means a retry or a concurrent send cannot email the
 * same person twice.
 */
export async function sendLeadArrivalEmailOnce(input:LeadArrivalEmailInput) {
    if(!await claimNotificationEmail(input.notificationId)) return false;

    const providerName=`${input.lead.firstName} ${input.lead.lastName}`.trim()||"Not provided";
    const loginUrl=crmLoginUrl();
    const fields=[
        ["Provider",providerName],
        ["Practice",input.lead.organization||"Not provided"],
        ["Specialty",input.lead.specialty||"Not provided"],
        ["Email",input.lead.email||"Not provided"],
        ["Phone",input.lead.phone||"Not provided"],
        ["Priority",input.lead.priority||"Not provided"],
        ["Lead score",String(input.lead.leadScore)],
        ["Received",input.receivedAt.toLocaleString("en-US",{ timeZone:"UTC",timeZoneName:"short" })]
    ];

    const text=[
        `Hello ${input.recipient.displayName},`,
        "A new enquiry has arrived from the website.",
        ...fields.map(([label,value])=>`${label}: ${value}`),
        `CRM login: ${loginUrl}`
    ].join("\n");

    const rows=fields
        .map(([label,value])=>`<tr><td style="padding:6px 12px 6px 0;font-weight:600">${escapeEmailHtml(label)}</td><td style="padding:6px 0">${escapeEmailHtml(value)}</td></tr>`)
        .join("");

    try {
        await sendEmail({
            to:input.recipient.email,
            subject:`New Website Enquiry: ${input.lead.organization||providerName} - WiseMedBilling CRM`,
            text,
            html:`<p>Hello ${escapeEmailHtml(input.recipient.displayName)},</p><p>A new enquiry has arrived from the website.</p><table>${rows}</table><p><a href="${escapeEmailHtml(loginUrl)}">Log in to WiseMedBilling CRM</a></p>`
        });
        await completeNotificationEmail(input.notificationId,true);
        return true;
    }
    catch(error){
        await completeNotificationEmail(input.notificationId,false).catch(()=>undefined);
        throw error;
    }
}
