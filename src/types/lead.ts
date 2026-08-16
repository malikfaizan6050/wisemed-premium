export interface Lead {
  id?: string;

  firstName?: string;
  lastName?: string;

  phone: string;
  email?: string;

  organization?: string;
  specialty?: string;

  claimsVolume?: number;
  denialRate?: number;

  currentBillingMethod?:
    | "in_house"
    | "outsourced"
    | "hybrid"
    | "unknown";

  source:
    | "whatsapp_ai"
    | "website"
    | "manual";

  status:
    | "new_inquiry"
    | "qualified"
    | "proposal_sent"
    | "converted"
    | "lost";

  leadScore: number;

  createdAt?: Date;
}