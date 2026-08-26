import { db } from "@/lib/firebase-admin";
import { calculateLeadScore, getLeadPriority } from "@/lib/leadScoring";
import { NextResponse } from "next/server";

interface RecaptchaResult {
    success?:boolean;
    score?:number;
    action?:string;
}

function text(value:unknown) {
    return typeof value === "string" ? value.trim() : "";
}

export async function POST(request:Request) {
    try {
        const body:unknown = await request.json();

        if(!body || typeof body !== "object" || Array.isArray(body)){
            return NextResponse.json({ success:false },{ status:400 });
        }

        const data = body as Record<string,unknown>;
        const captchaToken = text(data.captchaToken);
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

        if(!captchaToken || !recaptchaSecret){
            return NextResponse.json({ success:false },{ status:403 });
        }

        const verificationResponse = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method:"POST",
                headers:{ "Content-Type":"application/x-www-form-urlencoded" },
                body:new URLSearchParams({
                    secret:recaptchaSecret,
                    response:captchaToken
                }),
                cache:"no-store"
            }
        );
        const verification = await verificationResponse.json() as RecaptchaResult;

        if(
            !verification.success ||
            verification.action !== "consultation_form" ||
            (verification.score ?? 0) < 0.5
        ){
            return NextResponse.json({ success:false },{ status:403 });
        }

        const firstName = text(data.firstName);
        const email = text(data.email);
        const organization = text(data.organization);
        const specialty = text(data.specialty);

        if(!firstName || !email || !organization || !specialty){
            return NextResponse.json({ success:false },{ status:400 });
        }

        const billingChallenges = Array.isArray(data.billingChallenges)
            ? data.billingChallenges.filter(
                (item):item is string => typeof item === "string"
            ).map((item) => item.trim()).filter(Boolean)
            : [];
        const claimsVolume = Math.max(0,Number(data.claimsVolume) || 0);
        const scoringInput = {
            firstName,
            lastName:text(data.lastName),
            email,
            phone:text(data.phone),
            organization,
            npi:text(data.npi),
            specialty,
            claimsVolume,
            currentBillingMethod:text(data.currentBillingMethod),
            ehrSystem:text(data.ehrSystem),
            message:text(data.message),
            billingChallenges
        };
        const leadScore = calculateLeadScore(scoringInput);
        const now = new Date();
        const document = await db.collection("consultations").add({
            ...scoringInput,
            monthlyClaims:claimsVolume,
            estimatedRevenue:0,
            denialRate:0,
            status:"new_inquiry",
            priority:getLeadPriority(leadScore),
            leadScore,
            opportunityScore:leadScore,
            assignedTo:null,
            source:"website",
            createdAt:now,
            updatedAt:now
        });

        return NextResponse.json({ success:true,id:document.id });
    }
    catch {
        console.error("Consultation submission failed");
        return NextResponse.json({ success:false },{ status:500 });
    }
}
