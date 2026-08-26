"use client";

import { useEffect,useState } from "react";
import { collection,onSnapshot,query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth,db } from "@/lib/firebase";
import type { Lead } from "@/types/crm";

function mapLead(id:string,item:Record<string,unknown>):Lead {
    const billingChallenges = Array.isArray(item.billingChallenges) ? item.billingChallenges.filter((value):value is string=>typeof value === "string") : [];
    return {
        id,
        firstName:String(item.firstName ?? ""), lastName:String(item.lastName ?? ""),
        email:String(item.email ?? ""), phone:String(item.phone ?? ""),
        organization:String(item.organization ?? ""), specialty:String(item.specialty ?? ""), npi:String(item.npi ?? ""),
        practiceLocation:String(item.practiceLocation ?? item.practice_location ?? ""),
        providerCount:Number(item.providerCount ?? item.provider_count ?? item.numberOfProviders ?? 0),
        claimsVolume:Number(item.claimsVolume ?? item.monthly_claim_volume ?? 0),
        monthlyClaims:Number(item.monthlyClaims ?? item.monthly_claim_volume ?? item.claimsVolume ?? 0),
        monthlyCollections:Number(item.monthlyCollections ?? item.monthly_collections ?? 0),
        estimatedRevenue:Number(item.estimatedRevenue ?? 0),
        currentBillingMethod:String(item.currentBillingMethod ?? item.billingSetup ?? item.billing_setup ?? "unknown"),
        billingSetup:String(item.billingSetup ?? item.billing_setup ?? item.currentBillingMethod ?? ""),
        billingChallenge:String(item.billingChallenge ?? item.billing_challenge ?? billingChallenges.join(", ") ?? ""),
        ehrSystem:String(item.ehrSystem ?? ""), denialRate:Number(item.denialRate ?? 0), practiceSize:String(item.practiceSize ?? ""),
        interestedService:String(item.interestedService ?? item.interested_service ?? ""),
        conversationSummary:String(item.conversationSummary ?? item.conversation_summary ?? ""),
        preferredContactMethod:String(item.preferredContactMethod ?? item.preferred_contact_method ?? ""),
        preferredContactTime:String(item.preferredContactTime ?? item.preferred_contact_time ?? ""),
        contactConsent:Boolean(item.contactConsent ?? item.contact_consent ?? false), message:String(item.message ?? ""),
        status:String(item.status ?? "new_inquiry"), priority:String(item.priority ?? "standard"),
        leadScore:Number(item.leadScore ?? 0), opportunityScore:Number(item.opportunityScore ?? item.leadScore ?? 0),
        assignedTo:typeof item.assignedTo === "string" ? item.assignedTo : null,
        assignedBy:typeof item.assignedBy === "string" ? item.assignedBy : null,
        assignedAt:item.assignedAt ?? null, notes:String(item.notes ?? ""),
        challenges:Array.isArray(item.challenges) ? item.challenges.filter((value):value is string=>typeof value === "string") : billingChallenges,
        nextAction:String(item.nextAction ?? "Review provider inquiry"), dueDate:item.dueDate ?? null,
        activity:Array.isArray(item.activity) ? item.activity as Lead["activity"] : [],
        source:String(item.source ?? "website"), createdAt:item.createdAt ?? null, updatedAt:item.updatedAt ?? null
    };
}

export function useCrmLeads() {
    const router = useRouter();
    const [leads,setLeads] = useState<Lead[]>([]);
    const [loading,setLoading] = useState(true);
    const [checkingAuth,setCheckingAuth] = useState(true);
    const [error,setError] = useState("");

    useEffect(()=>onAuthStateChanged(auth,(user)=>{
        if(!user){ router.replace("/login"); return; }
        setCheckingAuth(false);
    }),[router]);

    useEffect(()=>{
        if(checkingAuth) return;
        return onSnapshot(
            query(collection(db,"crm_leads")),
            (snapshot)=>{
                setLeads(snapshot.docs.map((document)=>mapLead(document.id,document.data())));
                setLoading(false);
                setError("");
            },
            ()=>{
                setLoading(false);
                setError("Unable to load providers. Please try again.");
            }
        );
    },[checkingAuth]);

    return { leads,loading,checkingAuth,error };
}
