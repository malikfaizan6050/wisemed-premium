import "server-only";

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

async function rejectionReason(response:Response,from:string) {
    const body=await response.text().catch(()=>"");
    let message="";
    try {
        const parsed=JSON.parse(body) as Record<string,unknown>;
        message=[parsed.message,parsed.error,parsed.name].find((value):value is string=>typeof value==="string"&&value.trim().length>0)??"";
    }
    catch { /* the provider did not answer with JSON */ }
    if(!message) message=body.trim()||`Email provider responded ${response.status}`;
    if(senderDomain(from)===SANDBOX_SENDER_DOMAIN){
        message+=` (CRM_EMAIL_FROM is still the ${SANDBOX_SENDER_DOMAIN} sandbox sender, which can only deliver to the Resend account owner's own address - verify a domain in Resend and send from it instead)`;
    }
    return message;
}

export async function sendEmail(input:EmailInput) {
    const apiKey=process.env.RESEND_API_KEY;
    const from=process.env.CRM_EMAIL_FROM;
    if(!apiKey||!from){
        throw new EmailDeliveryError(
            "Email delivery is not configured",
            `${!apiKey?"RESEND_API_KEY":"CRM_EMAIL_FROM"} is not set on this deployment`
        );
    }
    const response=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{ Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json" },
        body:JSON.stringify({ from,to:[input.to],subject:input.subject,text:input.text,html:input.html })
    });
    if(!response.ok) throw new EmailDeliveryError("Email provider rejected the message",await rejectionReason(response,from));
}

export function describeEmailFailure(error:unknown) {
    if(error instanceof EmailDeliveryError) return error.reason;
    if(error instanceof Error) return error.message;
    return "Email delivery failed";
}

export function escapeEmailHtml(value:string) {
    return value.replace(/[&<>"']/g,(character)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[character]??character);
}
