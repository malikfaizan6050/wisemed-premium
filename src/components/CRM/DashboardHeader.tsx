import { LogOut } from "lucide-react";

export default function DashboardHeader({ onCreate,onLogout }:{ onCreate:()=>void; onLogout:()=>void }) {
    return <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">WiseMedBilling CRM</h1><p className="mt-2 text-slate-600">Healthcare Revenue Cycle Management Platform</p></div><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={onCreate} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">+ Create Lead</button><button type="button" onClick={onLogout} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"><LogOut size={18}/>Logout</button></div></div>;
}
