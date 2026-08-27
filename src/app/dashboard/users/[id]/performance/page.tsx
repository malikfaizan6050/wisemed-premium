"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import EmployeePerformanceView from "@/components/CRM/EmployeePerformanceView";

export default function EmployeePerformancePage(){ const { id }=useParams<{id:string}>();return <main className="min-h-screen bg-slate-50 p-6 md:p-8"><div className="mx-auto max-w-7xl"><Link href={`/dashboard/users/${id}`} className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"><ChevronLeft size={17}/>Employee overview</Link><EmployeePerformanceView employeeId={id}/></div></main>; }
