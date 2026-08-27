import type { ActivityEvent } from "@/types/crm-auth";
import { formatCRMDate } from "./managementUtils";

function activityLabel(action:string) {
    return action.split(".").map((part)=>part.replaceAll("_"," ")).map((part)=>part.charAt(0).toUpperCase()+part.slice(1)).join(" · ");
}

export default function ActivityTimeline({ activities,emptyMessage="No activity recorded." }:{ activities:ActivityEvent[];emptyMessage?:string }) {
    if(activities.length === 0) return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">{emptyMessage}</div>;
    return <ol className="rounded-2xl border bg-white p-6">
        {activities.map((activity,index)=><li key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < activities.length-1 && <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200"/>}
            <span className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-blue-100 bg-blue-600"/>
            <div><p className="font-semibold text-slate-900">{activityLabel(activity.action)}</p><p className="mt-1 text-sm text-slate-500">{activity.entityType} · {formatCRMDate(activity.createdAt)}</p></div>
        </li>)}
    </ol>;
}
