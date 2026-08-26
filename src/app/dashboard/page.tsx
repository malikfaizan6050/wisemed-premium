"use client";

import { useMemo,useState } from "react";
import { signOut } from "firebase/auth";
import { BriefcaseBusiness,Clock,Flame,Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { toLeadDate } from "@/lib/leadDates";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import type { Lead } from "@/types/crm";
import CreateLeadModal from "@/components/CRM/CreateLeadModal";
import DashboardFilters,{ type DashboardFilterValues } from "@/components/CRM/DashboardFilters";
import DashboardHeader from "@/components/CRM/DashboardHeader";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import LeadDrawer from "@/components/CRM/LeadDrawer";
import LeadTable from "@/components/CRM/LeadTable";
import PipelineOverview from "@/components/CRM/PipelineOverview";
import StatsCard from "@/components/CRM/StatsCard";

const initialFilters:DashboardFilterValues = {
    search:"",pipeline:"all",assignee:"all",source:"all",specialty:"all",
    priority:"all",score:"all",dateFrom:"",dateTo:""
};

export default function Dashboard() {
    const router = useRouter();
    const { leads,loading,checkingAuth,error } = useCrmLeads();
    const [filters,setFilters] = useState(initialFilters);
    const [selectedLead,setSelectedLead] = useState<Lead | null>(null);
    const [modalOpen,setModalOpen] = useState(false);
    const [editingLead,setEditingLead] = useState<Lead | null>(null);
    const [feedback,setFeedback] = useState("");

    const displayedLead = selectedLead
        ? leads.find((lead)=>lead.id === selectedLead.id) ?? null
        : null;

    const choices = useMemo(()=>({
        assignees:unique(leads.map((lead)=>lead.assignedTo).filter((value):value is string=>Boolean(value))),
        sources:unique(leads.map((lead)=>lead.source).filter((value):value is string=>Boolean(value))),
        specialties:unique(leads.map((lead)=>lead.specialty).filter(Boolean))
    }),[leads]);

    const filteredLeads = useMemo(()=>leads.filter((lead)=>matchesFilters(lead,filters)).sort((a,b)=>{
        const aTime = toLeadDate(a.createdAt)?.getTime() ?? 0;
        const bTime = toLeadDate(b.createdAt)?.getTime() ?? 0;
        return bTime-aTime || b.id.localeCompare(a.id);
    }),[leads,filters]);

    if(checkingAuth) return <div className="flex min-h-screen items-center justify-center bg-slate-50">Checking authentication...</div>;

    const closeModal = () => { setModalOpen(false);setEditingLead(null); };

    return <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
            <DashboardHeader
                onCreate={()=>{ setEditingLead(null);setModalOpen(true);setFeedback(""); }}
                onLogout={async()=>{ await signOut(auth);router.replace("/login"); }}
            />

            <div className="mt-6"><FeedbackMessage message={error || feedback} tone={error ? "error" : "success"}/></div>

            <div className="mt-10 grid gap-6 lg:grid-cols-4">
                <StatsCard title="Total Providers" value={leads.length} icon={Users} description="Healthcare inquiries"/>
                <StatsCard title="New Inquiries" value={leads.filter((lead)=>lead.status === "new_inquiry").length} icon={Clock} description="Needs qualification"/>
                <StatsCard title="Active Clients" value={leads.filter((lead)=>lead.status === "active_client").length} icon={BriefcaseBusiness} description="Managed accounts"/>
                <StatsCard title="Priority Opportunities" value={leads.filter((lead)=>lead.priority === "critical" || lead.priority === "high").length} icon={Flame} description="Needs attention"/>
            </div>

            <DashboardFilters values={filters} {...choices} onChange={(field,value)=>setFilters((current)=>({ ...current,[field]:value }))}/>
            <PipelineOverview leads={filteredLeads}/>
            {loading ? <p className="mt-6">Loading providers...</p> : <LeadTable leads={filteredLeads} onSelect={setSelectedLead}/>}
        </div>

        <LeadDrawer key={displayedLead?.id ?? "closed"} lead={displayedLead} onClose={()=>setSelectedLead(null)} onEdit={(lead)=>{ setEditingLead(lead);setModalOpen(true); }}/>
        {modalOpen && (
            <CreateLeadModal
                key={editingLead?.id ?? "create"}
                open
                lead={editingLead}
                onClose={closeModal}
                onSaved={()=>{
                    setFeedback(`Lead ${editingLead ? "updated" : "created"} successfully`);
                    closeModal();
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
        (filters.assignee === "all" || (filters.assignee === "unassigned" ? !lead.assignedTo : lead.assignedTo === filters.assignee)) &&
        (filters.source === "all" || lead.source === filters.source) &&
        (filters.specialty === "all" || lead.specialty === filters.specialty) &&
        (filters.priority === "all" || lead.priority === filters.priority) &&
        (filters.score === "all" || (filters.score === "critical" && score >= 85) || (filters.score === "high" && score >= 60 && score < 85) || (filters.score === "standard" && score < 60)) &&
        (!filters.dateFrom || Boolean(createdAt && createdAt >= new Date(`${filters.dateFrom}T00:00:00`))) &&
        (!filters.dateTo || Boolean(createdAt && createdAt <= new Date(`${filters.dateTo}T23:59:59`)));
}
