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


    // Secondary contact routes. A clinic call list carries these as often as
    // it carries the main line.

    alternatePhone?: string;

    fax?: string;

    website?: string;



    // ==========================
    // Outreach / Call Desk
    // ==========================
    //
    // Populated by the lead importer from a calling list. These describe the
    // progress of an outbound call campaign, which is separate from the sales
    // pipeline `status` below: a lead can be "Voicemail" here while still
    // sitting in New Inquiry.

    /** Free text exactly as the calling sheet recorded it. */
    callStatus?: string;

    /** Date and time of the call, kept as written. See the importer for why. */
    callDate?: string;

    callTime?: string;

    callRemarks?: string;

    receptionistName?: string;

    officeManagerName?: string;

    authorization?: string;

    faxConfirmed?: string;

    willDoctorJoin?: string;

    /** The row identifier from the source sheet, for reconciliation. */
    sourceReference?: string;



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

    dueDate?: unknown;



    // ==========================
    // Sales Assignment
    // ==========================

    assignedTo?: string | null;

    ownerId?: string | null;

    ownerSnapshot?: {
        displayName:string;
        email:string;
    } | null;



    assignedBy?: string | null;

    assignedById?: string | null;


    assignedAt?: unknown;



    // ==========================
    // Activity Tracking
    // ==========================

    activity?: {

        id:string;

        action:string;

        createdAt:unknown;

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

    createdAt:unknown;

    updatedAt:unknown;

}
