import { Activity,CheckCircle2,Clock3,ContactRound,Percent } from "lucide-react";
import type { EmployeePerformance } from "@/types/crm-auth";
import PerformanceCard from "./PerformanceCard";

export default function EmployeeStats({ performance }:{ performance:EmployeePerformance }) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><PerformanceCard label="Assigned leads" value={performance.assignedLeads} icon={ContactRound}/><PerformanceCard label="Completed leads" value={performance.completedLeads} icon={CheckCircle2}/><PerformanceCard label="Pending leads" value={performance.pendingLeads} icon={Clock3}/><PerformanceCard label="Recent activities" value={performance.recentActivityCount} icon={Activity}/><PerformanceCard label="Conversion rate" value={performance.conversionRate} suffix="%" icon={Percent}/></div>;
}
