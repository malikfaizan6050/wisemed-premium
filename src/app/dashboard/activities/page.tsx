"use client";

import { useEffect,useState } from "react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import type { ActivityEvent } from "@/types/crm-auth";
import ActivityTimeline from "@/components/CRM/ActivityTimeline";
import AsyncError from "@/components/CRM/AsyncError";
import { getApiError } from "@/components/CRM/managementUtils";

export default function ActivitiesPage(){
    const [activities,setActivities]=useState<ActivityEvent[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [employee,setEmployee]=useState("");const [action,setAction]=useState("");const [from,setFrom]=useState("");const [to,setTo]=useState("");const [version,setVersion]=useState(0);
    useEffect(()=>{let active=true;const params=new URLSearchParams({limit:"100"});if(employee)params.set("employee",employee);if(action)params.set("action",action);if(from)params.set("from",from);if(to)params.set("to",to);void authenticatedFetch(`/api/activities?${params}`).then(async(response)=>{const result:unknown=await response.json().catch(()=>null);if(!response.ok)throw new Error(getApiError(result,"Unable to load activities"));if(active)setActivities(result&&typeof result==="object"&&"activities" in result&&Array.isArray(result.activities)?result.activities as ActivityEvent[]:[]);}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:"Unable to load activities");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[employee,action,from,to,version]);
    const retry=()=>{setLoading(true);setError("");setVersion((value)=>value+1);};
    return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-5xl"><h1 className="text-3xl font-bold text-slate-900">Activities</h1><p className="mt-1 text-slate-600">Review CRM employee and lead activity.</p><div className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4"><input value={employee} onChange={(event)=>setEmployee(event.target.value)} placeholder="Employee UID" className="rounded-xl border px-3 py-2"/><input value={action} onChange={(event)=>setAction(event.target.value)} placeholder="Action, e.g. lead.updated" className="rounded-xl border px-3 py-2"/><input aria-label="Activity from" type="date" value={from} onChange={(event)=>setFrom(event.target.value)} className="rounded-xl border px-3 py-2"/><input aria-label="Activity to" type="date" value={to} onChange={(event)=>setTo(event.target.value)} className="rounded-xl border px-3 py-2"/></div><div className="my-5"><AsyncError message={error} onRetry={retry}/></div>{loading?<p className="text-slate-600">Loading activities...</p>:<ActivityTimeline activities={activities} emptyMessage="No activities match these filters."/>}</div></main>;
}
