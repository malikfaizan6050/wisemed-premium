"use client";

import { useState } from "react";
import { Mail,MessageCircle,Pencil,Phone,X } from "lucide-react";
import type { Lead } from "@/types/crm";
import { isLeadOverdue,toDateInputValue } from "@/lib/leadDates";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import LeadDrawerDetails,{ LeadScoreCard } from "./LeadDrawerDetails";
import LeadDrawerFollowUp,{ LeadNotes } from "./LeadDrawerFollowUp";
import FeedbackMessage from "./FeedbackMessage";

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
    const [notes,setNotes] = useState(lead?.notes ?? "");
    const [saving,setSaving] = useState(false);
    const [assignedTo,setAssignedTo] = useState(lead?.assignedTo ?? "");
    const [nextAction,setNextAction] = useState(lead?.nextAction ?? "");
    const [dueDate,setDueDate] = useState(toDateInputValue(lead?.dueDate));
    const [feedback,setFeedback] = useState<{ message:string; tone:"error" | "success" }>({ message:"",tone:"error" });

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

                <LeadDrawerFollowUp
                    assignedTo={assignedTo} nextAction={nextAction} dueDate={dueDate}
                    overdue={isLeadOverdue(lead.dueDate,lead.status)} saving={saving}
                    onAssignedToChange={setAssignedTo} onNextActionChange={setNextAction}
                    onDueDateChange={setDueDate}
                    onSaveFollowUp={()=>updateFields({ assignedTo,nextAction,dueDate })}
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
