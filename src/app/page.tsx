"use client";

import { useCallback,useEffect,useState } from "react";
import { onAuthStateChanged,signInWithEmailAndPassword,signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { Eye,EyeOff } from "lucide-react";
import Link from "next/link";

// The CRM login portal is the site root: crm.wisemedbilling.com/ renders this
// page directly, with no redirect to a subpath. The marketing landing page
// lives at /home and the proxy rewrites / to it for the marketing hosts.
export default function Login(){
    const router=useRouter();
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [showPassword,setShowPassword]=useState(false);
    const [loading,setLoading]=useState(false);
    const [error,setError]=useState("");
    const [checking,setChecking]=useState(true);

    const routeAuthenticatedUser=useCallback(async()=>{
        try {
            const response=await authenticatedFetch("/api/users/me");
            const result:unknown=await response.json().catch(()=>null);
            const code=result&&typeof result==="object"&&"code" in result?result.code:null;
            if(code==="password_change_required"){ router.replace("/change-password");return; }
            if(code==="temporary_password_expired"){
                await signOut(auth);
                setError("Temporary password expired. Ask an administrator to regenerate it.");
                setChecking(false);
                return;
            }
            if(response.ok){ router.replace("/dashboard");return; }
            await signOut(auth);
            const message=result && typeof result==="object" && "error" in result && typeof result.error==="string"
                ? result.error : "CRM server is unavailable. Try again or contact an administrator.";
            setError(message);
        } catch {
            setError("Could not check your CRM account. Check your connection and try again.");
        }
        setChecking(false);
    },[router]);

    useEffect(()=>onAuthStateChanged(auth,(user)=>{
        if(user) void routeAuthenticatedUser();
        else setChecking(false);
    }),[routeAuthenticatedUser]);

    const handleLogin=async(event:React.FormEvent)=>{
        event.preventDefault();setError("");setLoading(true);setChecking(true);
        try {
            await signInWithEmailAndPassword(auth,email,password);
            // The auth-state listener performs the CRM check once.
        }
        catch { setError("Invalid email or password");setChecking(false); }
        finally { setLoading(false); }
    };

    if(checking) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-lg text-slate-600">Checking authentication...</p></main>;
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-slate-900">WiseMedBilling CRM</h1>
            <p className="mt-2 text-slate-600">Healthcare provider management portal</p>
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">Email Address
                    <input required type="email" autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="admin@wisemedbilling.com" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"/>
                </label>
                <label className="block text-sm font-medium text-slate-700">Password
                    <span className="relative mt-2 block">
                        <input required type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"/>
                        <button type="button" onClick={()=>setShowPassword((visible)=>!visible)} aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-blue-600">
                            {showPassword?<EyeOff size={19}/>:<Eye size={19}/>} 
                        </button>
                    </span>
                </label>
                <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-blue-600 transition hover:text-blue-700">Forgot password?</Link></div>
                {error&&<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
                <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{loading?"Signing in...":"Login"}</button>
            </form>
        </div>
    </main>;
}
