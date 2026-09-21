import { createPublicLead } from "@/services/leadIntakeService";
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
            return NextResponse.json(
                { success:false,error:"First name, email, organization and specialty are required." },
                { status:400 }
            );
        }

        // Explicit opt-in is required before we store contact details and call them back.
        if(data.contactConsent !== true){
            return NextResponse.json(
                { success:false,error:"Please agree to be contacted before submitting." },
                { status:400 }
            );
        }

        const billingChallenges = Array.isArray(data.billingChallenges)
            ? data.billingChallenges.filter(
                (item):item is string => typeof item === "string"
            ).map((item) => item.trim()).filter(Boolean)
            : [];
        const claimsVolume = Math.max(0,Number(data.claimsVolume) || 0);

        const result = await createPublicLead({
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
            billingChallenges,
            contactConsent:true,
            source:"website"
        });

        if(!result.ok){
            // Answer the visitor as if it succeeded. They did nothing wrong, and
            // confirming which details already exist would leak the lead list.
            console.info("[consultation] duplicate enquiry suppressed",{
                duplicateId:result.duplicateId,
                matchingFields:result.matchingFields
            });
            return NextResponse.json({ success:true,duplicate:true });
        }

        return NextResponse.json({ success:true,id:result.id });
    }
    catch {
        console.error("Consultation submission failed");
        return NextResponse.json({ success:false },{ status:500 });
    }
}
