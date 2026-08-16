import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.collection("test").doc("connection").set({
      status: "Firebase connected",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Firebase Admin working",
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}