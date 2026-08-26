import { db } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest) {

    console.log("🔥 LEAD API HIT");


    try {


        const data = await request.json();


        console.log(
            "Incoming Lead Data:",
            JSON.stringify(data, null, 2)
        );



        const nameParts =
            data.name
            ? data.name.trim().split(" ")
            : [];



        const lead = {


            // ==========================
            // Provider Information
            // ==========================


            firstName:
                data.firstName ||
                nameParts[0] ||
                "",



            lastName:
                data.lastName ||
                nameParts.slice(1).join(" ") ||
                "",



            email:
                data.email || "",



            phone:
                data.phone || "",



            organization:
                data.organization ||
                data.practice_name ||
                data.practiceName ||
                "",



            specialty:
                data.specialty ||
                data.medical_specialty ||
                 "",



            npi:
                data.npi || "",





            // ==========================
            // RCM Information
            // ==========================


            claimsVolume:
                Number(
                    data.claimsVolume ||
                    data.monthly_claim_volume ||
                    data.monthlyClaims ||
                    data.monthlyClaimsVolume ||
                    0
                ),



            monthlyClaims:
                Number(
                    data.monthlyClaims ||
                    data.monthly_claim_volume ||
                    data.monthlyClaimsVolume ||
                    data.claimsVolume ||
                    0
                ),



            monthlyCollections:
                Number(
                    data.monthlyCollections ||
                    data.monthly_collections ||
                    0
                ),



            currentBillingMethod:
                data.currentBillingMethod ||
                data.billing_setup ||
                "unknown",



            billingSetup:
                data.billingSetup ||
                data.billing_setup ||
                "",



            billingChallenge:
                data.billingChallenge ||
                data.billing_challenge ||
                data.billingChallenges ||
                data.billing_challenges ||
                "",



            ehrSystem:
                data.ehrSystem ||
                data.ehr_system ||
                data.ehr ||
                "",



            practiceSize:
                data.practiceSize ||
                data.provider_count ||
                "",



            practiceLocation:
                data.practice_location ||
                "",



            providerCount:
                Number(
                    data.provider_count || 0
                ),



            interestedService:
                data.interested_service ||
                "",





            // ==========================
            // AI Conversation
            // ==========================


            conversationSummary:
                data.conversation_summary ||
                "",



            preferredContactMethod:
                data.preferred_contact_method ||
                "",



            preferredContactTime:
                data.preferred_contact_time ||
                "",



            contactConsent:
                data.contact_consent ||
                false,



            message:
                data.message ||
                data.conversation_summary ||
                "",





            // ==========================
            // CRM Management
            // ==========================


            source:
                "whatsapp_ai",



            status:
                "new_inquiry",



            priority:
                "standard",



            leadScore:
                Number(
                    data.leadScore || 0
                ),



            assignedTo:
                null,



            notes:
                "",



            activity:
                [],



            createdAt:
                new Date(),



            updatedAt:
                new Date()

        };





        if(
            !lead.email &&
            !lead.phone
        ){

            console.log(
                "❌ Missing email and phone"
            );


            return NextResponse.json(
                {
                    error:
                    "Email or phone required"
                },
                {
                    status:400
                }
            );

        }





        console.log(
            "Saving lead to Firestore:",
            lead
        );




        const doc =
            await db
            .collection("crm_leads")
            .add(lead);





        console.log(
            "✅ CRM Lead Created:",
            doc.id
        );





        return NextResponse.json({

            success:true,

            message:
            "WhatsApp lead created successfully",

            id:
            doc.id,

            lead

        });



    }

    catch(error:any){


        console.error(
            "❌ Lead API Error:",
            error
        );



        return NextResponse.json(

            {
                error:
                error.message ||
                "Failed to create lead"
            },

            {
                status:500
            }

        );


    }

}