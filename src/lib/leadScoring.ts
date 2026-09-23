export interface LeadScoreInput {
  email?: string;
  phone?: string;
  organization?: string;
  practiceName?: string;
  npi?: string;
  specialty?: string;
  monthlyClaims?: number | string;
  claimsVolume?: number | string;
  monthlyCollections?: number | string;
  estimatedRevenue?: number | string;
  numberOfProviders?: number | string;
  providers?: number | string;
  providerCount?: number | string;
  denialRate?: number | string;
  billingSetup?: string;
  currentBillingMethod?: string;
  interestedService?: string;
  billingChallenges?: string | string[];
  billingChallenge?: string;
  challenges?: string[];
  message?: string;
  conversationSummary?: string;
  preferredContactMethod?: string;
  contactConsent?: boolean;
}

function hasText(value:unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function numericValue(...values:Array<number | string | undefined>) {
  const value = values.find((item) => item !== undefined && item !== "");

  if(typeof value === "number"){
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  if(typeof value === "string"){
    const parsed = Number.parseFloat(value.replace(/[$,%+\s]/g,""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
}

export function calculateLeadScore(data: LeadScoreInput) {
  let score = 0;

  // Provider profile completeness: 15 points
  if(hasText(data.email)) score += 3;
  if(hasText(data.phone)) score += 4;
  if(hasText(data.organization) || hasText(data.practiceName)) score += 4;
  if(hasText(data.specialty)) score += 2;
  if(hasText(data.npi)) score += 2;

  // Practice scale and financial opportunity: 40 points
  const claims = numericValue(data.monthlyClaims,data.claimsVolume);
  if(claims >= 5000) score += 20;
  else if(claims >= 2000) score += 16;
  else if(claims >= 500) score += 10;
  else if(claims > 0) score += 5;

  const revenue = numericValue(
    data.monthlyCollections,
    data.estimatedRevenue
  );
  if(revenue >= 1000000) score += 12;
  else if(revenue >= 300000) score += 9;
  else if(revenue >= 100000) score += 6;
  else if(revenue >= 50000) score += 3;

  const providers = numericValue(
    data.providerCount,
    data.numberOfProviders,
    data.providers
  );
  if(providers >= 15) score += 8;
  else if(providers >= 5) score += 5;
  else if(providers > 0) score += 2;

  // RCM pain and service opportunity: 40 points
  const listedChallenges = [
    ...(Array.isArray(data.billingChallenges) ? data.billingChallenges : []),
    ...(Array.isArray(data.challenges) ? data.challenges : [])
  ].join(" ").trim();
  const challenge =
    listedChallenges ||
    data.billingChallenge?.trim() ||
    data.message?.trim() ||
    data.conversationSummary?.trim() ||
    "";

  if(challenge){
    score += 8;

    const challengeText = challenge.toLowerCase();
    const highIntentTerms = [
      "denial",
      "claim",
      "accounts receivable",
      "ar aging",
      "revenue",
      "billing",
      "payment",
      "coding",
      "prior authorization",
      "eligibility"
    ];

    if(highIntentTerms.some((term) => challengeText.includes(term))){
      score += 7;
    }

    if(challenge.length >= 100) score += 5;
  }

  const billingMethod = (
    data.billingSetup ||
    data.currentBillingMethod ||
    ""
  ).trim().toLowerCase();
  if(billingMethod === "outsourced") score += 8;
  else if(billingMethod === "hybrid") score += 6;
  else if(billingMethod === "in_house" || billingMethod === "in-house"){
    score += 5;
  }
  else if(billingMethod) score += 2;

  if(hasText(data.interestedService)) score += 7;

  const denialRate = numericValue(data.denialRate);
  if(denialRate >= 15) score += 5;
  else if(denialRate >= 10) score += 4;
  else if(denialRate >= 5) score += 2;
  else if(denialRate > 0) score += 1;

  // Contact readiness: 5 points
  if(hasText(data.preferredContactMethod)) score += 3;
  if(data.contactConsent === true) score += 2;

  return Math.max(0,Math.min(100,Math.round(score)));
}

export function getLeadPriority(score: number) {
  const normalizedScore = Number.isFinite(score)
    ? Math.max(0,Math.min(100,score))
    : 0;

  if(normalizedScore >= 85) return "critical";
  if(normalizedScore >= 60) return "high";
  return "standard";
}
