"use client";

import { useEffect,useState } from "react";
import { Mail,MessageCircle,Pencil,Phone,X } from "lucide-react";
import type { Lead } from "@/types/crm";
import { isLeadOverdue,toDateInputValue } from "@/lib/leadDates";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import LeadDrawerDetails,{ LeadScoreCard } from "./LeadDrawerDetails";
import LeadDrawerFollowUp,{ LeadNotes } from "./LeadDrawerFollowUp";
import FeedbackMessage from "./FeedbackMessage";
import UserSelect from "./UserSelect";
import { useCRMUser } from "./CRMUserContext";
import { getApiError } from "./managementUtils";
import type { AssignableCRMUser } from "@/types/crm-auth";

interface Props {
    lead:Lead | null;
    onClose:()=>void;
    onUpdated?:()=>void;
    onEdit?:(lead:Lead)=>void;
}

const pipelineOptions = [
    ["new_inquiry","New Inquiry"],
    ["initial_review","Initial Review"],
    ["discovery_scheduled","Discovery Scheduled"],
    ["requirements_collected","Requirements Collected"],
    ["proposal_sent","Proposal Sent"],
    ["contract_review","Contract Review"],
    ["onboarding","Onboarding"],
    ["active_client","Active Client"],
    ["lost","Lost Opportunity"]
] as const;

const priorityOptions = [
    ["critical","Critical"],
    ["high","High"],
    ["standard","Standard"]
] as const;

