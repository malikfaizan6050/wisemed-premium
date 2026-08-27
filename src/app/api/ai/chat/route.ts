import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { extractLead } from "@/lib/leadExtractor";
import { enforceRateLimit } from "@/lib/rateLimit";


// ===============================
// Clients
// ===============================


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);


const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});



// ===============================
// Configuration
// ===============================


const CONFIDENCE_THRESHOLD = 0.75;

interface KnowledgeMatch {
  content:string;
  similarity:number;
}


const leadKeywords = [

  "interested",

  "pricing",

  "price",

  "cost",

  "demo",

  "contact",

  "start",

  "sign up",

  "hire",

  "need",

  "need billing",

  "medical billing services",

  "billing services",

  "switch",

  "looking for",

  "want",

  "help",

  "appointment"

];


// ===============================
// POST API
// ===============================


export async function POST(req: NextRequest) {

  const limited = enforceRateLimit(req,"ai.chat",20);
  if(limited) return limited;


  try {


    const body = await req.json();


    const question = body.message;



    if (typeof question !== "string" || !question.trim() || question.length > 4000) {

      return NextResponse.json(
        {
          error:"Message must contain between 1 and 4000 characters"
        },
        {
          status:400
        }
      );

    }


    const leadData =
await extractLead(question);


if(
leadData &&
leadData.email &&
leadData.name
){

    const leadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/leads`,
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json",
                "X-CRM-API-Key":process.env.WISEMED_CRM_API_KEY ?? ""
            },

            body:JSON.stringify(
                leadData
            )
        }
    );

    if(!leadResponse.ok){
      throw new Error("Lead creation failed");
    }


    return NextResponse.json({

        answer:
        "Thank you. Your information has been submitted. Our WiseMed Billing specialist will contact you shortly.",

        leadCreated:true

    });

}

    // ==================================
    // Lead Intent Detection
    // ==================================


    const lowerQuestion =
      question.toLowerCase();



    const leadDetected =
      leadKeywords.some(keyword =>
        lowerQuestion.includes(keyword)
      );



    if(leadDetected){


      return NextResponse.json({

        answer:
        `
I would be happy to help you get started with WiseMed Billing.

Please provide the following information:

1. Full Name
2. Email Address
3. Phone Number
4. Practice / Organization Name
5. Medical Specialty

Our team will contact you shortly.
        `,


        leadDetected:true,


        nextStep:"collect_lead_information"


      });


    }




    // ==================================
    // Create Query Embedding
    // ==================================


    const embeddingResponse =
      await genAI.models.embedContent({

        model:"gemini-embedding-001",

        contents:question,

        config:{
          outputDimensionality:768
        }

      });



    const queryEmbedding =
      embeddingResponse
      .embeddings?.[0]
      ?.values;



    if(!queryEmbedding){

      throw new Error(
        "Embedding generation failed"
      );

    }








    // ==================================
    // Vector Search
    // ==================================



    const {
      data,
      error

    } = await supabase.rpc(

      "match_wisemed_knowledge",

      {

        query_embedding:
        queryEmbedding,

        match_count:
        3

      }

    );



    if(error){

      throw error;

    }




    if(!data || data.length===0){


      return NextResponse.json({

        answer:
        "I don't have that information. Would you like me to connect you with a WiseMed Billing specialist?",

        confidence:0,

        leadDetected:false

      });


    }





    // ==================================
    // Confidence Check
    // ==================================


    const bestSimilarity =
      data[0].similarity;




    if(bestSimilarity < CONFIDENCE_THRESHOLD){


      return NextResponse.json({

        answer:
        "I don't have enough information about this topic. Would you like me to connect you with a WiseMed Billing specialist?",

        confidence:
        bestSimilarity,

        leadDetected:false

      });


    }





    // ==================================
    // Prepare Context
    // ==================================


    const context =
      (data as KnowledgeMatch[])
      .map(
        (item)=>
        item.content
      )
      .join("\n\n");







    // ==================================
    // Generate AI Answer
    // ==================================



    const prompt = `

You are WiseMed Billing AI assistant.

Answer the user's question ONLY using the knowledge below.

Knowledge:

${context}


User Question:

${question}


Rules:

- Do not invent information.
- If information is missing say:
"I don't have that information."
- Keep answers professional and concise.

`;





    const answerResponse =

      await genAI.models.generateContent({

        model:
        "gemini-3.6-flash",

        contents:prompt

      });





    const answer =
      answerResponse.text;



    return NextResponse.json({

      answer,

      confidence:
      bestSimilarity,

      leadDetected:false

    });




  }

  catch {


    console.error("AI request failed");



    return NextResponse.json(

      {

        error:"AI service failed"

      },

      {

        status:500

      }

    );


  }


}
