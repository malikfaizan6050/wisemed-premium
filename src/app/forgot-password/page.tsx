"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { ArrowLeft,CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase";

const confirmationMessage="If an account is associated with that email address, a password reset link has been sent. Please check your inbox and spam folder.";

export default function ForgotPasswordPage(){
    const [email,setEmail]=useState("");
    const [loading,setLoading]=useState(false);
    const [submitted,setSubmitted]=useState(false);

    const submit=async(event:React.FormEvent)=>{
        event.preventDefault();
        setLoading(true);
        try { await sendPasswordResetEmail(auth,email); }
        catch { /* Keep the response identical so account existence is never disclosed. */ }
        finally { setLoading(false);setSubmitted(true); }
    };

    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-slate-900">Reset your password</h1>
            <p className="mt-2 text-slate-600">Enter your CRM account email and we&apos;ll send password reset instructions.</p>
            {submitted?<div className="mt-8">
                <div role="status" className="rounded-xl bg-green-50 px-4 py-4 text-sm leading-6 text-green-700">
                    <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={20}/><p>{confirmationMessage}</p></div>
                </div>
                <button type="button" onClick={()=>setSubmitted(false)} className="mt-5 w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Try another email</button>
            </div>:<form onSubmit={submit} className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">Email Address
                    <input required type="email" autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="admin@wisemedbilling.com" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"/>
                </label>
                <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{loading?"Sending...":"Send reset link"}</button>
            </form>}
            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"><ArrowLeft size={16}/>Back to login</Link>
        </div>
    </main>;
}
