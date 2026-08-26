export interface Lead {

    id: string;


    // ==========================
    // Provider Information
    // ==========================

    firstName: string;

    lastName: string;

    email: string;

    phone: string;


    organization: string;

    specialty: string;


    npi?: string;


    practiceLocation?: string;

    providerCount?: number;



    // ==========================
    // RCM Business Information
    // ==========================

    claimsVolume?: number;

    monthlyClaims?: number;


    monthlyCollections?: number;


    currentBillingMethod?:
    | "in_house"
    | "outsourced"
    | "hybrid"
    | "unknown"
    | string;


    billingSetup?: string;


    billingChallenge?: string;


    interestedService?: string;


    ehrSystem?: string;


    denialRate?: number;


    practiceSize?: string;


    estimatedRevenue?: number;



    // ==========================
    // AI Conversation Information
    // ==========================

    conversationSummary?: string;


    conversation_summary?: string;


    preferredContactMethod?: string;


    preferredContactTime?: string;


    contactConsent?: boolean;



    // ==========================
    // Pipeline Management
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
    | "lost"
    | string;



    priority:
    | "critical"
    | "high"
    | "standard"
    | string;



    // ==========================
    // Lead Scoring
    // ==========================

    leadScore: number;

    opportunityScore?: number;



    // ==========================
    // CRM Notes
    // ==========================

    message?: string;


    challenges?: string[];


    notes?: string;


    nextAction?: string;



    // ==========================
    // Sales Assignment
    // ==========================

    assignedTo?: string | null;



    assignedBy?: string | null;


    assignedAt?: any;



    // ==========================
    // Activity Tracking
    // ==========================

    activity?: {

        id:string;

        action:string;

        createdAt:any;

    }[];



    // ==========================
    // Lead Source
    // ==========================

    source?:
    | "website"
    | "whatsapp_ai"
    | "referral"
    | "campaign"
    | "manual"
    | string;



    // ==========================
    // System Dates
    // ==========================

    createdAt:any;

    updatedAt:any;

}