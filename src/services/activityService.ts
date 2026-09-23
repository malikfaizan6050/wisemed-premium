import "server-only";

import { db } from "@/lib/firebase-admin";
import { createActivityRecord,listActivityRecords,type ActivityListOptions,type ActivityRecordInput } from "@/repositories/activityRepository";
import { getUserById } from "@/repositories/userRepository";
import { actorDisplayName,resolveActorNames } from "@/services/actorNameService";
import { getRoleById } from "@/repositories/roleRepository";
import type { ActivityEvent,CurrentCRMUser } from "@/types/crm-auth";
import { LEADS_COLLECTION } from "@/lib/crmCollections";
import { hasPermission } from "@/lib/apiAuth";

export class ActivityServiceError extends Error {
    constructor(message:string,public readonly status:number) { super(message); }
}

/**
 * Writes one entry to the audit trail.
 *
 * Recording used to also send the *actor* a notification titled "Important CRM
 * activity" whenever they changed a lead's notes, edited a role or disabled a
 * user: the CRM told you about the thing you had just done yourself, with no
 * detail of what it was, so saving notes twice put two content-free unread
 * badges on your own bell. Notifications now go to the person who needs to
 * know — see the lead update route, which alerts the lead's owner — and the
 * audit trail stays the record of who did what.
 */
export async function recordActivity(input:ActivityRecordInput) {
    return createActivityRecord(input);
}

/**
 * Fills in who performed each action and which record it touched.
 *
 * The audit trail stores only `actorId` and `entityId`, so the timeline read
 * "Lead · Updated" with no name attached and no way to tell which lead. Both
 * are resolved here, once, so every caller gets an attributed trail.
 */
async function attachActorNames(activities:ActivityEvent[]):Promise<ActivityEvent[]> {
    const leadIds = Array.from(new Set(
        activities.filter((activity)=>activity.entityType === "lead" && activity.entityId).map((activity)=>activity.entityId)
    ));

    const leadNames = new Map<string,string>();

    const [actorNames] = await Promise.all([
        resolveActorNames(activities.map((activity)=>activity.actorId)),
        (async()=>{
            if(leadIds.length === 0) return;
            const references = leadIds.map((id)=>db.collection(LEADS_COLLECTION).doc(id));
            const snapshots = await db.getAll(...references).catch(()=>[]);
            snapshots.forEach((snapshot)=>{
                if(!snapshot.exists) return;
                const data = snapshot.data() ?? {};
                const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() ||
                    String(data.organization ?? "") ||
                    String(data.email ?? "");
                if(name) leadNames.set(snapshot.id,name);
            });
        })()
    ]);

    return activities.map((activity)=>({
        ...activity,
        actorName:actorDisplayName(activity.actorId,actorNames),
        entityLabel:activity.entityType === "lead" ? leadNames.get(activity.entityId) : undefined
    }));
}

export async function getActivities(options:ActivityListOptions,viewer:CurrentCRMUser) {
    if(hasPermission(viewer,"activities.read.all")) return attachActorNames(await listActivityRecords(options));
    if(hasPermission(viewer,"activities.read.own")){
        if(options.actorId && options.actorId !== viewer.uid) throw new ActivityServiceError("You can only view your own activity",403);
        return attachActorNames(await listActivityRecords({ ...options,actorId:viewer.uid }));
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
    const [leadSnapshot,recentActivityRecords] = await Promise.all([
        db.collection(LEADS_COLLECTION).where("ownerId","==",employeeId).limit(500).get(),
        listActivityRecords({ actorId:employeeId,limit:20 })
    ]);
    const recentActivities = await attachActorNames(recentActivityRecords);
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
