import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";


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


        console.log(
            "WhatsApp API:",
            data
        );


        return data;


    }
    catch(error){

        console.error(
            "WhatsApp send error:",
            error
        );


        return null;

    }

}









// ======================================
// Create CRM Lead
// ======================================

async function createCRMLead(
    lead:any,
    phone:string
){


    try {


        await db
        .collection("crm_leads")
        .add({


            firstName:
            lead.firstName || "",


            lastName:
            lead.lastName || "",


            email:
            lead.email || "",


            phone:
            lead.phone || phone,


            organization:
            lead.organization || "",


            specialty:
            lead.specialty || "",


            npi:
            lead.npi || "",



            claimsVolume:
            lead.monthlyClaims || 0,


            monthlyClaims:
            lead.monthlyClaims || 0,



            currentBillingMethod:
            lead.currentBillingMethod || "unknown",



            ehrSystem:
            lead.ehrSystem || "",



            denialRate:
            0,


            estimatedRevenue:
            0,



            status:
            "new_inquiry",



            priority:
            "standard",



            leadScore:
            0,



            opportunityScore:
            0,



            message:
            lead.message || "",



            challenges:
            lead.challenges || [],



            notes:
            "",



            nextAction:
            "Review WhatsApp lead",



            assignedTo:
            null,



            source:
            "whatsapp_ai",



            whatsappNumber:
            phone,



            createdAt:
            new Date(),



            updatedAt:
            new Date()


        });



        console.log(
            "CRM lead created successfully"
        );


    }
    catch(error){

        console.error(
            "CRM creation error:",
            error
        );

    }

}









// ======================================
// Receive WhatsApp Messages
// ======================================

export async function POST(
    request:Request
){

try {


    const body =
    await request.json();



    console.log(
        "Incoming:",
        JSON.stringify(body,null,2)
    );




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




    console.log(
        "USER:",
        phone,
        message
    );







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




    console.log(
        "n8n response:",
        n8nData
    );









    // ======================================
    // Save CRM Lead Automatically
    // ======================================


    if(
        n8nData?.lead
    ){

        await createCRMLead(
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

            crmCreated:
            !!n8nData?.lead

        },

        {
            status:200
        }

    );





}
catch(error:any){


    console.error(
        "Webhook error:",
        error
    );



    return NextResponse.json(

        {

            received:false,

            error:
            error.message

        },

        {
            status:500
        }

    );


}


}