import { NextResponse } from "next/server";

import { db } from "@/lib/firebase";

import {
    collection,
    addDoc,
    serverTimestamp
} from "firebase/firestore";


export async function POST(
    request: Request
) {

    try {


        const data = await request.json();



        const lead = {


            // ==========================
            // Provider Information
            // ==========================

            firstName:
                data.firstName || "",


            lastName:
                data.lastName || "",


            email:
                data.email || "",


            phone:
                data.phone || "",



            organization:
                data.organization ||
                "",



            specialty:
                data.specialty ||
                "",



            npi:
                data.npi ||
                "",



            // ==========================
            // RCM Information
            // ==========================

            claimsVolume:
                Number(
                    data.claimsVolume || 0
                ),


            monthlyClaims:
                Number(
                    data.claimsVolume || 0
                ),



            currentBillingMethod:
                data.currentBillingMethod ||
                "unknown",



            ehrSystem:
                data.ehrSystem ||
                "",



            denialRate:
                Number(
                    data.denialRate || 0
                ),



            practiceSize:
                data.practiceSize ||
                "",



            message:
                data.message ||
                "",



            // ==========================
            // CRM Management
            // ==========================


            source:
                "website",



            status:
                "new_inquiry",



            priority:
                "standard",



            leadScore:
                data.leadScore || 0,



            assignedTo:
                null,



            notes:
                "",



            activity:
                [],



            createdAt:
                serverTimestamp(),



            updatedAt:
                serverTimestamp()


        };



        const docRef =
            await addDoc(

                collection(
                    db,
                    "consultations"
                ),

                lead

            );



        return NextResponse.json({

            success:true,

            id:
            docRef.id

        });



    }

    catch(error){


        console.error(
            "Consultation API Error:",
            error
        );



        return NextResponse.json(

            {
                success:false
            },

            {
                status:500
            }

        );


    }

}