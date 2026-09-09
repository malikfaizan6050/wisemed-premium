import "server-only";

interface EmailInput { to:string;subject:string;text:string;html:string }

export async function sendEmail(input:EmailInput) {
    const apiKey=process.env.RESEND_API_KEY;
    const from=process.env.CRM_EMAIL_FROM;
    if(!apiKey||!from) throw new Error("Email delivery is not configured");
    const response=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{ Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json" },
        body:JSON.stringify({ from,to:[input.to],subject:input.subject,text:input.text,html:input.html })
    });
    if(!response.ok) throw new Error("Email provider rejected the message");
}

export function escapeEmailHtml(value:string) {
    return value.replace(/[&<>"']/g,(character)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[character]??character);
}
