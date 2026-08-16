import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";


export async function POST(request:Request){

    const data = await request.json();


    const lead = {
        ...data,
        createdAt:new Date()
    };


    const doc = await db
    .collection("leads")
    .add(lead);


    return NextResponse.json({
        success:true,
        id:doc.id
    });

}