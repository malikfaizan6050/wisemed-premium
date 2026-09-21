import type { LeadStageKey } from "@/lib/leadStages";

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

  // Sourced from the shared stage list. This previously declared its own five
  // stages, two of which (`qualified`, `converted`) existed on no screen, so a
  // lead written with one was invisible everywhere.
  status: LeadStageKey;

  leadScore: number;

  createdAt?: Date;
}