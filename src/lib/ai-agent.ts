import { Lead } from "@/types/crm";


export interface ConversationState {

    collected: Partial<Lead>;

    completed:boolean;

    nextQuestion:string;

}



const requiredFields = [

    "firstName",
    "lastName",
    "email",
    "organization",
    "specialty",
    "npi",
    "claimsVolume",
    "currentBillingMethod",
    "ehrSystem",
    "denialRate",
    "practiceSize"

];



export function processMessage(
    message:string,
    currentData:Partial<Lead>
):ConversationState{


    const updatedData = {
        ...currentData
    };


    const text = message.trim();



    // Simple extraction
    // Later replace with Gemini extraction


    if(!updatedData.firstName){

        updatedData.firstName=text;

    }

    else if(!updatedData.lastName){

        updatedData.lastName=text;

    }

    else if(!updatedData.email && text.includes("@")){

        updatedData.email=text;

    }

    else if(!updatedData.organization){

        updatedData.organization=text;

    }

    else if(!updatedData.specialty){

        updatedData.specialty=text;

    }

    else if(!updatedData.npi){

        updatedData.npi=text;

    }

    else if(!updatedData.claimsVolume){

        updatedData.claimsVolume=Number(text);

    }

    else if(!updatedData.currentBillingMethod){

        updatedData.currentBillingMethod="unknown";

    }

    else if(!updatedData.ehrSystem){

        updatedData.ehrSystem=text;

    }

    else if(!updatedData.denialRate){

        updatedData.denialRate=Number(text);

    }

    else if(!updatedData.practiceSize){

        updatedData.practiceSize=text;

    }



    const missing =
    requiredFields.filter(
        field =>
        !updatedData[field as keyof Lead]
    );



    if(missing.length===0){

        return {

            collected:updatedData,

            completed:true,

            nextQuestion:
            "Thank you for providing your information. Our RCM specialist will contact you shortly."

        };

    }



    const questions:any={

        firstName:
        "May I know your first name?",

        lastName:
        "What is your last name?",

        email:
        "What is your email address?",

        organization:
        "What is your practice or organization name?",

        specialty:
        "What medical specialty do you practice?",

        npi:
        "Please provide your NPI number.",

        claimsVolume:
        "Approximately how many claims do you process monthly?",

        currentBillingMethod:
        "Are you using in-house billing, outsourced billing, or hybrid?",

        ehrSystem:
        "Which EHR system do you use?",

        denialRate:
        "What is your current claim denial rate?",

        practiceSize:
        "How many providers are in your practice?"

    };



    return {

        collected:updatedData,

        completed:false,

        nextQuestion:
        questions[missing[0]]

    };


}