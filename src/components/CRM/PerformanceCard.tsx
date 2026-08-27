import type { LucideIcon } from "lucide-react";

export default function PerformanceCard({ label,value,icon:Icon,suffix="" }:{ label:string;value:number;icon:LucideIcon;suffix?:string }) {
    return <div className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="rounded-xl bg-blue-50 p-2 text-blue-600"><Icon size={18}/></span></div><p className="mt-3 text-3xl font-bold text-slate-900">{value}{suffix}</p></div>;
}
