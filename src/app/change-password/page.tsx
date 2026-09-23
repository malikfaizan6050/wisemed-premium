"use client";

import { useEffect,useState } from "react";
import { onAuthStateChanged,signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

export default function ChangePasswordPage(){
    const router=useRouter();
    const [password,setPassword]=useState("");
    const [confirmation,setConfirmation]=useState("");
    const [error,setError]=useState("");
    const [loading,setLoading]=useState(true);
    const [saving,setSaving]=useState(false);

    useEffect(()=>onAuthStateChanged(auth,async(user)=>{
        if(!user){ router.replace("/login");return; }
        // The check used to run unguarded, so a dropped connection rejected the
        // promise, never cleared `loading`, and left the page on "Checking
        // account..." for good - with no message and no way to retry.
        try {
            const response=await authenticatedFetch("/api/users/me");
            const result:unknown=await response.json().catch(()=>null);
            const code=result&&typeof result==="object"&&"code" in result?result.code:null;
            if(response.ok){ router.replace("/dashboard");return; }
            if(code==="temporary_password_expired") setError("Temporary password expired. Ask an administrator to regenerate it.");
            else if(code!=="password_change_required") setError("Unable to verify your CRM account.");
        }
        catch { setError("Could not check your CRM account. Check your connection and try again."); }
        finally { setLoading(false); }
    }),[router]);

    const submit=async(event:React.FormEvent)=>{
        event.preventDefault();setError("");
        if(password!==confirmation){ setError("Passwords do not match.");return; }
        setSaving(true);
        try {
            const response=await authenticatedFetch("/api/users/me/password",{
                method:"PATCH",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ newPassword:password })
            });
            const result:unknown=await response.json().catch(()=>null);
            if(!response.ok){
                const message=result&&typeof result==="object"&&"error" in result&&typeof result.error==="string"?result.error:"Unable to change password";
                throw new Error(message);
            }
            await signOut(auth);
            router.replace("/login");
        }
        catch(error:unknown){ setError(error instanceof Error?error.message:"Unable to change password"); }
        finally { setSaving(false); }
    };

    if(loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-slate-600">Checking account...</p></main>;
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><h1 className="text-2xl font-bold text-slate-900">Create your personal password</h1><p className="mt-2 text-sm text-slate-600">Use at least 12 characters with uppercase, lowercase, a number, and a symbol.</p><form onSubmit={submit} className="mt-7 space-y-5"><label className="block text-sm font-medium text-slate-700">New password<input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(event)=>setPassword(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label><label className="block text-sm font-medium text-slate-700">Confirm password<input required minLength={12} type="password" autoComplete="new-password" value={confirmation} onChange={(event)=>setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>{error&&<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}<button disabled={saving||error.includes("expired")} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50">{saving?"Updating...":"Set personal password"}</button></form></div></main>;
}
