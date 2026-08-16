import { Lead } from "./types";


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


    const updatedData = {...currentData};



    const lower = message.toLowerCase();



    // Simple extraction layer
    // We will replace with OpenAI later


    if(!updatedData.firstName && message.length < 30){

        updatedData.firstName = message;

    }


    if(!updatedData.email && lower.includes("@")){

        updatedData.email = message;

    }



    if(!updatedData.organization &&
        lower.includes("clinic")
    ){

        updatedData.organization = message;

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
            "Thank you. Our specialist will contact you shortly."

        };

    }



    const nextField = missing[0];



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
        "Are you currently using in-house billing, outsourced billing, or hybrid?",


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
        questions[nextField]

    };

}