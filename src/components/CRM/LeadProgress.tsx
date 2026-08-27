export default function LeadProgress({ completed,total }:{ completed:number;total:number }) {
    const percent = total ? Math.round((completed/total)*100) : 0;
    return <div className="rounded-2xl border bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Lead completion</h2><span className="text-sm font-semibold text-blue-700">{percent}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width:`${percent}%` }}/></div><p className="mt-3 text-sm text-slate-500">{completed} of {total} assigned leads completed</p></div>;
}
