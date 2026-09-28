"use client";

import { useEffect,useMemo,useState } from "react";
import { Search,Users } from "lucide-react";
import type { Lead } from "@/types/crm";
import type { AssignableCRMUser } from "@/types/crm-auth";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { getLeadStageLabel } from "@/lib/leadStages";
import Modal from "./Modal";
import UserSelect from "./UserSelect";
import FeedbackMessage from "./FeedbackMessage";
import { getApiError } from "./managementUtils";

interface Props {
    open:boolean;
    leads:Lead[];
    onClose:()=>void;
    onAssigned:()=>void;
}

// Mirrors BULK_ASSIGN_LIMIT on the server. Selecting past it is blocked here so
// an administrator is told before submitting rather than after.
const SELECTION_LIMIT = 200;

function leadName(lead:Lead) {
    return `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || lead.organization || "Healthcare Provider";
}

export default function BulkAssignModal({ open,leads,onClose,onAssigned }:Props) {
    const [users,setUsers] = useState<AssignableCRMUser[]>([]);
    const [loadingUsers,setLoadingUsers] = useState(true);
    const [ownerId,setOwnerId] = useState("");
    const [search,setSearch] = useState("");
    const [unassignedOnly,setUnassignedOnly] = useState(false);
    const [selected,setSelected] = useState<string[]>([]);
    const [assigning,setAssigning] = useState(false);
    const [feedback,setFeedback] = useState<{ message:string; tone:"error" | "success" }>({ message:"",tone:"error" });

    // The page mounts this component only while the dialog is open, so the
    // salespeople are fetched once per opening and the state above starts in
    // its loading position rather than being pushed there from inside an effect.
    useEffect(()=>{
        let active = true;
        void authenticatedFetch("/api/users/assignable").then(async(response)=>{
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to load salespeople"));
            if(active) setUsers(result && typeof result === "object" && "users" in result && Array.isArray(result.users) ? result.users as AssignableCRMUser[] : []);
        }).catch((error:unknown)=>{
            if(active) setFeedback({ message:error instanceof Error ? error.message : "Unable to load salespeople",tone:"error" });
        }).finally(()=>{ if(active) setLoadingUsers(false); });
        return ()=>{ active = false; };
    },[]);

    const visible = useMemo(()=>{
        const query = search.trim().toLowerCase();
        return leads.filter((lead)=>{
            if(unassignedOnly && lead.ownerId) return false;
            if(!query) return true;
            return `${leadName(lead)} ${lead.organization ?? ""} ${lead.email ?? ""} ${lead.phone ?? ""} ${lead.ownerSnapshot?.displayName ?? ""}`
                .toLowerCase().includes(query);
        });
    },[leads,search,unassignedOnly]);

    // A lead filtered out of view stays selected, so narrowing the search to
    // find one more lead does not silently drop the rest of the selection.
    const selectedSet = useMemo(()=>new Set(selected),[selected]);
    const allVisibleSelected = visible.length > 0 && visible.every((lead)=>selectedSet.has(lead.id));

    const toggleLead = (id:string) => setSelected((current)=>
        current.includes(id) ? current.filter((value)=>value !== id) : [...current,id]
    );

    const toggleAllVisible = () => setSelected((current)=>{
        const visibleIds = visible.map((lead)=>lead.id);
        if(allVisibleSelected) return current.filter((id)=>!visibleIds.includes(id));
        return Array.from(new Set([...current,...visibleIds])).slice(0,SELECTION_LIMIT);
    });

    const assign = async() => {
        if(!ownerId){ setFeedback({ message:"Select a salesperson first",tone:"error" });return; }
        if(selected.length === 0){ setFeedback({ message:"Select at least one lead",tone:"error" });return; }
        if(selected.length > SELECTION_LIMIT){ setFeedback({ message:`Assign at most ${SELECTION_LIMIT} leads at a time`,tone:"error" });return; }

        setAssigning(true);
        setFeedback({ message:"",tone:"error" });
        try {
            const response = await authenticatedFetch("/api/leads/bulk-assign",{
                method:"POST",
                headers:{ "Content-Type":"application/json" },
                body:JSON.stringify({ ownerId,leadIds:selected })
            });
            const payload:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(payload,"Bulk assignment failed"));

            const result = payload && typeof payload === "object" && "result" in payload && payload.result && typeof payload.result === "object"
                ? payload.result as { assigned?:number; unchanged?:number; failures?:unknown[]; emailSent?:boolean; emailError?:string }
                : null;
            const assigned = typeof result?.assigned === "number" ? result.assigned : 0;
            const unchanged = typeof result?.unchanged === "number" ? result.unchanged : 0;
            const failed = Array.isArray(result?.failures) ? result.failures.length : 0;
            const parts = [`${assigned} lead${assigned === 1 ? "" : "s"} assigned`];
            if(unchanged) parts.push(`${unchanged} already with this salesperson`);
            if(failed) parts.push(`${failed} could not be assigned`);
            const emailFailed = Boolean(assigned) && !result?.emailSent;
            if(emailFailed) parts.push("the notification email could not be delivered");
            const emailError = typeof result?.emailError === "string" && result.emailError.trim() ? result.emailError : null;

            setFeedback({
                message:`${parts.join(", ")}.${emailFailed && emailError ? ` ${emailError}` : ""}`,
                tone:failed || emailFailed ? "error" : "success"
            });
            setSelected([]);
            onAssigned();
        }
        catch(error:unknown){
            setFeedback({ message:error instanceof Error ? error.message : "Bulk assignment failed",tone:"error" });
        }
        finally {
            setAssigning(false);
        }
    };

    return <Modal open={open} title="Bulk assign leads" onClose={onClose} maxWidth="xl">
        <div className="space-y-4">
            <p className="text-sm text-slate-600">Pick the leads to hand over, choose a salesperson, and assign them all at once. Each lead still gets its own notification; the salesperson receives one summary email.</p>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="flex items-center gap-2 rounded-xl border px-3">
                    <Search size={17} className="text-slate-400"/>
                    <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search provider, organization, email or owner" className="w-full py-3 text-sm outline-none"/>
                </label>
                <label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={unassignedOnly} onChange={(event)=>setUnassignedOnly(event.target.checked)} className="h-4 w-4"/>
                    Unassigned only
                </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <button type="button" onClick={toggleAllVisible} disabled={visible.length === 0} className="text-sm font-semibold text-blue-600 disabled:opacity-40">
                    {allVisibleSelected ? "Clear these leads" : `Select these ${visible.length} leads`}
                </button>
                <span className="text-sm text-slate-600">{selected.length} selected{selected.length > SELECTION_LIMIT ? ` (limit ${SELECTION_LIMIT})` : ""}</span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-2xl border">
                {visible.map((lead)=><label key={lead.id} className="flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-blue-50/40">
                    <input type="checkbox" checked={selectedSet.has(lead.id)} onChange={()=>toggleLead(lead.id)} className="h-4 w-4"/>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{leadName(lead)}</span>
                        <span className="block truncate text-xs text-slate-500">
                            {lead.organization || "Medical Practice"} · {getLeadStageLabel(lead.status ?? "new_inquiry")} · {lead.ownerSnapshot?.displayName ? `Owner: ${lead.ownerSnapshot.displayName}` : "Unassigned"}
                        </span>
                    </span>
                </label>)}
                {visible.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">No leads match this search.</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <UserSelect users={users} value={ownerId} onChange={setOwnerId} disabled={loadingUsers || assigning} placeholder={loadingUsers ? "Loading salespeople..." : "Select salesperson"}/>
                <button type="button" onClick={()=>void assign()} disabled={assigning || loadingUsers || !ownerId || selected.length === 0} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                    <Users size={18}/>{assigning ? "Assigning..." : `Assign ${selected.length} lead${selected.length === 1 ? "" : "s"}`}
                </button>
            </div>

            <FeedbackMessage message={feedback.message} tone={feedback.tone}/>
        </div>
    </Modal>;
}
