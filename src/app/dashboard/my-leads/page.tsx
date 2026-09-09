"use client";

import { useMemo,useState } from "react";
import { Download } from "lucide-react";
import { auth } from "@/lib/firebase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { toLeadDate } from "@/lib/leadDates";
import { useDashboardLeads } from "@/components/CRM/useDashboardLeads";
import { useCRMUser } from "@/components/CRM/CRMUserContext";
import CRMTable,{ type CRMTableColumn } from "@/components/CRM/CRMTable";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import UserSelect from "@/components/CRM/UserSelect";
import type { Lead } from "@/types/crm";
import type { AssignableCRMUser } from "@/types/crm-auth";
import AsyncError from "@/components/CRM/AsyncError";

const statuses = ["new_inquiry","initial_review","discovery_scheduled","requirements_collected","proposal_sent","contract_review","onboarding","active_client","lost"];
const priorities = ["critical","high","standard"];

export default function MyLeadsPage() {
    const { leads,loading,error,refresh } = useDashboardLeads();
    const { hasPermission,roleId } = useCRMUser();
    const canBulk = hasPermission("leads.update.all");
    const canAssign = hasPermission("leads.assign");
    const uid = auth.currentUser?.uid ?? "";
    const [selected,setSelected] = useState<string[]>([]);
    const [search,setSearch] = useState("");
    const [status,setStatus] = useState("all");
    const [priority,setPriority] = useState("all");
    const [specialty,setSpecialty] = useState("all");
    const [from,setFrom] = useState("");
    const [to,setTo] = useState("");
    const [users,setUsers] = useState<AssignableCRMUser[]>([]);
    const [loadingUsers,setLoadingUsers] = useState(false);
    const [ownerId,setOwnerId] = useState("");
    const [bulkStatus,setBulkStatus] = useState("");
    const [bulkPriority,setBulkPriority] = useState("");
    const [feedback,setFeedback] = useState("");
    const [working,setWorking] = useState(false);
    const [exportMode,setExportMode] = useState<"selected"|"filtered"|"all">("selected");

    const companyView=roleId==="admin"||(roleId!=="sales"&&hasPermission("leads.read.all"));
    const teamView=roleId==="sales_manager";
    const owned = useMemo(()=>companyView?leads:leads.filter((lead)=>lead.ownerId === uid),[companyView,leads,uid]);
    const specialties = useMemo(()=>Array.from(new Set(owned.map((lead)=>lead.specialty).filter(Boolean))).sort(),[owned]);
    const filtered = useMemo(()=>owned.filter((lead)=>{
        const text = `${lead.firstName} ${lead.lastName} ${lead.organization} ${lead.email} ${lead.phone}`.toLowerCase();
        const created = toLeadDate(lead.createdAt);
        return text.includes(search.toLowerCase()) && (status === "all" || lead.status === status) && (priority === "all" || lead.priority === priority) && (specialty === "all" || lead.specialty === specialty) && (!from || Boolean(created && created >= new Date(`${from}T00:00:00`))) && (!to || Boolean(created && created <= new Date(`${to}T23:59:59`)));
    }),[owned,search,status,priority,specialty,from,to]);

    const loadUsers = async() => {
        if(users.length||loadingUsers||!canAssign) return;
        setLoadingUsers(true);
        try {
            const response = await authenticatedFetch("/api/users/assignable");
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok){
                throw new Error(result&&typeof result==="object"&&"error" in result&&typeof result.error==="string"
                    ? result.error
                    : "Unable to load salespeople");
            }
            setUsers(result&&typeof result==="object"&&"users" in result&&Array.isArray(result.users)
                ? result.users as AssignableCRMUser[]
                : []);
        }
        catch(error:unknown){
            setFeedback(error instanceof Error?error.message:"Unable to load salespeople");
        }
        finally { setLoadingUsers(false); }
    };
    const bulkUpdate = async(kind:"status"|"priority"|"owner") => {
        const value = kind === "status" ? bulkStatus : kind === "priority" ? bulkPriority : ownerId;
        if(!selected.length || !value){ setFeedback("Select leads and an action value first.");return; }
        setWorking(true);setFeedback("");
        const responses = await Promise.all(selected.map((id)=>authenticatedFetch(kind === "owner" ? `/api/leads/${id}/assign` : `/api/leads/${id}`,{ method:kind === "owner" ? "POST" : "PATCH",headers:{ "Content-Type":"application/json" },body:JSON.stringify(kind === "owner" ? { ownerId:value } : { [kind]:value }) })));
        const failed = responses.filter((response)=>!response.ok).length;
        setFeedback(failed ? `${failed} lead updates failed.` : `${selected.length} leads updated successfully.`);setWorking(false);await refresh();
    };
    const exportCsv = () => {
        const rows = exportMode === "selected" ? owned.filter((lead)=>selected.includes(lead.id)) : exportMode === "filtered" ? filtered : owned;
        if(!rows.length){ setFeedback(exportMode === "selected" ? "Select at least one lead to export." : "No leads are available for this export.");return; }
        const escape = (value:unknown)=>{ const text=String(value ?? "");const safe=/^[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`; };
        const csv = [["Provider","Organization","Email","Phone","Status","Priority","Specialty"],...rows.map((lead)=>[`${lead.firstName} ${lead.lastName}`,lead.organization,lead.email,lead.phone,lead.status,lead.priority,lead.specialty])].map((row)=>row.map(escape).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv],{ type:"text/csv;charset=utf-8" }));const anchor = document.createElement("a");anchor.href=url;anchor.download=`${exportMode}-leads.csv`;anchor.click();URL.revokeObjectURL(url);
    };
    const columns:CRMTableColumn<Lead>[] = [
        { key:"select",header:"",render:(lead)=><input aria-label={`Select ${lead.firstName} ${lead.lastName}`} type="checkbox" checked={selected.includes(lead.id)} onChange={(event)=>setSelected((current)=>event.target.checked ? [...current,lead.id] : current.filter((id)=>id !== lead.id))}/> },
        { key:"provider",header:"Provider",render:(lead)=><div><p className="font-semibold text-slate-900">{`${lead.firstName} ${lead.lastName}`.trim() || "Healthcare Provider"}</p><p className="text-xs text-slate-500">{lead.organization}</p></div> },
        { key:"email",header:"Email / Phone",render:(lead)=><div>{lead.email}<p className="text-xs text-slate-500">{lead.phone}</p></div> },
        { key:"status",header:"Status",render:(lead)=>lead.status.replaceAll("_"," ") },
        { key:"priority",header:"Priority",render:(lead)=>lead.priority },
        { key:"specialty",header:"Specialty",render:(lead)=>lead.specialty || "—" }
    ];
    return <main className="min-h-screen bg-slate-50 p-6 md:p-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">{teamView?"Team Leads":companyView?"Company Leads":"My Leads"}</h1><p className="mt-1 text-slate-600">{teamView?"Provider opportunities assigned to your team.":companyView?"Company-wide provider opportunities.":"Your assigned provider opportunities."}</p></div><div className="flex overflow-hidden rounded-xl border bg-white"><select aria-label="Export scope" value={exportMode} onChange={(event)=>setExportMode(event.target.value as "selected"|"filtered"|"all")} className="border-r bg-white px-3 font-semibold text-slate-700 outline-none"><option value="selected">Selected Leads</option><option value="filtered">Filtered Leads</option>{roleId==="admin"&&<option value="all">All Leads</option>}</select><button type="button" onClick={exportCsv} className="flex items-center gap-2 px-4 py-3 font-semibold text-slate-700"><Download size={17}/>Export</button></div></div>
        <div className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4 xl:grid-cols-7"><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search leads" className="rounded-xl border px-3 py-2"/><select aria-label="Owner" disabled className="rounded-xl border bg-slate-50 px-3 py-2"><option>{teamView?"Owner: Team":companyView?"Owner: All":"Owner: Me"}</option></select><select value={status} onChange={(event)=>setStatus(event.target.value)} className="rounded-xl border px-3 py-2"><option value="all">All statuses</option>{statuses.map((value)=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select><select value={priority} onChange={(event)=>setPriority(event.target.value)} className="rounded-xl border px-3 py-2"><option value="all">All priorities</option>{priorities.map((value)=><option key={value}>{value}</option>)}</select><select value={specialty} onChange={(event)=>setSpecialty(event.target.value)} className="rounded-xl border px-3 py-2"><option value="all">All specialties</option>{specialties.map((value)=><option key={value}>{value}</option>)}</select><input type="date" aria-label="Created from" value={from} onChange={(event)=>setFrom(event.target.value)} className="rounded-xl border px-3 py-2"/><input type="date" aria-label="Created to" value={to} onChange={(event)=>setTo(event.target.value)} className="rounded-xl border px-3 py-2"/></div>
        {canBulk && <div className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3"><div className="flex gap-2"><select value={bulkStatus} onChange={(event)=>setBulkStatus(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3"><option value="">Change status</option>{statuses.map((value)=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select><button disabled={working} onClick={()=>bulkUpdate("status")} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Apply</button></div><div className="flex gap-2"><select value={bulkPriority} onChange={(event)=>setBulkPriority(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3"><option value="">Change priority</option>{priorities.map((value)=><option key={value}>{value}</option>)}</select><button disabled={working} onClick={()=>bulkUpdate("priority")} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Apply</button></div>{canAssign&&<div className="flex gap-2" onFocus={()=>void loadUsers()}><div className="min-w-0 flex-1"><UserSelect users={users} value={ownerId} onChange={setOwnerId} disabled={loadingUsers||working} placeholder={loadingUsers?"Loading salespeople...":users.length?"Select salesperson":"Load salespeople"}/></div><button disabled={working||loadingUsers||!ownerId} onClick={()=>bulkUpdate("owner")} className="rounded-xl bg-blue-600 px-4 py-2 text-white">{working?"Assigning...":"Assign"}</button></div>}</div>}
        <div className="my-5">{error?<AsyncError message={error} onRetry={()=>void refresh()}/>:<FeedbackMessage message={feedback} tone={feedback.includes("successfully") ? "success" : "error"}/>}</div>{loading ? <p>Loading leads...</p> : <CRMTable rows={filtered} columns={columns} getRowKey={(lead)=>lead.id} emptyMessage="No assigned leads match these filters."/>}</div></main>;
}
