"use client";

import { useCallback,useEffect,useMemo,useState } from "react";
import { Pencil,UserMinus,UserPlus } from "lucide-react";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import type { CRMUser,Role } from "@/types/crm-auth";
import CRMTable,{ type CRMTableColumn } from "@/components/CRM/CRMTable";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import Modal from "@/components/CRM/Modal";
import PermissionGuard from "@/components/CRM/PermissionGuard";
import { formatCRMDate,getApiError } from "@/components/CRM/managementUtils";

interface UserForm {
    email:string;
    displayName:string;
    phone:string;
    jobTitle:string;
    roleId:string;
}

const emptyForm:UserForm = { email:"",displayName:"",phone:"",jobTitle:"",roleId:"" };

export default function UsersPage() {
    return <PermissionGuard permission="users.manage"><UsersContent/></PermissionGuard>;
}

function UsersContent() {
    const [users,setUsers] = useState<CRMUser[]>([]);
    const [roles,setRoles] = useState<Role[]>([]);
    const [loading,setLoading] = useState(true);
    const [saving,setSaving] = useState(false);
    const [modalOpen,setModalOpen] = useState(false);
    const [editing,setEditing] = useState<CRMUser | null>(null);
    const [form,setForm] = useState<UserForm>(emptyForm);
    const [feedback,setFeedback] = useState<{ message:string;tone:"error"|"success" }>({ message:"",tone:"error" });
    const [modalError,setModalError] = useState("");

    const loadData = useCallback(async()=>{
        setLoading(true);
        try {
            const [usersResponse,rolesResponse] = await Promise.all([
                authenticatedFetch("/api/users?limit=100"),
                authenticatedFetch("/api/roles")
            ]);
            const usersResult:unknown = await usersResponse.json().catch(()=>null);
            const rolesResult:unknown = await rolesResponse.json().catch(()=>null);
            if(!usersResponse.ok) throw new Error(getApiError(usersResult,"Unable to load employees"));
            if(!rolesResponse.ok) throw new Error(getApiError(rolesResult,"Unable to load roles"));
            setUsers(usersResult && typeof usersResult === "object" && "users" in usersResult && Array.isArray(usersResult.users) ? usersResult.users as CRMUser[] : []);
            setRoles(rolesResult && typeof rolesResult === "object" && "roles" in rolesResult && Array.isArray(rolesResult.roles) ? rolesResult.roles as Role[] : []);
        }
        catch(error:unknown){
            setFeedback({ message:error instanceof Error ? error.message : "Unable to load employees",tone:"error" });
        }
        finally { setLoading(false); }
    },[]);

    useEffect(()=>{ void Promise.resolve().then(loadData); },[loadData]);

    const roleNames = useMemo(()=>new Map(roles.map((role)=>[role.id,role.name])),[roles]);
    const openCreate = () => { setEditing(null);setForm(emptyForm);setModalError("");setModalOpen(true); };
    const openEdit = (user:CRMUser) => { setEditing(user);setForm({ email:user.email,displayName:user.displayName,phone:user.phone,jobTitle:user.jobTitle,roleId:user.roleId });setModalError("");setModalOpen(true); };

    const saveUser = async() => {
        setModalError("");
        if(!form.email.trim() || !form.displayName.trim() || !form.roleId){ setModalError("Email, name, and role are required.");return; }
        setSaving(true);
        try {
            const response = await authenticatedFetch(editing ? `/api/users/${editing.uid}` : "/api/users",{
                method:editing ? "PATCH" : "POST",
                headers:{ "Content-Type":"application/json" },
                body:JSON.stringify(form)
            });
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok){ setModalError(getApiError(result,`Unable to ${editing ? "update" : "create"} employee`));return; }
            setFeedback({ message:`Employee ${editing ? "updated" : "created"} successfully`,tone:"success" });
            setModalOpen(false);
            await loadData();
        }
        catch(error:unknown){ setModalError(error instanceof Error ? error.message : "Employee operation failed"); }
        finally { setSaving(false); }
    };

    const disableUser = async(user:CRMUser) => {
        setFeedback({ message:"",tone:"error" });
        try {
            const response = await authenticatedFetch(`/api/users/${user.uid}/disable`,{ method:"POST" });
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to disable employee"));
            setFeedback({ message:"Employee disabled successfully",tone:"success" });
            await loadData();
        }
        catch(error:unknown){ setFeedback({ message:error instanceof Error ? error.message : "Unable to disable employee",tone:"error" }); }
    };

    const columns:CRMTableColumn<CRMUser>[] = [
        { key:"name",header:"Name",render:(user)=><span className="font-semibold text-slate-900">{user.displayName}</span> },
        { key:"email",header:"Email",render:(user)=>user.email },
        { key:"role",header:"Role",render:(user)=>roleNames.get(user.roleId) ?? user.roleId },
        { key:"status",header:"Status",render:(user)=><StatusBadge status={user.status}/> },
        { key:"created",header:"Created date",render:(user)=>formatCRMDate(user.createdAt) },
        { key:"actions",header:"Actions",render:(user)=><div className="flex gap-2"><Link href={`/dashboard/users/${user.uid}`} className="rounded-lg border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</Link><button type="button" onClick={()=>openEdit(user)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Pencil size={14}/>Edit</button><button type="button" disabled={user.status === "suspended"} onClick={()=>disableUser(user)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"><UserMinus size={14}/>Disable</button></div> }
    ];

    return <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">Users</h1><p className="mt-1 text-slate-600">Manage CRM employees and access roles.</p></div><button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"><UserPlus size={18}/>Add employee</button></div>
            <div className="my-6"><FeedbackMessage message={feedback.message} tone={feedback.tone}/></div>
            {loading ? <p className="text-slate-600">Loading employees...</p> : <CRMTable rows={users} columns={columns} getRowKey={(user)=>user.uid} emptyMessage="No employees found."/>}
        </div>

        <Modal open={modalOpen} title={editing ? "Edit employee" : "Add employee"} onClose={()=>setModalOpen(false)}>
            <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Email" type="email" value={form.email} onChange={(value)=>setForm((current)=>({ ...current,email:value }))}/>
                <FormField label="Name" value={form.displayName} onChange={(value)=>setForm((current)=>({ ...current,displayName:value }))}/>
                <FormField label="Phone" type="tel" value={form.phone} onChange={(value)=>setForm((current)=>({ ...current,phone:value }))}/>
                <FormField label="Job title" value={form.jobTitle} onChange={(value)=>setForm((current)=>({ ...current,jobTitle:value }))}/>
                <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">Role<select value={form.roleId} onChange={(event)=>setForm((current)=>({ ...current,roleId:event.target.value }))} className="rounded-xl border px-4 py-3 font-normal"><option value="">Select role</option>{roles.filter((role)=>role.status === "active").map((role)=><option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
            </div>
            <div className="mt-5"><FeedbackMessage message={modalError}/></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Cancel</button><button type="button" disabled={saving} onClick={saveUser} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Create employee"}</button></div>
        </Modal>
    </main>;
}

function FormField({ label,value,onChange,type="text" }:{ label:string;value:string;onChange:(value:string)=>void;type?:string }) {
    return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<input type={type} value={value} onChange={(event)=>onChange(event.target.value)} className="rounded-xl border px-4 py-3 font-normal"/></label>;
}

function StatusBadge({ status }:{ status:CRMUser["status"] }) {
    const colors = status === "active" ? "bg-green-100 text-green-700" : status === "suspended" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors}`}>{status}</span>;
}
