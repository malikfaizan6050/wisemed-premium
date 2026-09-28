import "server-only";

import nodemailer,{ type Transporter } from "nodemailer";

interface EmailInput { to:string;subject:string;text:string;html:string }

/**
 * Carries the provider's own wording alongside the generic message. Throwing a
 * flat "rejected" left the CRM telling users an email failed with no way to
 * find out why, so every caller that reports a delivery failure can now say
 * what the provider actually objected to.
 */
export class EmailDeliveryError extends Error {
    constructor(message:string,public readonly reason:string) {
        super(message);
        this.name="EmailDeliveryError";
    }
}

// Resend's shared sandbox sender. It exists so a new account can send a test
// message before owning a domain, and it may only write to the address the
// Resend account itself is registered under - every other recipient comes back
// 403. Leaving it configured in a deployment means assignment emails to staff
// are rejected one hundred percent of the time.
const SANDBOX_SENDER_DOMAIN="resend.dev";

const senderDomain=(from:string)=>from.split("@").pop()?.replace(/>$/,"").trim().toLowerCase()??"";

/**
 * SMTP wins when it is configured, because a company that has pointed
 * SMTP_HOST at its own mail server has asked for mail to leave from there.
 * Resend stays the fallback so a deployment that sets neither keeps its old
 * behaviour rather than silently going quiet.
 */
function selectedTransport() {
    if(process.env.SMTP_HOST?.trim()) return "smtp" as const;
    if(process.env.RESEND_API_KEY?.trim()) return "resend" as const;
    return "none" as const;
}

function requiredSender() {
    const from=process.env.CRM_EMAIL_FROM?.trim();
    if(!from) throw new EmailDeliveryError("Email delivery is not configured","CRM_EMAIL_FROM is not set on this deployment");
    return from;
}

// One transporter is reused across invocations so a warm serverless instance
// keeps its connection pool instead of reopening TLS to the mail server for
// every notification.
let cachedTransporter:Transporter|null=null;
let cachedTransporterKey="";

function smtpTransporter() {
    const host=process.env.SMTP_HOST!.trim();
    const user=process.env.SMTP_USER?.trim();
    const password=process.env.SMTP_PASSWORD;
    if(!user||!password){
        throw new EmailDeliveryError(
            "Email delivery is not configured",
            `${!user?"SMTP_USER":"SMTP_PASSWORD"} is not set, and ${host} requires authentication to relay mail`
        );
    }
    // 465 is implicit TLS; 587 opens plain and upgrades with STARTTLS. Getting
    // this pair wrong is the usual cause of a hang rather than a clean error.
    const port=Number(process.env.SMTP_PORT?.trim()||"465");
    const key=`${host}:${port}:${user}`;
    if(cachedTransporter&&cachedTransporterKey===key) return cachedTransporter;
    cachedTransporter=nodemailer.createTransport({
        host,
        port,
        secure:port===465,
        auth:{ user,pass:password },
        pool:true,
        maxConnections:3,
        connectionTimeout:15000,
        greetingTimeout:15000
    });
    cachedTransporterKey=key;
    return cachedTransporter;
}

function smtpFailureReason(error:unknown,host:string) {
    const code=error&&typeof error==="object"&&"code" in error?String((error as { code:unknown }).code):"";
    const message=error instanceof Error?error.message:"SMTP delivery failed";
    if(code==="EAUTH") return `${host} rejected the SMTP username or password (${message})`;
    if(code==="ECONNECTION"||code==="ETIMEDOUT"||code==="ESOCKET"){
        return `Could not reach ${host} on port ${process.env.SMTP_PORT?.trim()||"465"} (${message}). Check the host, the port, and that outbound SMTP is not blocked.`;
    }
    if(code==="EENVELOPE") return `${host} refused the sender or recipient address (${message})`;
    return message;
}

async function sendViaSmtp(input:EmailInput,from:string) {
    const host=process.env.SMTP_HOST!.trim();
    try {
        await smtpTransporter().sendMail({ from,to:input.to,subject:input.subject,text:input.text,html:input.html });
    }
    catch(error){
        // A pooled transporter that failed to connect is not worth keeping.
        cachedTransporter=null;
        cachedTransporterKey="";
        throw new EmailDeliveryError("Mail server rejected the message",smtpFailureReason(error,host));
    }
}

async function resendRejectionReason(response:Response,from:string) {
    const body=await response.text().catch(()=>"");
    let message="";
    try {
        const parsed=JSON.parse(body) as Record<string,unknown>;
        message=[parsed.message,parsed.error,parsed.name].find((value):value is string=>typeof value==="string"&&value.trim().length>0)??"";
    }
    catch { /* the provider did not answer with JSON */ }
    if(!message) message=body.trim()||`Email provider responded ${response.status}`;
    if(senderDomain(from)===SANDBOX_SENDER_DOMAIN){
        message+=` (CRM_EMAIL_FROM is still the ${SANDBOX_SENDER_DOMAIN} sandbox sender, which can only deliver to the Resend account owner's own address - verify a domain in Resend, or set SMTP_HOST to send through your own mail server instead)`;
    }
    return message;
}

async function sendViaResend(input:EmailInput,from:string) {
    const response=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY!.trim()}`,"Content-Type":"application/json" },
        body:JSON.stringify({ from,to:[input.to],subject:input.subject,text:input.text,html:input.html })
    });
    if(!response.ok) throw new EmailDeliveryError("Email provider rejected the message",await resendRejectionReason(response,from));
}

export async function sendEmail(input:EmailInput) {
    const transport=selectedTransport();
    if(transport==="none"){
        throw new EmailDeliveryError(
            "Email delivery is not configured",
            "Set SMTP_HOST to send through your own mail server, or RESEND_API_KEY to send through Resend"
        );
    }
    const from=requiredSender();
    if(transport==="smtp") return sendViaSmtp(input,from);
    return sendViaResend(input,from);
}

export function describeEmailFailure(error:unknown) {
    if(error instanceof EmailDeliveryError) return error.reason;
    if(error instanceof Error) return error.message;
    return "Email delivery failed";
}

export function escapeEmailHtml(value:string) {
    return value.replace(/[&<>"']/g,(character)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[character]??character);
}