export default function LeadDrawer({ lead,onClose,onUpdated,onEdit }:Props) {
    const { hasPermission } = useCRMUser();
    const canAssign = hasPermission("leads.assign");
    const [notes,setNotes] = useState(lead?.notes ?? "");
    const [saving,setSaving] = useState(false);
    const [assigning,setAssigning] = useState(false);
    const [users,setUsers] = useState<AssignableCRMUser[]>([]);
    const [loadingUsers,setLoadingUsers] = useState(canAssign);
    const [selectedOwnerId,setSelectedOwnerId] = useState(lead?.ownerId ?? "");
    const [assignedOwner,setAssignedOwner] = useState(lead?.ownerSnapshot ?? null);
    const [nextAction,setNextAction] = useState(lead?.nextAction ?? "");
    const [dueDate,setDueDate] = useState(toDateInputValue(lead?.dueDate));
    const [feedback,setFeedback] = useState<{ message:string; tone:"error" | "success" }>({ message:"",tone:"error" });

    useEffect(()=>{
        if(!canAssign) return;
        let active = true;
        void authenticatedFetch("/api/users/assignable").then(async(response)=>{
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to load salespeople"));
            if(active) setUsers(result && typeof result === "object" && "users" in result && Array.isArray(result.users) ? result.users as AssignableCRMUser[] : []);
        }).catch((error:unknown)=>{
            if(active) setFeedback({ message:error instanceof Error ? error.message : "Unable to load salespeople",tone:"error" });
        }).finally(()=>{ if(active) setLoadingUsers(false); });
        return ()=>{ active = false; };
    },[canAssign]);

    if(!lead) return null;

    const updateFields = async(fields:Record<string,string>) => {
        setFeedback({ message:"",tone:"error" });
        setSaving(true);

        try {
            const response = await authenticatedFetch(`/api/leads/${lead.id}`,{
                method:"PATCH",
                headers:{ "Content-Type":"application/json" },
                body:JSON.stringify(fields)
            });

            if(!response.ok){
                const result:unknown = await response.json().catch(()=>null);
                const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
                    ? result.error
                    : "Failed to update lead";
                setFeedback({ message,tone:"error" });
                return;
            }

            setFeedback({ message:"Lead updated successfully",tone:"success" });
            onUpdated?.();
        }
        catch(error:unknown){
            setFeedback({ message:error instanceof Error ? error.message : "Failed to update lead",tone:"error" });
        }
        finally {
            setSaving(false);
        }
    };

    const fullName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Healthcare Provider";
    const whatsappPhone = lead.phone.replace(/\D/g,"");

    const assignOwner = async() => {
        if(!selectedOwnerId){ setFeedback({ message:"Select a salesperson first",tone:"error" });return; }
        setAssigning(true);
        setFeedback({ message:"",tone:"error" });
        try {
            const response = await authenticatedFetch(`/api/leads/${lead.id}/assign`,{
                method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ ownerId:selectedOwnerId })
            });
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to assign salesperson"));
            const selectedUser = users.find((user)=>user.uid === selectedOwnerId);
            if(selectedUser) setAssignedOwner({ displayName:selectedUser.displayName,email:selectedUser.email });
            const assignment=result&&typeof result==="object"&&"assignment" in result&&result.assignment&&typeof result.assignment==="object"
                ? result.assignment as Record<string,unknown>
                : null;
            const changed=assignment?.changed===true;
            const emailSent=assignment?.emailSent===true;
            setFeedback(changed
                ? emailSent
                    ? { message:"Salesperson assigned successfully. Notification and email sent.",tone:"success" }
                    : { message:"Salesperson assigned and notified, but the email could not be delivered.",tone:"error" }
                : { message:"This lead is already assigned to that salesperson.",tone:"success" });
            onUpdated?.();
        }
        catch(error:unknown){ setFeedback({ message:error instanceof Error ? error.message : "Unable to assign salesperson",tone:"error" }); }
        finally { setAssigning(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
            <aside role="dialog" aria-modal="true" aria-labelledby="lead-drawer-title" className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b pb-5">
                    <div><h2 id="lead-drawer-title" className="text-xl font-bold text-slate-900">{fullName}</h2><p className="text-sm text-slate-500">CRM Lead Profile</p></div>
                    <button type="button" onClick={onClose} aria-label="Close lead profile" className="rounded-full p-2 hover:bg-slate-100"><X size={20}/></button>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Phone size={16}/>Call</a>}
                    {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Mail size={16}/>Email</a>}
                    {whatsappPhone && <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"><MessageCircle size={16}/>WhatsApp</a>}
                    <button type="button" onClick={()=>onEdit?.(lead)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"><Pencil size={16}/>Edit Lead</button>
                </div>
                <div className="mt-4"><FeedbackMessage message={feedback.message} tone={feedback.tone}/></div>

                <SelectField label="RCM Pipeline" value={lead.status} options={pipelineOptions} onChange={(value)=>updateFields({ status:value })}/>
                <SelectField label="Opportunity Priority" value={lead.priority} options={priorityOptions} onChange={(value)=>updateFields({ priority:value })}/>

                <div className="mt-6 rounded-3xl border bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-900">Lead Ownership</h3>
                    <p className="mt-1 text-sm text-slate-600">{assignedOwner ? `${assignedOwner.displayName} · ${assignedOwner.email}` : "No salesperson assigned"}</p>
                    {canAssign && <div className="mt-4"><label className="text-xs font-semibold uppercase text-slate-500">Assign Salesperson</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><div className="flex-1"><UserSelect users={users} value={selectedOwnerId} onChange={setSelectedOwnerId} disabled={loadingUsers || assigning} placeholder={loadingUsers ? "Loading salespeople..." : users.length ? "Select salesperson" : "No eligible salespeople"}/></div><button type="button" onClick={assignOwner} disabled={loadingUsers || assigning || !selectedOwnerId} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{assigning ? "Assigning..." : "Assign"}</button></div></div>}
                </div>

                <LeadDrawerFollowUp
                    nextAction={nextAction} dueDate={dueDate}
                    overdue={isLeadOverdue(lead.dueDate,lead.status)} saving={saving}
                    onNextActionChange={setNextAction}
                    onDueDateChange={setDueDate}
                    onSaveFollowUp={()=>updateFields({ nextAction,dueDate })}
                />
                <LeadScoreCard lead={lead}/>
                <LeadDrawerDetails lead={lead}/>
                <LeadNotes notes={notes} saving={saving} onChange={setNotes} onSave={()=>updateFields({ notes })}/>

                <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    {lead.activity?.length ? lead.activity.map((item)=><div key={item.id}>{item.action}</div>) : "No activity recorded yet."}
                </div>
            </aside>
        </div>
    );
}

function SelectField({ label,value,options,onChange }:{ label:string; value:string; options:readonly (readonly [string,string])[]; onChange:(value:string)=>void }) {
    return <div className="mt-6"><label className="text-xs font-semibold uppercase text-slate-500">{label}</label><select value={value} onChange={(event)=>onChange(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3">{options.map(([optionValue,optionLabel])=><option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}
