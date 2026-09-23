import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { db } from "@/lib/firebase-admin";
import { calculateLeadScore,getLeadPriority,type LeadScoreInput } from "@/lib/leadScoring";
import {
  normalizeEmail,
  normalizeNpi,
  normalizeOrganization,
  normalizePhone
} from "@/lib/leadDuplicateDetection";
import { DEFAULT_LEAD_STAGE,isLeadStage } from "@/lib/leadStages";



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




/**
 * Copies the two legacy collections into `crm_leads`.
 *
 * GET is a dry run reporting what would be written; POST performs the copy.
 * The whole thing used to run from GET, so a link, a prefetch or a crawler
 * could rewrite the lead collection.
 */
async function migrate(request:Request,apply:boolean) {
  const authResult = await requirePermission(request,"system.migrate");
  if(!authResult.ok){
    return authResult.response;
  }



  try {


    const migratedLeads: Array<
      LeadScoreInput & Record<string, unknown> & { originalId:string }
    > = [];




    // =========================
    // CONSULTATIONS MIGRATION
    // =========================


    const consultationsSnapshot =
      await db
        .collection("consultations")
        .get();



    consultationsSnapshot.forEach((doc) => {


      const data = doc.data();



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


      const data = doc.data();



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


    // Scoring and the normalised lookup keys are filled in here, because the
    // legacy records carry neither. Without them a migrated lead ranked below
    // every other lead in the pipeline and was invisible to duplicate
    // detection, which matches on those keys.
    const preparedLeads = migratedLeads.map((lead) => {

      const score = calculateLeadScore(lead);

      return {
        ...lead,
        status:isLeadStage(lead.status) ? lead.status : DEFAULT_LEAD_STAGE,
        leadScore:score,
        opportunityScore:score,
        priority:getLeadPriority(score),
        emailNormalized:normalizeEmail(String(lead.email ?? "")),
        phoneNormalized:normalizePhone(String(lead.phone ?? "")),
        npiNormalized:normalizeNpi(String(lead.npi ?? "")),
        organizationNormalized:normalizeOrganization(String(lead.organization ?? ""))
      };

    });


    if(!apply){

      return NextResponse.json({

        success:true,

        dryRun:true,

        wouldMigrate:
          preparedLeads.length

      });

    }


    // Firestore rejects a batch of more than 500 operations, so a migration of
    // any real size failed outright when this was a single batch.
    for(let index = 0;index < preparedLeads.length;index += 450){

      const batch = db.batch();

      preparedLeads.slice(index,index + 450).forEach((lead) => {

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

    }




    return NextResponse.json({

      success:true,

      migrated:
        preparedLeads.length

    });




  }


  catch {


    console.error("Migration failed");



    return NextResponse.json({

      success:false,

      error:"Migration failed"

    },

    {
      status:500
    });



  }


}


export async function GET(request:Request) { return migrate(request,false); }

export async function POST(request:Request) { return migrate(request,true); }
