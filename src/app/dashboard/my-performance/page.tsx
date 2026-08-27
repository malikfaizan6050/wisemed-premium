"use client";

import { auth } from "@/lib/firebase";
import EmployeePerformanceView from "@/components/CRM/EmployeePerformanceView";
import AnalyticsDashboard from "@/components/CRM/AnalyticsDashboard";
import { useCRMUser } from "@/components/CRM/CRMUserContext";

export default function MyPerformancePage(){ const uid=auth.currentUser?.uid;const { hasPermission }=useCRMUser();return <main className="min-h-screen bg-slate-50 p-6 md:p-8"><div className="mx-auto max-w-7xl"><h1 className="mb-6 text-3xl font-bold text-slate-900">Performance</h1>{uid ? <EmployeePerformanceView employeeId={uid}/> : <p>Loading profile...</p>}{hasPermission("activities.read.all") && <div className="mt-10"><h2 className="text-2xl font-bold text-slate-900">Team comparison</h2><AnalyticsDashboard/></div>}</div></main>; }
