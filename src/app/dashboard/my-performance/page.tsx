"use client";

import { auth } from "@/lib/firebase";
import EmployeePerformanceView from "@/components/CRM/EmployeePerformanceView";
import AnalyticsDashboard from "@/components/CRM/AnalyticsDashboard";
import { useCRMUser } from "@/components/CRM/CRMUserContext";
import { isAdmin } from "@/lib/roleClassification";

export default function MyPerformancePage(){ const uid=auth.currentUser?.uid;const { hasPermission,roleId,loading }=useCRMUser();const admin=isAdmin(roleId);return <main className="min-h-screen bg-slate-50 p-6 md:p-8"><div className="mx-auto max-w-7xl"><h1 className="mb-6 text-3xl font-bold text-slate-900">{admin?"Company Performance":"Performance"}</h1>{loading?<p>Loading profile...</p>:admin?<AnalyticsDashboard/>:<>{uid ? <EmployeePerformanceView employeeId={uid}/> : <p>Loading profile...</p>}{hasPermission("analytics.read") && <div className="mt-10"><h2 className="text-2xl font-bold text-slate-900">Team comparison</h2><AnalyticsDashboard/></div>}</>}</div></main>; }
