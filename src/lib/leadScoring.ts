export function calculateLeadScore(data: any) {
  let score = 0;

  // ==========================
  // PROVIDER INFORMATION
  // ==========================

  // Email
  if (data.email) {
    score += 5;
  }

  // Phone
  if (data.phone) {
    score += 10;
  }

  // Organization / Practice
  if (data.organization || data.practiceName) {
    score += 10;
  }

  // NPI
  if (data.npi) {
    score += 10;
  }

  // Specialty
  if (data.specialty) {
    score += 5;
  }


  // ==========================
  // BUSINESS OPPORTUNITY
  // ==========================

  // Monthly Claims / Claims Volume
  const claims =
    data.monthlyClaims ||
    data.claimsVolume ||
    0;


  if (claims >= 5000) {
    score += 25;
  } 
  else if (claims >= 2000) {
    score += 20;
  } 
  else if (claims >= 500) {
    score += 10;
  }
  else if (claims > 0) {
    score += 5;
  }



  // Monthly Collections / Estimated Revenue
  const revenue =
    data.monthlyCollections ||
    data.estimatedRevenue ||
    0;


  if (revenue >= 1000000) {
    score += 20;
  }
  else if (revenue >= 300000) {
    score += 15;
  }
  else if (revenue >= 100000) {
    score += 10;
  }
  else if (revenue >= 50000) {
    score += 5;
  }



  // Number of Providers
  const providers =
    data.numberOfProviders ||
    data.providers ||
    0;


  if (providers >= 15) {
    score += 10;
  }
  else if (providers >= 5) {
    score += 5;
  }



  // ==========================
  // BILLING OPPORTUNITY
  // ==========================


  // Billing Setup
  if (data.billingSetup || data.currentBillingMethod) {
    score += 5;
  }


  // Interested Service
  if (data.interestedService) {
    score += 10;
  }



  // ==========================
  // BILLING PAIN POINTS
  // ==========================


  const challenge =
    data.billingChallenges ||
    data.message ||
    "";


  if (challenge) {

    const text = challenge.toLowerCase();


    if (
      text.includes("denial") ||
      text.includes("claim") ||
      text.includes("revenue") ||
      text.includes("billing") ||
      text.includes("payment")
    ) {
      score += 10;
    }


    if (text.length > 150) {
      score += 5;
    }

  }



  // ==========================
  // FINAL SCORE LIMIT
  // ==========================

  if (score > 100) {
    score = 100;
  }


  return score;
}





export function getLeadPriority(score: number) {

  if (score >= 85) {
    return "critical";
  }


  if (score >= 60) {
    return "high";
  }


  return "standard";

}