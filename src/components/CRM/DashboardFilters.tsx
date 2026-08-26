import { Search } from "lucide-react";

export interface DashboardFilterValues {
    search:string; pipeline:string; assignee:string; source:string; specialty:string;
    priority:string; score:string; dateFrom:string; dateTo:string;
}

interface Props {
    values:DashboardFilterValues;
    assignees:string[];
    sources:string[];
    specialties:string[];
    onChange:(field:keyof DashboardFilterValues,value:string)=>void;
}

export default function DashboardFilters({ values,assignees,sources,specialties,onChange }:Props) {
    return <div className="mt-12 flex flex-wrap gap-4">
        <div className="flex min-w-[260px] flex-1 items-center gap-3 rounded-xl border bg-white px-4"><Search size={20}/><input value={values.search} onChange={(event)=>onChange("search",event.target.value)} placeholder="Search providers, practices..." className="w-full py-3 outline-none"/></div>
        <Filter value={values.pipeline} onChange={(value)=>onChange("pipeline",value)} options={[["all","All Pipeline"],["new_inquiry","New Inquiry"],["discovery_scheduled","Discovery Scheduled"],["proposal_sent","Proposal Sent"],["active_client","Active Client"]]}/>
        <Filter value={values.assignee} onChange={(value)=>onChange("assignee",value)} options={[["all","All Assignees"],["unassigned","Unassigned"],...assignees.map((value):[string,string]=>[value,value])]}/>
        <Filter value={values.source} onChange={(value)=>onChange("source",value)} options={[["all","All Sources"],...sources.map((value):[string,string]=>[value,value.replaceAll("_"," ")])]}/>
        <Filter value={values.specialty} onChange={(value)=>onChange("specialty",value)} options={[["all","All Specialties"],...specialties.map((value):[string,string]=>[value,value])]}/>
        <Filter value={values.priority} onChange={(value)=>onChange("priority",value)} options={[["all","All Priorities"],["critical","Critical"],["high","High"],["standard","Standard"]]}/>
        <Filter value={values.score} onChange={(value)=>onChange("score",value)} options={[["all","All Scores"],["critical","85–100"],["high","60–84"],["standard","0–59"]]}/>
        <DateFilter label="From" value={values.dateFrom} onChange={(value)=>onChange("dateFrom",value)}/>
        <DateFilter label="To" value={values.dateTo} onChange={(value)=>onChange("dateTo",value)}/>
    </div>;
}

function Filter({ value,onChange,options }:{ value:string; onChange:(value:string)=>void; options:Array<[string,string]> }) {
    return <select value={value} onChange={(event)=>onChange(event.target.value)} className="rounded-xl border bg-white px-4 py-3">{options.map(([optionValue,label])=><option key={optionValue} value={optionValue}>{label}</option>)}</select>;
}

function DateFilter({ label,value,onChange }:{ label:string; value:string; onChange:(value:string)=>void }) {
    return <label className="flex items-center gap-2 rounded-xl border bg-white px-3 text-xs text-slate-500">{label}<input type="date" value={value} onChange={(event)=>onChange(event.target.value)} className="py-3 text-sm text-slate-700 outline-none"/></label>;
}
