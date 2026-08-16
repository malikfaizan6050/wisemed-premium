import { NextResponse } from "next/server";


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

                    messaging_product:"whatsapp",

                    to:phone,

                    type:"text",

                    text:{
                        body:message
                    }

                })

            }

        );



        const data = await response.json();


        console.log(
            "WhatsApp API response:",
            data
        );


        return data;


    }
    catch(error){


        console.error(
            "WhatsApp sending error:",
            error
        );


        return null;

    }

}







// ======================================
// Receive WhatsApp Messages
// ======================================

export async function POST(
    request:Request
){

    try {


        const body = await request.json();



        console.log(
            "Incoming WhatsApp Payload:",
            JSON.stringify(body,null,2)
        );






        // Extract message

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







        // Ignore status updates

        if(
            !phone ||
            !message
        ){

            console.log(
                "No user message received"
            );


            return NextResponse.json(
                {
                    received:true
                },
                {
                    status:200
                }
            );

        }






        console.log(
            "USER:",
            phone,
            message
        );








        // ======================================
        // Send to n8n AI Agent
        // ======================================


        const n8nResponse = await fetch(

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




        console.log(
            "n8n status:",
            n8nResponse.status
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
        // Send AI reply back to WhatsApp
        // ======================================


        if(
            n8nData?.reply
        ){

            await sendWhatsAppMessage(

                phone,

                n8nData.reply

            );

        }
        else{


            console.log(
                "No reply returned from n8n"
            );


        }






        return NextResponse.json(

            {

                received:true,

                n8nStatus:
                n8nResponse.status

            },

            {
                status:200
            }

        );







    }
    catch(error){


        console.error(
            "Webhook error:",
            error
        );



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