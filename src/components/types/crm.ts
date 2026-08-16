export interface Lead {


    id:string;


    // ==========================
    // PROVIDER INFORMATION
    // ==========================

    firstName:string;

    lastName:string;

    email:string;

    phone:string;


    organization:string;


    specialty:string;


    npi?:string;



    // ==========================
    // RCM BUSINESS INFORMATION
    // ==========================


    claimsVolume?:number;

    currentBillingMethod?:
    | "in_house"
    | "outsourced"
    | "hybrid"
    | "unknown";


    ehrSystem?:string;



    denialRate?:number;



    practiceSize?:string;



    // ==========================
    // SALES / RCM PIPELINE
    // ==========================


    status:
    | "new_inquiry"
    | "initial_review"
    | "discovery_scheduled"
    | "requirements_collected"
    | "proposal_sent"
    | "contract_review"
    | "onboarding"
    | "active_client"
    | "lost";




    priority:
    | "critical"
    | "high"
    | "standard";





    // ==========================
    // SCORING
    // ==========================


    leadScore:number;


    opportunityScore?:number;



    // ==========================
    // NOTES
    // ==========================


   // ==========================
// NOTES & CRM ACTIVITIES
// ==========================


message:string;



challenges?:string[];



notes?:string;



nextAction?:string;



assignedTo?:string|null;



activity?:{

    id:string;

    action:string;

    createdAt:any;

}[];


    source?:
  | "website"
  | "whatsapp_ai"
  | "referral"
  | "campaign"
  | "manual";




    // ==========================
    // TIMESTAMPS
    // ==========================


    createdAt:any;


    updatedAt:any;

}