export interface Lead {

    id: string;


    // Provider Information

    firstName: string;

    lastName: string;

    email: string;

    phone: string;


    organization: string;

    specialty: string;


    npi?: string;



    // RCM Business Information

    claimsVolume?: number;

    monthlyClaims?: number;


    currentBillingMethod?:
    | "in_house"
    | "outsourced"
    | "hybrid"
    | "unknown";


    ehrSystem?: string;


    denialRate?: number;


    practiceSize?: string;


    estimatedRevenue?: number;



    // Pipeline

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



    // Scoring

    leadScore: number;

    opportunityScore?: number;



    // Notes

    message: string;

    challenges?: string[];

    notes?: string;


    nextAction?: string;


    assignedTo?: string | null;



    activity?: {

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



    createdAt:any;

    updatedAt:any;

}