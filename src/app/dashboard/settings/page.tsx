"use client";

import { Mail,ShieldCheck,UserRound } from "lucide-react";
import { auth } from "@/lib/firebase";
import { formatPermission } from "@/lib/permissionLabels";
import { useCRMUser } from "@/components/CRM/CRMUserContext";

export default function SettingsPage(){
    const {displayName,roleName,permissions,loading}=useCRMUser();const user=auth.currentUser;
    return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-4xl"><h1 className="text-3xl font-bold text-slate-900">Settings</h1><p className="mt-1 text-slate-600">Your CRM account and access configuration.</p>{loading?<p className="mt-8 text-slate-600">Loading account settings...</p>:<div className="mt-8 grid gap-6 md:grid-cols-2"><section className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserRound size={19}/>Profile</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Name</dt><dd className="font-semibold text-slate-900">{displayName||"Not provided"}</dd></div><div><dt className="flex items-center gap-1 text-slate-500"><Mail size={14}/>Email</dt><dd className="font-semibold text-slate-900">{user?.email||"Not provided"}</dd></div><div><dt className="text-slate-500">Role</dt><dd className="font-semibold text-slate-900">{roleName||"No active role"}</dd></div></dl></section><section className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck size={19}/>Permissions</h2>{permissions.length?<ul className="mt-5 grid gap-2">{permissions.map((permission)=><li key={permission} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{formatPermission(permission)}</li>)}</ul>:<p className="mt-5 text-sm text-slate-500">No CRM permissions assigned.</p>}</section></div>}<p className="mt-6 text-sm text-slate-500">Profile and role changes are managed by an authorized CRM administrator.</p></div></main>;
}
