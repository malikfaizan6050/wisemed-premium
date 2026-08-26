import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { extractLead } from "@/lib/leadExtractor";


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


  try {


    const body = await req.json();


    const question = body.message;



    if (!question) {

      return NextResponse.json(
        {
          error:"Message is required"
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

    await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/leads`,
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(
                leadData
            )
        }
    );


    return NextResponse.json({

        answer:
        "Thank you. Your information has been submitted. Our WiseMed Billing specialist will contact you shortly.",

        leadCreated:true

    });

}

    console.log(
      "User question:",
      question
    );



    // ==================================
    // Lead Intent Detection
    // ==================================


    const lowerQuestion =
      question.toLowerCase();



    const leadDetected =
      leadKeywords.some(keyword =>
        lowerQuestion.includes(keyword)
      );



    console.log(
      "Lead detected:",
      leadDetected
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




    console.log(
      "Embedding created:",
      queryEmbedding.length
    );






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



    console.log(
      "Documents found:",
      data?.length
    );



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



    console.log(
      "Similarity:",
      bestSimilarity
    );



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
      data
      .map(
        (item:any)=>
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

  catch(error:any){


    console.error(
      "AI ERROR:",
      error
    );



    return NextResponse.json(

      {

        error:
        error.message ||
        "AI service failed"

      },

      {

        status:500

      }

    );


  }


}