"use client";

import { useCallback,useEffect,useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { getApiError } from "./managementUtils";
import type { Lead } from "@/types/crm";

export function useDashboardLeads() {
    const router=useRouter();
    const [leads,setLeads]=useState<Lead[]>([]);
    const [loading,setLoading]=useState(true);
    const [checkingAuth,setCheckingAuth]=useState(true);
    const [error,setError]=useState("");

    const refresh=useCallback(async()=>{
        setLoading(true);
        try{
            const response=await authenticatedFetch("/api/leads?limit=500");
            const result:unknown=await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to load providers"));
            setLeads(result&&typeof result==="object"&&"leads" in result&&Array.isArray(result.leads)?result.leads as Lead[]:[]);
            setError("");
        }
        catch(reason:unknown){ setError(reason instanceof Error?reason.message:"Unable to load providers"); }
        finally{ setLoading(false); }
    },[]);

    useEffect(()=>onAuthStateChanged(auth,(user)=>{
        if(!user){ router.replace("/login");return; }
        setCheckingAuth(false);
        void refresh();
    }),[router,refresh]);

    return {leads,loading,checkingAuth,error,refresh};
}
