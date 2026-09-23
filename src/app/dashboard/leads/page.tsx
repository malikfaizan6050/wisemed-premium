"use client";

import { useMemo,useState } from "react";
import { Search } from "lucide-react";
import { useDashboardLeads } from "@/components/CRM/useDashboardLeads";
import AsyncError from "@/components/CRM/AsyncError";
import LeadDrawer from "@/components/CRM/LeadDrawer";
import LeadTable from "@/components/CRM/LeadTable";
import type { Lead } from "@/types/crm";
import CreateLeadModal from "@/components/CRM/CreateLeadModal";
import { LEAD_STAGE_KEYS,getLeadStageLabel } from "@/lib/leadStages";
import { LEAD_PRIORITY_OPTIONS } from "@/lib/leadPriorities";

// Taken from the shared stage list rather than restated here. The local copy
// this replaced also rendered each stage as a lowercased key ("new inquiry"),
// so the same dropdown read differently on this page than on My Leads.
const statuses=LEAD_STAGE_KEYS;

export default function LeadsPage(){
    const {leads,loading,error,refresh}=useDashboardLeads();
    const [selected,setSelected]=useState<Lead|null>(null);
    const [search,setSearch]=useState("");
    const [status,setStatus]=useState("all");
    const [priority,setPriority]=useState("all");
    const [editing,setEditing]=useState<Lead|null>(null);
    const filtered=useMemo(()=>leads.filter((lead)=>{
        const text=`${lead.firstName} ${lead.lastName} ${lead.organization} ${lead.email} ${lead.phone}`.toLowerCase();
        return text.includes(search.toLowerCase())&&(status==="all"||lead.status===status)&&(priority==="all"||lead.priority===priority);
    }),[leads,search,status,priority]);
    const displayed=selected?leads.find((lead)=>lead.id===selected.id)??null:null;

    return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl"><div><h1 className="text-3xl font-bold text-slate-900">Leads</h1><p className="mt-1 text-slate-600">Manage the provider pipeline available to your role.</p></div>
        <div className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3"><label className="flex items-center gap-2 rounded-xl border px-3"><Search size={17} className="text-slate-400"/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search provider, organization, email or phone" className="w-full py-3 outline-none"/></label><select value={status} onChange={(event)=>setStatus(event.target.value)} className="rounded-xl border px-3"><option value="all">All statuses</option>{statuses.map((value)=><option key={value} value={value}>{getLeadStageLabel(value)}</option>)}</select><select value={priority} onChange={(event)=>setPriority(event.target.value)} className="rounded-xl border px-3"><option value="all">All priorities</option>{LEAD_PRIORITY_OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
        <div className="my-5"><AsyncError message={error} onRetry={()=>void refresh()}/></div>{loading?<p className="text-slate-600">Loading leads...</p>:<LeadTable leads={filtered} onSelect={setSelected}/>}</div><LeadDrawer key={displayed?.id??"closed"} lead={displayed} onClose={()=>setSelected(null)} onUpdated={()=>void refresh()} onEdit={(lead)=>setEditing(lead)}/>{editing&&<CreateLeadModal open lead={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);void refresh();}}/>}</main>;
}
