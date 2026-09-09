"use client";

import { useMemo,useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { toLeadDate } from "@/lib/leadDates";
import { useDashboardLeads } from "@/components/CRM/useDashboardLeads";
import type { Lead } from "@/types/crm";
import CreateLeadModal from "@/components/CRM/CreateLeadModal";
import DashboardFilters,{ type DashboardFilterValues } from "@/components/CRM/DashboardFilters";
import DashboardHeader from "@/components/CRM/DashboardHeader";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import LeadDrawer from "@/components/CRM/LeadDrawer";
import LeadTable from "@/components/CRM/LeadTable";
import PipelineOverview from "@/components/CRM/PipelineOverview";
import AnalyticsDashboard from "@/components/CRM/AnalyticsDashboard";
import AsyncError from "@/components/CRM/AsyncError";
import { useCRMUser } from "@/components/CRM/CRMUserContext";

const initialFilters:DashboardFilterValues = {
    search:"",pipeline:"all",assignee:"all",source:"all",specialty:"all",
    priority:"all",score:"all",dateFrom:"",dateTo:""
};

export default function Dashboard() {
    const router = useRouter();
    const { accessDeniedMessage,hasPermission } = useCRMUser();
    const { leads,loading,checkingAuth,error,refresh } = useDashboardLeads();
    const [filters,setFilters] = useState(initialFilters);
    const [selectedLead,setSelectedLead] = useState<Lead | null>(null);
    const [modalOpen,setModalOpen] = useState(false);
    const [editingLead,setEditingLead] = useState<Lead | null>(null);
    const [feedback,setFeedback] = useState("");

    const displayedLead = selectedLead
        ? leads.find((lead)=>lead.id === selectedLead.id) ?? null
        : null;

    const choices = useMemo(()=>({
        assignees:unique(leads.map((lead)=>lead.ownerSnapshot?.displayName).filter((value):value is string=>Boolean(value))),
        sources:unique(leads.map((lead)=>lead.source).filter((value):value is string=>Boolean(value))),
        specialties:unique(leads.map((lead)=>lead.specialty).filter(Boolean))
    }),[leads]);

    const filteredLeads = useMemo(()=>leads.filter((lead)=>matchesFilters(lead,filters)).sort((a,b)=>{
        const aTime = toLeadDate(a.createdAt)?.getTime() ?? 0;
        const bTime = toLeadDate(b.createdAt)?.getTime() ?? 0;
        return bTime-aTime || b.id.localeCompare(a.id);
    }),[leads,filters]);
    const mayCreateLead=hasPermission("leads.create");

    if(checkingAuth) return <div className="flex min-h-screen items-center justify-center bg-slate-50">Checking authentication...</div>;

    const closeModal = () => { setModalOpen(false);setEditingLead(null); };

    return <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
            <DashboardHeader
                canCreateLead={mayCreateLead}
                onCreate={()=>{ setEditingLead(null);setModalOpen(true);setFeedback(""); }}
                onLogout={async()=>{ await signOut(auth);router.replace("/login"); }}
            />

            <div className="mt-6">{accessDeniedMessage ? <FeedbackMessage message={accessDeniedMessage}/> : error ? <AsyncError message={error} onRetry={()=>void refresh()}/> : <FeedbackMessage message={feedback} tone="success"/>}</div>

            {hasPermission("analytics.read") && <AnalyticsDashboard/>}

            <DashboardFilters values={filters} {...choices} onChange={(field,value)=>setFilters((current)=>({ ...current,[field]:value }))}/>
            <PipelineOverview leads={filteredLeads}/>
            {loading ? <p className="mt-6">Loading providers...</p> : <LeadTable leads={filteredLeads} onSelect={setSelectedLead}/>}
        </div>

        <LeadDrawer key={displayedLead?.id ?? "closed"} lead={displayedLead} onClose={()=>setSelectedLead(null)} onUpdated={()=>void refresh()} onEdit={(lead)=>{ setEditingLead(lead);setModalOpen(true); }}/>
        {modalOpen && (editingLead || mayCreateLead) && (
            <CreateLeadModal
                key={editingLead?.id ?? "create"}
                open
                lead={editingLead}
                onClose={closeModal}
                onSaved={()=>{
                    setFeedback(`Lead ${editingLead ? "updated" : "created"} successfully`);
                    closeModal();
                    void refresh();
                }}
            />
        )}
    </main>;
}

function unique(values:string[]) {
    return Array.from(new Set(values)).sort();
}

function matchesFilters(lead:Lead,filters:DashboardFilterValues) {
    const searchable = `${lead.firstName} ${lead.lastName} ${lead.organization} ${lead.specialty} ${lead.email}`.toLowerCase();
    const score = lead.opportunityScore ?? lead.leadScore ?? 0;
    const createdAt = toLeadDate(lead.createdAt);
    return searchable.includes(filters.search.toLowerCase()) &&
        (filters.pipeline === "all" || lead.status === filters.pipeline) &&
        (filters.assignee === "all" || (filters.assignee === "unassigned" ? !lead.ownerId : lead.ownerSnapshot?.displayName === filters.assignee)) &&
        (filters.source === "all" || lead.source === filters.source) &&
        (filters.specialty === "all" || lead.specialty === filters.specialty) &&
        (filters.priority === "all" || lead.priority === filters.priority) &&
        (filters.score === "all" || (filters.score === "critical" && score >= 85) || (filters.score === "high" && score >= 60 && score < 85) || (filters.score === "standard" && score < 60)) &&
        (!filters.dateFrom || Boolean(createdAt && createdAt >= new Date(`${filters.dateFrom}T00:00:00`))) &&
        (!filters.dateTo || Boolean(createdAt && createdAt <= new Date(`${filters.dateTo}T23:59:59`)));
}
