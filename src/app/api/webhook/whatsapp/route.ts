import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createPublicLead } from "@/services/leadIntakeService";
import { enforceRateLimit } from "@/lib/rateLimit";

interface IncomingLead {
    firstName?:string;
    lastName?:string;
    email?:string;
    phone?:string;
    organization?:string;
    specialty?:string;
    npi?:string;
    monthlyClaims?:number;
    currentBillingMethod?:string;
    ehrSystem?:string;
    message?:string;
    challenges?:string[];
}

function hasValidMetaSignature(payload:string,signature:string | null) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if(!appSecret || !signature?.startsWith("sha256=")){
        return false;
    }

    const expected = `sha256=${createHmac("sha256",appSecret)
        .update(payload,"utf8")
        .digest("hex")}`;
    const suppliedBuffer = Buffer.from(signature,"utf8");
    const expectedBuffer = Buffer.from(expected,"utf8");

    return suppliedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(suppliedBuffer,expectedBuffer);
}


// ======================================
// WhatsApp Webhook Verification
// ======================================

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);


    const mode =
        searchParams.get("hub.mode");

    const token =
        searchParams.get("hub.verify_token");

    const challenge =
        searchParams.get("hub.challenge");



    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {

        return new Response(
            challenge || "",
            {
                status:200,
                headers:{
                    "Content-Type":"text/plain"
                }
            }
        );

    }



    return NextResponse.json(
        {
            error:"Verification failed"
        },
        {
            status:403
        }
    );

}







// ======================================
// Send WhatsApp Message
// ======================================

async function sendWhatsAppMessage(
    phone:string,
    message:string
){

    try {


        const response = await fetch(

            `https://graph.facebook.com/v26.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,

            {

                method:"POST",

                headers:{

                    Authorization:
                    `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,

                    "Content-Type":
                    "application/json"

                },


                body:JSON.stringify({

                    messaging_product:
                    "whatsapp",

                    to:phone,

                    type:"text",

                    text:{
                        body:message
                    }

                })

            }

        );


        const data =
        await response.json();


        return data;


    }
    catch {

        console.error("WhatsApp send failed");


        return null;

    }

}









// ======================================
// Create CRM Lead
// ======================================


/**
 * Hands a WhatsApp enquiry to the same intake path the website form uses.
 *
 * This route used to write straight into `crm_leads` with `leadScore:0` and
 * `priority:"standard"` hard-coded, no duplicate check and none of the
 * normalised lookup keys. Every WhatsApp lead therefore scored zero however
 * strong it was, ranked below every website lead, and arrived again as a fresh
 * record each time Meta retried the webhook. Routing it here gives it the
 * scoring, duplicate detection, activity trail and owner alerts that every
 * other lead gets.
 */
async function createCRMLead(
    lead:IncomingLead,
    phone:string
){

    try {

        const result = await createPublicLead({

            firstName:lead.firstName || "",

            lastName:lead.lastName || "",

            email:lead.email || "",

            phone:lead.phone || phone,

            organization:lead.organization || "",

            npi:lead.npi || "",

            specialty:lead.specialty || "",

            claimsVolume:
            Number.isFinite(Number(lead.monthlyClaims))
            ? Math.max(0,Number(lead.monthlyClaims))
            : 0,

            currentBillingMethod:lead.currentBillingMethod || "",

            ehrSystem:lead.ehrSystem || "",

            message:lead.message || "",

            billingChallenges:
            Array.isArray(lead.challenges)
            ? lead.challenges.filter((item):item is string=>typeof item === "string")
            : [],

            // Messaging us on WhatsApp is the opt-in to be answered there.
            contactConsent:true,

            source:"whatsapp_ai",

            whatsappNumber:phone

        });

        return result.ok;

    }
    catch {

        console.error("WhatsApp CRM lead creation failed");

        return false;

    }

}




// ======================================
// Receive WhatsApp Messages
// ======================================

export async function POST(
    request:Request
){

// Meta retries a webhook it believes failed, and an outage upstream can turn
// that into a burst. The signature check below rejects forgeries; this keeps a
// retry storm from running the AI and lead pipeline hundreds of times a minute.
const limited = enforceRateLimit(request,"whatsapp.webhook",120);
if(limited) return limited;

try {
    const rawBody = await request.text();

    if(!hasValidMetaSignature(
        rawBody,
        request.headers.get("x-hub-signature-256")
    )){
        return NextResponse.json(
            { received:false,error:"Invalid webhook signature" },
            { status:401 }
        );
    }

    const body = JSON.parse(rawBody);




    const messageObject =
        body
        ?.entry?.[0]
        ?.changes?.[0]
        ?.value
        ?.messages?.[0];



    const phone =
        messageObject?.from;



    const message =
        messageObject
        ?.text
        ?.body;




    if(
        !phone ||
        !message
    ){

        return NextResponse.json(
            {
                received:true
            }
        );

    }





    // ======================================
    // Send to n8n AI
    // ======================================


    const n8nResponse =
    await fetch(

        "https://malikfaizan6653.app.n8n.cloud/webhook/wisemed-whatsapp",

        {

            method:"POST",

            headers:{

                "Content-Type":
                "application/json"

            },


            body:JSON.stringify({

                phone,

                message

            })

        }

    );





    const n8nData =
    await n8nResponse
    .json()
    .catch(()=>null);






    // ======================================
    // Save CRM Lead Automatically
    // ======================================


    let crmCreated = false;

    if(
        n8nData?.lead
    ){

        crmCreated = await createCRMLead(
            n8nData.lead,
            phone
        );

    }








    // ======================================
    // Reply to WhatsApp
    // ======================================


    if(
        n8nData?.output
    ){

        await sendWhatsAppMessage(

            phone,

            n8nData.output

        );

    }






    return NextResponse.json(

        {

            received:true,

            crmCreated

        },

        {
            status:200
        }

    );





}
catch {


    console.error("WhatsApp webhook processing failed");



    return NextResponse.json(

        {

            received:false,

            error:"Webhook failed"

        },

        {
            status:500
        }

    );


}


}
