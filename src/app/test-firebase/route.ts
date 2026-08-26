import { db } from "@/lib/firebase-admin";
import { requirePermission } from "@/lib/apiAuth";
import { NextResponse } from "next/server";

export async function GET(request:Request) {
  const authResult = await requirePermission(request,"system.diagnostics");
  if(!authResult.ok){
    return authResult.response;
  }

  try {
    await db.collection("test").doc("connection").set({
      status: "Firebase connected",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Firebase Admin working",
    });

  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase test failed",
      },
      {
        status: 500,
      }
    );
  }
}
