import type { AssignableCRMUser } from "@/types/crm-auth";

interface Props {
    users:AssignableCRMUser[];
    value:string;
    onChange:(uid:string)=>void;
    disabled?:boolean;
    placeholder?:string;
}

export default function UserSelect({ users,value,onChange,disabled,placeholder="Select salesperson" }:Props) {
    return <select value={value} disabled={disabled} onChange={(event)=>onChange(event.target.value)} className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 disabled:opacity-50">
        <option value="">{placeholder}</option>
        {users.map((user)=><option key={user.uid} value={user.uid}>{user.displayName} — {user.email}</option>)}
    </select>;
}
