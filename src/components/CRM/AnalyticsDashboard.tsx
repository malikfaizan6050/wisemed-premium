"use client";

import { useEffect,useState } from "react";
import { BriefcaseBusiness,CheckCircle2,Percent,UsersRound } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import type { DashboardAnalytics,EmployeeAnalytics } from "@/types/crm-analytics";
import CRMTable,{ type CRMTableColumn } from "./CRMTable";
import StatsCard from "./StatsCard";
import { getApiError } from "./managementUtils";
import AsyncError from "./AsyncError";

export default function AnalyticsDashboard() {
    const [analytics,setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");
    const [requestVersion,setRequestVersion] = useState(0);

    useEffect(()=>{
        let active = true;
        void authenticatedFetch("/api/analytics/dashboard").then(async(response)=>{
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to load analytics"));
            if(active) setAnalytics(result as DashboardAnalytics);
        }).catch((reason:unknown)=>{ if(active) setError(reason instanceof Error ? reason.message : "Unable to load analytics"); })
            .finally(()=>{ if(active) setLoading(false); });
        return ()=>{ active = false; };
    },[requestVersion]);

    if(loading) return <p className="mt-8 text-sm text-slate-600">Loading CRM analytics...</p>;
    if(error) return <div className="mt-8"><AsyncError message={error} onRetry={()=>{setLoading(true);setError("");setRequestVersion((value)=>value+1);}}/></div>;
    if(!analytics) return null;

    const maximumAssigned = Math.max(...analytics.leadsByEmployee.map((employee)=>employee.assignedLeads),1);
    const maximumPipeline = Math.max(...analytics.pipelineSummary.map((item)=>item.count),1);
    const columns:CRMTableColumn<EmployeeAnalytics>[] = [
        { key:"name",header:"Name",render:(employee)=><div><p className="font-semibold text-slate-900">{employee.name}</p><p className="text-xs text-slate-500">{employee.email}</p></div> },
        { key:"assigned",header:"Assigned leads",render:(employee)=>employee.assignedLeads },
        { key:"completed",header:"Completed leads",render:(employee)=>employee.completedLeads },
        { key:"activity",header:"Recent activity count",render:(employee)=>employee.recentActivityCount }
    ];

    return <section className="mt-10" aria-label="CRM analytics">
        {analytics.scope === "own" && <p className="mb-4 text-sm font-medium text-blue-700">Showing your performance data.</p>}
        <div className="grid gap-6 lg:grid-cols-4">
            <StatsCard title="Total Leads" value={analytics.totalLeads} icon={UsersRound} description={`${analytics.unassignedLeads} unassigned`}/>
            <StatsCard title="Assigned Leads" value={analytics.assignedLeads} icon={BriefcaseBusiness} description="Current workload"/>
            <StatsCard title="Active Employees" value={analytics.activeEmployees} icon={CheckCircle2} description={analytics.scope === "own" ? "Your account" : "Available CRM users"}/>
            <StatsCard title="Conversion Rate" value={`${analytics.conversionRate}%`} icon={Percent} description="Leads reaching active client"/>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <BarPanel title="Leads by salesperson" items={analytics.leadsByEmployee.map((employee)=>({ label:employee.name,value:employee.assignedLeads }))} maximum={maximumAssigned}/>
            <BarPanel title="Pipeline distribution" items={analytics.pipelineSummary.map((item)=>({ label:formatStatus(item.status),value:item.count }))} maximum={maximumPipeline}/>
            <div className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold text-slate-900">Employee workload</h2><div className="mt-5 space-y-5">{analytics.leadsByEmployee.length ? analytics.leadsByEmployee.map((employee)=><div key={employee.uid}><div className="flex justify-between text-sm"><span className="font-medium text-slate-700">{employee.name}</span><span className="text-slate-500">{employee.completedLeads}/{employee.assignedLeads} completed</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-500" style={{ width:`${employee.assignedLeads ? (employee.completedLeads/employee.assignedLeads)*100 : 0}%` }}/></div></div>) : <p className="text-sm text-slate-500">No assigned employees.</p>}</div></div>
        </div>

        <div className="mt-8"><h2 className="mb-4 text-xl font-bold text-slate-900">Employee leaderboard</h2><CRMTable rows={analytics.leadsByEmployee} columns={columns} getRowKey={(employee)=>employee.uid} emptyMessage="No employee performance data."/></div>

        <div className="mt-8"><h2 className="mb-4 text-xl font-bold text-slate-900">Recent activity</h2><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Employee</th><th className="px-5 py-4">Action</th><th className="px-5 py-4">Lead</th><th className="px-5 py-4">Time</th></tr></thead><tbody className="divide-y">{analytics.recentActivities.map((activity)=><tr key={activity.id}><td className="px-5 py-4 font-medium text-slate-900">{activity.employeeName}</td><td className="px-5 py-4 text-slate-700">{formatStatus(activity.action)}</td><td className="px-5 py-4 text-slate-700">{activity.leadName}</td><td className="px-5 py-4 text-slate-500">{formatTime(activity.createdAt)}</td></tr>)}{analytics.recentActivities.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No recent activity.</td></tr>}</tbody></table></div></div>
    </section>;
}

function BarPanel({ title,items,maximum }:{ title:string;items:{ label:string;value:number }[];maximum:number }) {
    return <div className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold text-slate-900">{title}</h2><div className="mt-5 space-y-4">{items.length ? items.slice(0,8).map((item)=><div key={item.label}><div className="flex justify-between text-sm"><span className="truncate pr-3 text-slate-700">{item.label}</span><span className="font-semibold text-slate-900">{item.value}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width:`${(item.value/maximum)*100}%` }}/></div></div>) : <p className="text-sm text-slate-500">No data available.</p>}</div></div>;
}

function formatStatus(value:string) {
    return value.split(".").at(-1)?.replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase()) ?? value;
}

function formatTime(value:unknown) {
    if(typeof value === "string") return new Date(value).toLocaleString();
    if(value && typeof value === "object"){
        const record = value as Record<string,unknown>;
        const seconds = typeof record.seconds === "number" ? record.seconds : typeof record._seconds === "number" ? record._seconds : null;
        if(seconds !== null) return new Date(seconds*1000).toLocaleString();
    }
    return "—";
}
