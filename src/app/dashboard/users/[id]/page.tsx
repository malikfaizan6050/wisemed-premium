"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2,ChevronLeft,ContactRound,UsersRound } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import type { EmployeePerformance } from "@/types/crm-auth";
import ActivityTimeline from "@/components/CRM/ActivityTimeline";
import PerformanceCard from "@/components/CRM/PerformanceCard";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import { getApiError } from "@/components/CRM/managementUtils";

export default function EmployeeDashboardPage() {
    const params = useParams<{ id:string }>();
    const [performance,setPerformance] = useState<EmployeePerformance | null>(null);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");

    useEffect(()=>{
        let active = true;
        void authenticatedFetch(`/api/users/${encodeURIComponent(params.id)}/performance`).then(async(response)=>{
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to load employee performance"));
            if(active) setPerformance(result as EmployeePerformance);
        }).catch((reason:unknown)=>{ if(active) setError(reason instanceof Error ? reason.message : "Unable to load employee performance"); })
            .finally(()=>{ if(active) setLoading(false); });
        return ()=>{ active = false; };
    },[params.id]);

    return <main className="min-h-screen bg-slate-50 p-6 md:p-8"><div className="mx-auto max-w-6xl">
        <Link href="/dashboard/users" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"><ChevronLeft size={17}/>Back to users</Link>
        <div className="mt-5"><FeedbackMessage message={error}/></div>
        {loading && <p className="mt-6 text-slate-600">Loading employee performance...</p>}
        {performance && <>
            <section className="mt-6 rounded-2xl border bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">{performance.employee.displayName}</h1><p className="mt-1 text-slate-600">{performance.employee.email}</p><p className="mt-1 text-sm text-slate-500">{performance.employee.jobTitle || "No job title"}{performance.role ? ` · ${performance.role.name}` : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${performance.employee.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"}`}>{performance.employee.status}</span></div></section>
            <section className="mt-6 grid gap-4 sm:grid-cols-3"><PerformanceCard label="Total leads" value={performance.totalLeads} icon={UsersRound}/><PerformanceCard label="Assigned leads" value={performance.assignedLeads} icon={ContactRound}/><PerformanceCard label="Completed leads" value={performance.completedLeads} icon={CheckCircle2}/></section>
            <section className="mt-8"><h2 className="mb-4 text-xl font-bold text-slate-900">Recent activity</h2><ActivityTimeline activities={performance.recentActivities}/></section>
        </>}
    </div></main>;
}
