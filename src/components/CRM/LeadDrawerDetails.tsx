import { Activity,Building2,ClipboardCheck,FileText,Mail,MapPin,Phone,PhoneCall,Printer,TrendingUp,User } from "lucide-react";
import type { Lead } from "@/types/crm";

function SectionTitle({ children,icon:Icon }:{ children:React.ReactNode; icon:typeof User }) {
    return <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Icon size={18}/>{children}</h3>;
}

export function LeadScoreCard({ lead }:{ lead:Lead }) {
    // Clamped: a legacy record can carry a score outside 0-100, or a string
    // that parses to NaN, which renders as an invalid CSS width.
    const rawScore = Number(lead.opportunityScore ?? lead.leadScore ?? 0);
    const score = Number.isFinite(rawScore) ? Math.max(0,Math.min(100,rawScore)) : 0;
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
                    {lead.alternatePhone && <div className="flex items-center gap-3 text-sm text-slate-700"><Phone size={17}/>Alt phone: {lead.alternatePhone}</div>}
                    {lead.fax && <div className="flex items-center gap-3 text-sm text-slate-700"><Printer size={17}/>Fax: {lead.fax}{lead.faxConfirmed ? ` (${lead.faxConfirmed})` : ""}</div>}
                    {lead.website && <div className="flex items-center gap-3 text-sm text-slate-700"><Building2 size={17}/><a href={normalizeWebsite(lead.website)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lead.website}</a></div>}
                    {lead.practiceLocation && <div className="flex items-start gap-3 text-sm text-slate-700"><MapPin size={17} className="mt-0.5 shrink-0"/>{lead.practiceLocation}</div>}
                </div>
            </div>

            <CallDeskSection lead={lead}/>

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

/**
 * The outbound-call history a lead was imported with.
 *
 * Hidden entirely when a lead carries none of it, so an inbound website
 * enquiry does not grow a block of empty rows.
 */
function CallDeskSection({ lead }:{ lead:Lead }) {
    const entries:Array<[string,string | undefined]> = [
        ["Call Status",lead.callStatus],
        ["Date of Call",[lead.callDate,lead.callTime].filter(Boolean).join(" ")],
        ["Receptionist",lead.receptionistName],
        ["Office Manager",lead.officeManagerName],
        ["Authorization",lead.authorization],
        ["Will Doctor Join?",lead.willDoctorJoin],
        ["Call Remarks",lead.callRemarks],
        ["Sheet Reference",lead.sourceReference]
    ];
    const present = entries.filter((entry):entry is [string,string]=>Boolean(entry[1]?.trim()));
    if(present.length === 0) return null;

    return <div className="mt-8">
        <SectionTitle icon={PhoneCall}>Call History</SectionTitle>
        <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
            {present.map(([label,value])=><Detail key={label} label={label} value={value}/>)}
        </div>
    </div>;
}

// A sheet records a site as "example.com" as often as with a scheme, and a
// bare value would otherwise resolve against the CRM's own origin.
function normalizeWebsite(value:string) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function Detail({ label,value }:{ label:string; value:string }) {
    return <div><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div>;
}
