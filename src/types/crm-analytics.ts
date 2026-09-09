import type { ActivityEvent } from "@/types/crm-auth";

export interface EmployeeAnalytics {
    uid:string;
    name:string;
    email:string;
    assignedLeads:number;
    completedLeads:number;
    recentActivityCount:number;
}

export interface AnalyticsActivity extends ActivityEvent {
    employeeName:string;
    leadName:string;
}

export interface PipelineMetric { status:string;count:number }

export interface DashboardAnalytics {
    totalLeads:number;
    unassignedLeads:number;
    assignedLeads:number;
    activeEmployees:number;
    conversionRate:number;
    scope:"all" | "team" | "own";
    leadsByEmployee:EmployeeAnalytics[];
    recentActivities:AnalyticsActivity[];
    pipelineSummary:PipelineMetric[];
}
