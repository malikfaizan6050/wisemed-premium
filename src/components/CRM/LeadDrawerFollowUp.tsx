import { AlertTriangle,CalendarDays,FileText,Save } from "lucide-react";

interface Props {
    assignedTo:string;
    nextAction:string;
    dueDate:string;
    overdue:boolean;
    saving:boolean;
    onAssignedToChange:(value:string)=>void;
    onNextActionChange:(value:string)=>void;
    onDueDateChange:(value:string)=>void;
    onSaveFollowUp:()=>void;
}

export default function LeadDrawerFollowUp(props:Props) {
    return (
        <>
            <div className="mt-6 rounded-3xl border bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-900">Sales Follow-up</h3>
                    {props.overdue && <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"><AlertTriangle size={13}/>Overdue</span>}
                </div>
                <div className="mt-4 grid gap-4">
                    <Field label="Lead Owner" value={props.assignedTo} placeholder="Unassigned" onChange={props.onAssignedToChange}/>
                    <Field label="Next Action" value={props.nextAction} placeholder="Schedule discovery call" onChange={props.onNextActionChange}/>
                    <label className="text-xs font-semibold uppercase text-slate-500">Due Date<div className="mt-2 flex items-center gap-2 rounded-xl border bg-white px-4"><CalendarDays size={17} className="text-slate-500"/><input type="date" value={props.dueDate} onChange={(event)=>props.onDueDateChange(event.target.value)} className="w-full py-3 text-sm font-normal normal-case text-slate-800 outline-none"/></div></label>
                </div>
                <button type="button" onClick={props.onSaveFollowUp} disabled={props.saving} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Save Follow-up</button>
            </div>

        </>
    );
}

export function LeadNotes({ notes,saving,onChange,onSave }:{ notes:string; saving:boolean; onChange:(value:string)=>void; onSave:()=>void }) {
    return <div className="mt-8"><div className="mb-4 flex items-center gap-2 font-bold text-slate-900"><FileText size={18}/>CRM Notes</div><textarea value={notes} onChange={(event)=>onChange(event.target.value)} placeholder="Add sales notes..." className="min-h-[120px] w-full rounded-3xl border p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"/><button type="button" onClick={onSave} disabled={saving} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"><Save size={17}/>{saving ? "Saving..." : "Save Notes"}</button></div>;
}

function Field({ label,value,placeholder,onChange }:{ label:string; value:string; placeholder:string; onChange:(value:string)=>void }) {
    return <label className="text-xs font-semibold uppercase text-slate-500">{label}<input value={value} onChange={(event)=>onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm font-normal normal-case text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"/></label>;
}
