"use client";

export default function DashboardError({ retry }:{ error:Error & { digest?:string }; retry:()=>void }) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8"><div role="alert" className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm"><h2 className="text-2xl font-bold text-slate-900">Unable to load the CRM dashboard</h2><p className="mt-3 text-slate-600">A temporary application error occurred. Your lead data was not changed.</p><button type="button" onClick={retry} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Try again</button></div></main>;
}
