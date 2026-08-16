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


    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");


    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {

        return new Response(challenge);

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
// Send WhatsApp Message Helper
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

                "Authorization":
                `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,

                "Content-Type":
                "application/json"

            },


            body:JSON.stringify({

                messaging_product:"whatsapp",

                to:phone,

                type:"text",

                text:{

                    body:message

                }

            })

        }

    );


    return response.json();

}





// ======================================
// Receive WhatsApp Messages
// ======================================

export async function POST(request:Request){


    try{


        const body = await request.json();



        console.log(
            "Incoming WhatsApp:",
            JSON.stringify(body,null,2)
        );




        const phone =
            body?.entry?.[0]
            ?.changes?.[0]
            ?.value
            ?.messages?.[0]
            ?.from;



        const message =
            body?.entry?.[0]
            ?.changes?.[0]
            ?.value
            ?.messages?.[0]
            ?.text
            ?.body;




        if(!phone || !message){


            return NextResponse.json({

                received:false,

                error:"Message missing"

            },{
                status:400
            });


        }





        console.log({

            phone,

            message

        });





        // ======================================
        // LOAD USER SESSION
        // ======================================


        const session =
            await getSession(phone);





        // ======================================
        // AI QUALIFICATION
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
        // IF ALL INFORMATION COMPLETED
        // CREATE CRM LEAD
        // ======================================


        if(aiResult.completed){



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
                "whatsapp",



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


                        "Authorization":
                        `Bearer ${process.env.WISEMED_CRM_API_KEY}`


                    },


                    body:

                    JSON.stringify(
                        leadData
                    )

                }

            );






            console.log(
                "CRM Status:",
                crmResponse.status
            );







            await sendWhatsAppMessage(

                phone,

                `Thank you for providing your information ✅

Our RCM specialist will review your details and contact you shortly.

Thank you for choosing WiseMed Billing.`

            );



        }

        else{



            // Continue asking questions


            await sendWhatsAppMessage(

                phone,

                aiResult.nextQuestion

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



        return NextResponse.json({

            received:false,

            error:"Webhook failed"

        },{
            status:500
        });


    }


}