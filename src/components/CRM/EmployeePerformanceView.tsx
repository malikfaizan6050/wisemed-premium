"use client";

import { useEffect,useState } from "react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import type { EmployeePerformance } from "@/types/crm-auth";
import ActivityTimeline from "./ActivityTimeline";
import EmployeeStats from "./EmployeeStats";
import LeadProgress from "./LeadProgress";
import { getApiError } from "./managementUtils";
import AsyncError from "./AsyncError";

export default function EmployeePerformanceView({ employeeId }:{ employeeId:string }) {
    const [performance,setPerformance] = useState<EmployeePerformance | null>(null);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");
    const [requestVersion,setRequestVersion] = useState(0);
    useEffect(()=>{
        let active=true;
        void authenticatedFetch(`/api/users/${encodeURIComponent(employeeId)}/performance`).then(async(response)=>{ const result:unknown=await response.json().catch(()=>null);if(!response.ok) throw new Error(getApiError(result,"Unable to load performance"));if(active) setPerformance(result as EmployeePerformance); }).catch((reason:unknown)=>{ if(active) setError(reason instanceof Error ? reason.message : "Unable to load performance"); }).finally(()=>{ if(active) setLoading(false); });
        return ()=>{ active=false; };
    },[employeeId,requestVersion]);
    if(loading) return <p className="text-slate-600">Loading performance...</p>;
    if(error) return <AsyncError message={error} onRetry={()=>{setLoading(true);setError("");setRequestVersion((value)=>value+1);}}/>;
    if(!performance) return null;
    return <><section className="rounded-2xl border bg-white p-6"><h1 className="text-3xl font-bold text-slate-900">{performance.employee.displayName}</h1><p className="mt-1 text-slate-600">{performance.employee.email}</p><p className="mt-1 text-sm text-slate-500">{performance.role?.name ?? performance.employee.roleId} · <span className="capitalize">{performance.employee.status}</span></p></section><section className="mt-6"><EmployeeStats performance={performance}/></section><section className="mt-6"><LeadProgress completed={performance.completedLeads} total={performance.assignedLeads}/></section><section className="mt-8"><h2 className="mb-4 text-xl font-bold text-slate-900">Recent activity</h2><ActivityTimeline activities={performance.recentActivities}/></section></>;
}
