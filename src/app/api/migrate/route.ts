import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";



function splitName(fullName: string) {

  if (!fullName) {
    return {
      firstName: "",
      lastName: ""
    };
  }


  const parts = fullName
    .trim()
    .split(" ");


  return {

    firstName: parts[0] || "",

    lastName:
      parts.slice(1).join(" ") || ""

  };

}




export async function GET() {


  try {


    const migratedLeads: any[] = [];




    // =========================
    // CONSULTATIONS MIGRATION
    // =========================


    const consultationsSnapshot =
      await db
        .collection("consultations")
        .get();



    consultationsSnapshot.forEach((doc) => {


      const data: any = doc.data();



      migratedLeads.push({


        firstName:
          data.firstName || "",


        lastName:
          data.lastName || "",


        email:
          data.email || "",


        phone:
          data.phone || "",


        organization:
          data.organization || "",


        specialty:
          data.specialty || "",


        npi:
          data.npi || "",



        claimsVolume:
          data.claimsVolume || 0,


        monthlyClaims:
          data.monthlyClaims || 0,



        currentBillingMethod:
          data.currentBillingMethod || "unknown",



        ehrSystem:
          data.ehrSystem || "",



        denialRate:
          data.denialRate || 0,



        estimatedRevenue:
          data.estimatedRevenue || 0,



        status:
          data.status || "new_inquiry",



        priority:
          data.priority || "standard",



        leadScore:
          data.leadScore || 0,



        opportunityScore:
          data.opportunityScore || 0,



        message:
          data.message || "",



        challenges:
          data.challenges || [],



        notes:
          data.notes || "",



        nextAction:
          data.nextAction ||
          "Review provider inquiry",



        assignedTo:
          data.assignedTo || null,



        source:
          "website",



        originalId:
          doc.id,



        createdAt:
          data.createdAt || new Date(),



        updatedAt:
          new Date()


      });



    });









    // =========================
    // WHATSAPP AI LEADS
    // =========================


    const leadsSnapshot =
      await db
        .collection("leads")
        .get();




    leadsSnapshot.forEach((doc) => {


      const data: any = doc.data();



      const nameParts =
        splitName(
          data.name ||
          data.full_name ||
          ""
        );




      migratedLeads.push({



        firstName:
          nameParts.firstName,



        lastName:
          nameParts.lastName,



        email:
          data.email || "",



        phone:
          data.phone || "",



        organization:
          data.organization ||
          data.practice_name ||
          "",



        specialty:
          data.specialty || "",



        npi:
          data.npi || "",



        claimsVolume:
          data.monthly_claim_volume || 0,



        monthlyClaims:
          data.monthly_claim_volume || 0,



        currentBillingMethod:
          data.billing_setup ||
          "unknown",



        ehrSystem:
          data.ehr_system || "",



        denialRate:
          0,



        estimatedRevenue:
          0,



        status:
          data.status === "New"
          ?
          "new_inquiry"
          :
          data.status ||
          "new_inquiry",



        priority:
          "standard",



        leadScore:
          data.leadScore || 0,



        opportunityScore:
          0,



        message:
          data.conversation_summary || "",



        challenges:
          [],



        notes:
          "",



        nextAction:
          "Review WhatsApp conversation",



        assignedTo:
          null,



        source:
          "whatsapp_ai",



        originalId:
          doc.id,



        createdAt:
          data.createdAt || new Date(),



        updatedAt:
          new Date()



      });



    });









    // =========================
    // SAVE INTO CRM_LEADS
    // SAFE MIGRATION
    // =========================



    const batch =
      db.batch();




    migratedLeads.forEach((lead) => {



      // IMPORTANT:
      // Using originalId prevents duplicates

      const ref =
        db
          .collection("crm_leads")
          .doc(
            lead.originalId
          );



      batch.set(
        ref,
        lead,
        {
          merge:true
        }
      );



    });




    await batch.commit();






    return NextResponse.json({

      success:true,

      migrated:
        migratedLeads.length

    });




  }


  catch(error:any) {


    console.error(
      "Migration error:",
      error
    );



    return NextResponse.json({

      success:false,

      error:
        error.message

    },

    {
      status:500
    });



  }


}