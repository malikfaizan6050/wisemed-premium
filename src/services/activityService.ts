import "server-only";

import { db } from "@/lib/firebase-admin";
import { createActivityRecord,listActivityRecords,type ActivityListOptions,type ActivityRecordInput } from "@/repositories/activityRepository";
import { getUserById } from "@/repositories/userRepository";
import { getRoleById } from "@/repositories/roleRepository";
import type { CurrentCRMUser } from "@/types/crm-auth";
import { hasPermission } from "@/lib/apiAuth";
import { createNotification } from "@/services/notificationService";

export class ActivityServiceError extends Error {
    constructor(message:string,public readonly status:number) { super(message); }
}

export async function recordActivity(input:ActivityRecordInput) {
    const id=await createActivityRecord(input);
    if(input.actorType === "user" && ["lead.notes_changed","role.updated","user.disabled"].includes(input.action)){
        await createNotification({ userId:input.actorId,type:"activity.created",title:"Important CRM activity",message:"An important CRM action was recorded.",entityType:input.entityType,entityId:input.entityId }).catch(()=>undefined);
    }
    return id;
}

export async function getActivities(options:ActivityListOptions,viewer:CurrentCRMUser) {
    if(hasPermission(viewer,"activities.read.all")) return listActivityRecords(options);
    if(hasPermission(viewer,"activities.read.own")){
        if(options.actorId && options.actorId !== viewer.uid) throw new ActivityServiceError("You can only view your own activity",403);
        return listActivityRecords({ ...options,actorId:viewer.uid });
    }
    throw new ActivityServiceError("Insufficient permissions",403);
}

export async function getEmployeePerformance(employeeId:string,viewer:CurrentCRMUser) {
    if(!hasPermission(viewer,"activities.read.all") && !(hasPermission(viewer,"activities.read.own") && viewer.uid === employeeId)){
        throw new ActivityServiceError("Insufficient permissions",403);
    }
    const employee = await getUserById(employeeId);
    if(!employee) throw new ActivityServiceError("Employee not found",404);
    const role = await getRoleById(employee.roleId);
    const [leadSnapshot,recentActivities] = await Promise.all([
        db.collection("crm_leads").where("ownerId","==",employeeId).limit(500).get(),
        listActivityRecords({ actorId:employeeId,limit:20 })
    ]);
    const assignedLeads = leadSnapshot.size;
    const completedLeads = leadSnapshot.docs.filter((document)=>["active_client","lost"].includes(String(document.data().status ?? ""))).length;
    const pendingLeads = assignedLeads-completedLeads;
    const touchedLeadIds = new Set(recentActivities.filter((activity)=>activity.entityType === "lead").map((activity)=>activity.entityId));
    leadSnapshot.docs.forEach((document)=>touchedLeadIds.add(document.id));
    return {
        totalLeads:touchedLeadIds.size,assignedLeads,completedLeads,pendingLeads,
        recentActivityCount:recentActivities.length,
        conversionRate:assignedLeads ? Math.round((completedLeads/assignedLeads)*1000)/10 : 0,
        recentActivities,
        employee:{ uid:employee.uid,email:employee.email,displayName:employee.displayName,jobTitle:employee.jobTitle,roleId:employee.roleId,status:employee.status },
        role
    };
}
