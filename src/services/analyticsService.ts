import "server-only";

import { hasPermission } from "@/lib/apiAuth";
import { getAnalyticsActivities,getAnalyticsEmployees,getAnalyticsLeads } from "@/repositories/analyticsRepository";
import type { CurrentCRMUser } from "@/types/crm-auth";
import type { DashboardAnalytics } from "@/types/crm-analytics";

export class AnalyticsServiceError extends Error {
    constructor(message:string,public readonly status:number) { super(message); }
}

const completedStatuses = new Set(["active_client","lost"]);

export async function getDashboardAnalytics(viewer:CurrentCRMUser):Promise<DashboardAnalytics> {
    const fullAccess = hasPermission(viewer,"activities.read.all") || hasPermission(viewer,"leads.read.all");
    const ownAccess = hasPermission(viewer,"activities.read.own") || hasPermission(viewer,"leads.read.owned");
    if(!fullAccess && !ownAccess) throw new AnalyticsServiceError("Insufficient permissions",403);

    const ownerId = fullAccess ? undefined : viewer.uid;
    const [leads,employees,activities] = await Promise.all([
        getAnalyticsLeads(ownerId),
        getAnalyticsEmployees(ownerId),
        getAnalyticsActivities(ownerId)
    ]);
    const employeeMap = new Map(employees.map((employee)=>[employee.uid,employee]));
    const leadMap = new Map(leads.map((lead)=>[lead.id,lead]));
    const activityCount = new Map<string,number>();
    activities.forEach((activity)=>activityCount.set(activity.actorId,(activityCount.get(activity.actorId) ?? 0)+1));

    const leadsByEmployee = employees.map((employee)=>{
        const owned = leads.filter((lead)=>lead.ownerId === employee.uid);
        return {
            uid:employee.uid,name:employee.displayName,email:employee.email,
            assignedLeads:owned.length,
            completedLeads:owned.filter((lead)=>completedStatuses.has(lead.status)).length,
            recentActivityCount:activityCount.get(employee.uid) ?? 0
        };
    }).sort((first,second)=>second.assignedLeads-first.assignedLeads || first.name.localeCompare(second.name));

    const pipelineCounts = new Map<string,number>();
    leads.forEach((lead)=>pipelineCounts.set(lead.status,(pipelineCounts.get(lead.status) ?? 0)+1));
    const assignedLeads = leads.filter((lead)=>Boolean(lead.ownerId)).length;
    const convertedLeads = leads.filter((lead)=>lead.status === "active_client").length;

    return {
        totalLeads:leads.length,
        unassignedLeads:leads.length-assignedLeads,
        assignedLeads,
        activeEmployees:employees.length,
        conversionRate:leads.length ? Math.round((convertedLeads/leads.length)*1000)/10 : 0,
        scope:fullAccess ? "all" : "own",
        leadsByEmployee,
        pipelineSummary:Array.from(pipelineCounts,([status,count])=>({ status,count })).sort((first,second)=>second.count-first.count),
        recentActivities:activities.slice(0,10).map((activity)=>{
            const lead = activity.entityType === "lead" ? leadMap.get(activity.entityId) : undefined;
            return {
                ...activity,
                metadata:{},
                employeeName:employeeMap.get(activity.actorId)?.displayName ?? (activity.actorType === "user" ? "CRM User" : activity.actorType),
                leadName:lead ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || lead.organization || "Lead" : "—"
            };
        })
    };
}
