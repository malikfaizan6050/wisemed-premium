"use client";

import { useCallback,useEffect,useState } from "react";
import { Pencil,Plus,Trash2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { CRM_PERMISSIONS,type Permission } from "@/lib/permissions";
import type { Role } from "@/types/crm-auth";
import CRMTable,{ type CRMTableColumn } from "@/components/CRM/CRMTable";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import Modal from "@/components/CRM/Modal";
import PermissionGuard from "@/components/CRM/PermissionGuard";
import { getApiError } from "@/components/CRM/managementUtils";

interface RoleForm { name:string;description:string;permissions:Permission[] }
const emptyForm:RoleForm = { name:"",description:"",permissions:[] };

export default function RolesPage() {
    return <PermissionGuard permission="roles.manage"><RolesContent/></PermissionGuard>;
}

function RolesContent() {
    const [roles,setRoles] = useState<Role[]>([]);
    const [loading,setLoading] = useState(true);
    const [saving,setSaving] = useState(false);
    const [modalOpen,setModalOpen] = useState(false);
    const [editing,setEditing] = useState<Role | null>(null);
    const [deleting,setDeleting] = useState<Role | null>(null);
    const [form,setForm] = useState<RoleForm>(emptyForm);
    const [feedback,setFeedback] = useState<{ message:string;tone:"error"|"success" }>({ message:"",tone:"error" });
    const [modalError,setModalError] = useState("");

    const loadRoles = useCallback(async()=>{
        setLoading(true);
        try {
            const response = await authenticatedFetch("/api/roles");
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to load roles"));
            setRoles(result && typeof result === "object" && "roles" in result && Array.isArray(result.roles) ? result.roles as Role[] : []);
        }
        catch(error:unknown){ setFeedback({ message:error instanceof Error ? error.message : "Unable to load roles",tone:"error" }); }
        finally { setLoading(false); }
    },[]);

    useEffect(()=>{ void Promise.resolve().then(loadRoles); },[loadRoles]);

    const openCreate = () => { setEditing(null);setForm(emptyForm);setModalError("");setModalOpen(true); };
    const openEdit = (role:Role) => { setEditing(role);setForm({ name:role.name,description:role.description,permissions:[...role.permissions] });setModalError("");setModalOpen(true); };

    const saveRole = async() => {
        setModalError("");
        if(!form.name.trim()){ setModalError("Role name is required.");return; }
        setSaving(true);
        try {
            const response = await authenticatedFetch(editing ? `/api/roles/${editing.id}` : "/api/roles",{
                method:editing ? "PATCH" : "POST",
                headers:{ "Content-Type":"application/json" },
                body:JSON.stringify(form)
            });
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok){ setModalError(getApiError(result,`Unable to ${editing ? "update" : "create"} role`));return; }
            setFeedback({ message:`Role ${editing ? "updated" : "created"} successfully`,tone:"success" });
            setModalOpen(false);
            await loadRoles();
        }
        catch(error:unknown){ setModalError(error instanceof Error ? error.message : "Role operation failed"); }
        finally { setSaving(false); }
    };

    const deleteRole = async() => {
        if(!deleting) return;
        setSaving(true);
        try {
            const response = await authenticatedFetch(`/api/roles/${deleting.id}`,{ method:"DELETE" });
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to delete role"));
            setFeedback({ message:"Role deleted successfully",tone:"success" });
            setDeleting(null);
            await loadRoles();
        }
        catch(error:unknown){ setFeedback({ message:error instanceof Error ? error.message : "Unable to delete role",tone:"error" });setDeleting(null); }
        finally { setSaving(false); }
    };

    const togglePermission = (permission:Permission) => setForm((current)=>({
        ...current,
        permissions:current.permissions.includes(permission)
            ? current.permissions.filter((value)=>value !== permission)
            : [...current.permissions,permission]
    }));

    const columns:CRMTableColumn<Role>[] = [
        { key:"name",header:"Role name",render:(role)=><span className="font-semibold text-slate-900">{role.name}</span> },
        { key:"description",header:"Description",render:(role)=>role.description || "—" },
        { key:"permissions",header:"Permissions count",render:(role)=>role.permissions.length },
        { key:"status",header:"Status",render:(role)=><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${role.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"}`}>{role.status}</span> },
        { key:"actions",header:"Actions",render:(role)=><div className="flex gap-2"><button type="button" onClick={()=>openEdit(role)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Pencil size={14}/>Edit</button>{!role.isSystemRole && role.id !== "admin" && role.id !== "sales" && <button type="button" onClick={()=>setDeleting(role)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 size={14}/>Delete</button>}</div> }
    ];

    return <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">Roles</h1><p className="mt-1 text-slate-600">Configure CRM roles and permissions.</p></div><button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"><Plus size={18}/>Create role</button></div>
            <div className="my-6"><FeedbackMessage message={feedback.message} tone={feedback.tone}/></div>
            {loading ? <p className="text-slate-600">Loading roles...</p> : <CRMTable rows={roles} columns={columns} getRowKey={(role)=>role.id} emptyMessage="No roles found."/>}
        </div>

        <Modal open={modalOpen} title={editing ? "Edit role" : "Create role"} onClose={()=>setModalOpen(false)} maxWidth="xl">
            <div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold text-slate-700">Name<input value={form.name} onChange={(event)=>setForm((current)=>({ ...current,name:event.target.value }))} className="rounded-xl border px-4 py-3 font-normal"/></label><label className="grid gap-2 text-sm font-semibold text-slate-700">Description<textarea value={form.description} onChange={(event)=>setForm((current)=>({ ...current,description:event.target.value }))} className="min-h-24 rounded-xl border px-4 py-3 font-normal"/></label></div>
            <fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">Permissions</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{CRM_PERMISSIONS.map((permission)=><label key={permission} className="flex items-center gap-3 rounded-xl border p-3 text-sm text-slate-700"><input type="checkbox" checked={form.permissions.includes(permission)} onChange={()=>togglePermission(permission)} className="h-4 w-4 accent-blue-600"/><span>{permission}</span></label>)}</div></fieldset>
            <div className="mt-5"><FeedbackMessage message={modalError}/></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Cancel</button><button type="button" disabled={saving} onClick={saveRole} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Create role"}</button></div>
        </Modal>

        <Modal open={Boolean(deleting)} title="Delete role" onClose={()=>setDeleting(null)}>
            <p className="text-slate-600">Delete <span className="font-semibold text-slate-900">{deleting?.name}</span>? A role assigned to users cannot be deleted.</p>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>setDeleting(null)} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Cancel</button><button type="button" disabled={saving} onClick={deleteRole} className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Deleting..." : "Delete role"}</button></div>
        </Modal>
    </main>;
}
