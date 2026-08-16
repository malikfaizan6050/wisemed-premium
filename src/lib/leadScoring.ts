export function calculateLeadScore(data:any){

let score = 0;


// ==========================
// PROVIDER INFORMATION
// ==========================


// Email

if(data.email){

score += 5;

}


// Phone

if(data.phone){

score += 10;

}


// Organization / Practice

if(data.organization){

score += 15;

}


// NPI

if(data.npi){

score += 15;

}


// Specialty

if(data.specialty){

score += 10;

}




// ==========================
// BUSINESS OPPORTUNITY
// ==========================


// Claims Volume

if(data.claimsVolume){


if(data.claimsVolume >= 2000){

score += 15;

}

else if(data.claimsVolume >= 500){

score += 10;

}

else{

score += 5;

}


}




// Estimated Revenue

if(data.estimatedRevenue){


if(data.estimatedRevenue >= 100000){

score += 10;

}

else if(data.estimatedRevenue >=50000){

score += 5;

}


}






// ==========================
// BILLING PAIN POINTS
// ==========================



if(data.message){


const message =
data.message.toLowerCase();



if(
message.includes("denial") ||
message.includes("claim") ||
message.includes("revenue") ||
message.includes("billing") ||
message.includes("payment")
){

score += 10;


}



if(data.message.length > 150){

score += 5;

}



}







// Safety limit

if(score > 100){

score = 100;

}



return score;


}







export function getLeadPriority(score:number){



if(score >= 85){

return "critical";

}



if(score >=60){

return "high";

}



return "standard";


}