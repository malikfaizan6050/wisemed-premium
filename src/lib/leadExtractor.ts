import { GoogleGenAI } from "@google/genai";


const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});



export async function extractLead(message:string){


    const prompt = `

Extract lead information from this message.

Return ONLY JSON.

Fields:

name
email
phone
organization
specialty


If a field is missing return empty string.


Message:

${message}

`;



    const response =
    await genAI.models.generateContent({

        model:"gemini-3.6-flash",

        contents:prompt

    });



    const text =
    response.text ?? "";



    try{

        return JSON.parse(
            text.replace(/```json|```/g,"")
        );


    }
    catch{

        return null;

    }


}
