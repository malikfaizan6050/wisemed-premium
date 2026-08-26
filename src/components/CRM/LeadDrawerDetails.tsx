import { Activity,Building2,ClipboardCheck,FileText,Mail,Phone,TrendingUp,User } from "lucide-react";
import type { Lead } from "@/types/crm";

function SectionTitle({ children,icon:Icon }:{ children:React.ReactNode; icon:typeof User }) {
    return <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Icon size={18}/>{children}</h3>;
}

export function LeadScoreCard({ lead }:{ lead:Lead }) {
    const score = Number(lead.opportunityScore ?? lead.leadScore ?? 0);
    return (
        <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">RCM Opportunity Score</p>
                    <div className="mt-2 flex items-end gap-2"><span className="text-5xl font-bold text-blue-600">{score}</span><span className="mb-2 text-slate-500">/100</span></div>
                </div>
                <div className="rounded-2xl bg-blue-600 p-4 text-white"><TrendingUp size={28}/></div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600" style={{ width:`${score}%` }}/></div>
        </div>
    );
}

export default function LeadDrawerDetails({ lead }:{ lead:Lead }) {
    const claims = lead.monthlyClaims || lead.claimsVolume || 0;
    const revenue = lead.monthlyCollections || lead.estimatedRevenue || 0;
    const billing = lead.billingChallenge || lead.challenges?.join(", ") || "No billing challenges recorded";
    const conversation = lead.conversationSummary || lead.message || "No conversation summary available";

    return (
        <>
            <div className="mt-8">
                <SectionTitle icon={User}>Provider Information</SectionTitle>
                <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
                    <div className="flex items-center gap-3 text-sm text-slate-700"><Mail size={17}/>{lead.email || "No email"}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-700"><Phone size={17}/>{lead.phone || "No phone"}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-700"><Building2 size={17}/>{lead.organization || "Medical Practice"}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-700"><ClipboardCheck size={17}/>NPI: {lead.npi || "Not provided"}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-700"><ClipboardCheck size={17}/>Specialty: {lead.specialty || "Not provided"}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-700"><User size={17}/>Providers: {lead.providerCount ?? "Not provided"}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-700"><Building2 size={17}/>Practice Size: {lead.practiceSize || "Not provided"}</div>
                </div>
            </div>

            <div className="mt-8">
                <SectionTitle icon={Activity}>Practice Intelligence</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border bg-white p-5"><p className="text-xs text-slate-500">Monthly Claims</p><p className="mt-2 font-bold text-slate-900">{claims ? `${claims} claims` : "Not provided"}</p></div>
                    <div className="rounded-3xl border bg-white p-5"><p className="text-xs text-slate-500">Monthly Collections / Estimated Revenue</p><p className="mt-2 font-bold text-slate-900">{revenue ? `$${Number(revenue).toLocaleString()}` : "Not provided"}</p></div>
                </div>
            </div>

            <div className="mt-8">
                <SectionTitle icon={FileText}>Billing Information</SectionTitle>
                <div className="space-y-4 rounded-3xl bg-slate-50 p-5">
                    <Detail label="Current Billing Method" value={lead.billingSetup || lead.currentBillingMethod || "Unknown"}/>
                    <Detail label="Interested Service" value={lead.interestedService || "Not provided"}/>
                    <Detail label="Preferred Contact Method" value={lead.preferredContactMethod || "Not provided"}/>
                    <Detail label="EHR System" value={lead.ehrSystem || "Not provided"}/>
                    <Detail label="Billing Challenges" value={billing}/>
                </div>
            </div>

            <div className="mt-8"><SectionTitle icon={Mail}>AI Conversation Summary</SectionTitle><div className="rounded-3xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">{conversation}</div></div>
        </>
    );
}

function Detail({ label,value }:{ label:string; value:string }) {
    return <div><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div>;
}
