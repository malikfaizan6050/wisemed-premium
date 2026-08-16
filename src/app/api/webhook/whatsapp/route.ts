import { NextResponse } from "next/server";

import {
    getSession,
    saveSession
} from "@/lib/whatsapp-session";


import {
    processMessage
} from "@/lib/ai-agent";




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
            challenge
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


    const result =
        await response.json();


    console.log(
        "WhatsApp response:",
        result
    );


    return result;

}








// ======================================
// Receive WhatsApp Messages
// ======================================


export async function POST(
    request:Request
){


    try {



        // Read incoming WhatsApp payload

        const body =
            await request.json();



        console.log(
            "Incoming WhatsApp:",
            JSON.stringify(body,null,2)
        );






        // ======================================
        // Send payload to n8n AI Agent
        // ======================================


        try {


            const n8nResponse =
            await fetch(

                "https://malikfaizan6653.app.n8n.cloud/webhook/wisemed-whatsapp",

                {

                    method:"POST",

                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:
                    JSON.stringify(body)

                }

            );



            console.log(
                "n8n status:",
                n8nResponse.status
            );



        }
        catch(error){


            console.error(
                "n8n error:",
                error
            );


        }







        // ======================================
        // Extract WhatsApp Message
        // ======================================


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






        // Ignore webhook status updates

        if(
            !phone ||
            !message
        ){


            return NextResponse.json({

                received:true,

                message:
                "No user message"

            });


        }







        console.log({

            phone,

            message

        });








        // ======================================
        // Load Conversation Session
        // ======================================


        const session =
            await getSession(
                phone
            );







        // ======================================
        // AI Processing
        // ======================================


        const aiResult =
            processMessage(

                message,

                session.data

            );





        console.log(
            "AI RESULT:",
            aiResult
        );







        // Save progress


        await saveSession(

            phone,

            aiResult.collected

        );







        // ======================================
        // Continue Conversation
        // ======================================


        if(
            !aiResult.completed
        ){



            await sendWhatsAppMessage(

                phone,

                aiResult.nextQuestion

            );


        }







        // ======================================
        // Create CRM Lead
        // ======================================


        else{


            const leadData = {


                ...aiResult.collected,


                phone,


                status:
                "new_inquiry",


                priority:
                "high",


                leadScore:
                85,


                source:
                "whatsapp_ai",


                notes:
                "Qualified through WhatsApp AI Receptionist"


            };






            const crmResponse =
            await fetch(

                `${process.env.NEXT_PUBLIC_APP_URL}/api/leads`,

                {

                    method:"POST",


                    headers:{

                        "Content-Type":
                        "application/json",


                        Authorization:
                        `Bearer ${process.env.WISEMED_CRM_API_KEY}`

                    },


                    body:
                    JSON.stringify(
                        leadData
                    )

                }

            );




            console.log(
                "CRM status:",
                crmResponse.status
            );






            await sendWhatsAppMessage(

                phone,


                `Thank you for providing your information ✅

Our RCM specialist will review your details and contact you shortly.

Thank you for choosing WiseMed Billing.`

            );


        }








        return NextResponse.json({

            received:true,

            completed:
            aiResult.completed

        });






    }
    catch(error){


        console.error(
            "Webhook error:",
            error
        );



        return NextResponse.json(

            {

                received:false,

                error:
                "Webhook failed"

            },

            {

                status:500

            }

        );


    }


}