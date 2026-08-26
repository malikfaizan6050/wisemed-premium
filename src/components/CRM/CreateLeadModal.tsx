"use client";

import { useState } from "react";
import { Save,X } from "lucide-react";
import type { Lead } from "@/types/crm";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import {
    createLeadFormValues,
    getResponseError,
    leadFormSchema,
    type LeadFormValues
} from "@/lib/leadValidation";
import FeedbackMessage from "./FeedbackMessage";
import LeadFormFields from "./LeadFormFields";

interface Props {
    open:boolean;
    onClose:()=>void;
    lead?:Lead | null;
    onSaved?:()=>void;
}

export default function CreateLeadModal({ open,onClose,lead,onSaved }:Props) {
    const [loading,setLoading] = useState(false);
    const [form,setForm] = useState(()=>createLeadFormValues(lead));
    const [errors,setErrors] = useState<Partial<Record<keyof LeadFormValues,string>>>({});
    const [feedback,setFeedback] = useState("");

    if(!open) return null;

    const update = (field:keyof LeadFormValues,value:string) => {
        setForm((current)=>({ ...current,[field]:value }));
        setErrors((current)=>({ ...current,[field]:undefined }));
        setFeedback("");
    };

    const saveLead = async() => {
        const validation = leadFormSchema.validate(form);
        setErrors(validation.errors);
        setFeedback("");

        if(!validation.success) return;

        try {
            setLoading(true);
            const response = await authenticatedFetch(
                lead ? `/api/leads/${lead.id}` : "/api/leads",
                {
                    method:lead ? "PATCH" : "POST",
                    headers:{ "Content-Type":"application/json" },
                    body:JSON.stringify(
                        lead
                            ? validation.data
                            : { ...validation.data,source:"manual",status:"new_inquiry" }
                    )
                }
            );

            if(!response.ok){
                const result:unknown = await response.json().catch(()=>null);
                setFeedback(getResponseError(
                    result,
                    `Failed ${lead ? "updating" : "creating"} lead`
                ));
                return;
            }

            if(!lead) setForm(createLeadFormValues());
            onSaved?.();
            onClose();
        }
        catch(error:unknown){
            setFeedback(
                error instanceof Error
                    ? error.message
                    : `Failed ${lead ? "updating" : "creating"} lead`
            );
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="lead-modal-title" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 id="lead-modal-title" className="text-2xl font-bold">{lead ? "Edit Lead" : "Create New Lead"}</h2>
                    <button type="button" onClick={onClose} aria-label="Close lead form"><X/></button>
                </div>

                <div className="mb-4"><FeedbackMessage message={feedback}/></div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <LeadFormFields values={form} errors={errors} onChange={update}/>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={saveLead}
                        className="md:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={18}/>
                        {loading ? "Saving..." : lead ? "Save Changes" : "Create Lead"}
                    </button>
                </div>
            </div>
        </div>
    );
}
