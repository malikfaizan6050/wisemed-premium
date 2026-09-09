"use client";

import { useCallback,useEffect,useMemo,useState } from "react";
import { Mail,Pencil,Trash2,UserMinus,UserPlus } from "lucide-react";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import type { CRMUser,Role } from "@/types/crm-auth";
import CRMTable,{ type CRMTableColumn } from "@/components/CRM/CRMTable";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import Modal from "@/components/CRM/Modal";
import PermissionGuard from "@/components/CRM/PermissionGuard";
import { formatCRMDate,getApiError } from "@/components/CRM/managementUtils";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { useCRMUser } from "@/components/CRM/CRMUserContext";

interface UserForm {
    email:string;
    displayName:string;
    phone:string;
    jobTitle:string;
    roleId:string;
}

interface TemporaryCredential { email:string;password:string;expiresAt:string }

const emptyForm:UserForm = { email:"",displayName:"",phone:"",jobTitle:"",roleId:"" };

export default function UsersPage() {
    return <PermissionGuard permission="users.read"><UsersContent/></PermissionGuard>;
}

function UsersContent() {
    const { hasPermission }=useCRMUser();
    const canManage=hasPermission("users.manage");
    const [users,setUsers] = useState<CRMUser[]>([]);
    const [roles,setRoles] = useState<Role[]>([]);
    const [loading,setLoading] = useState(true);
    const [saving,setSaving] = useState(false);
    const [modalOpen,setModalOpen] = useState(false);
    const [editing,setEditing] = useState<CRMUser | null>(null);
    const [form,setForm] = useState<UserForm>(emptyForm);
    const [feedback,setFeedback] = useState<{ message:string;tone:"error"|"success" }>({ message:"",tone:"error" });
    const [modalError,setModalError] = useState("");
    const [temporaryCredential,setTemporaryCredential] = useState<TemporaryCredential | null>(null);
    const [deleteTarget,setDeleteTarget] = useState<CRMUser | null>(null);
    const [deleting,setDeleting] = useState(false);

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
            if(!editing && result && typeof result === "object" && "temporaryPassword" in result && typeof result.temporaryPassword === "string"){
                setTemporaryCredential({
                    email:form.email.trim(),
                    password:result.temporaryPassword,
                    expiresAt:"temporaryPasswordExpiresAt" in result && typeof result.temporaryPasswordExpiresAt === "string" ? result.temporaryPasswordExpiresAt : ""
                });
            }
            setFeedback({ message:editing ? "Employee updated successfully" : "Employee created successfully",tone:"success" });
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

    const runPasswordAction = async(user:CRMUser) => {
        setFeedback({ message:"",tone:"error" });
        try {
            const response = await authenticatedFetch(`/api/users/${user.uid}/reset-password`,{ method:"POST" });
            const result:unknown = await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to update password"));
            if(result&&typeof result==="object"&&"temporaryPassword" in result&&typeof result.temporaryPassword==="string"){
                setTemporaryCredential({
                    email:user.email,
                    password:result.temporaryPassword,
                    expiresAt:"temporaryPasswordExpiresAt" in result && typeof result.temporaryPasswordExpiresAt === "string" ? result.temporaryPasswordExpiresAt : ""
                });
                setFeedback({ message:"Temporary password regenerated successfully",tone:"success" });
            }
            else{
                if(!result||typeof result!=="object"||!("passwordResetEmail" in result)||typeof result.passwordResetEmail!=="string"){
                    throw new Error("Firebase Authentication did not return a valid reset email address.");
                }
                await sendPasswordResetEmail(auth,result.passwordResetEmail);
                setTemporaryCredential(null);
                setFeedback({ message:"Password reset email sent successfully",tone:"success" });
            }
        }
        catch(error:unknown){ setFeedback({ message:getPasswordResetError(error),tone:"error" }); }
    };

    const deleteUser = async() => {
        if(!deleteTarget) return;
        setDeleting(true);setFeedback({ message:"",tone:"error" });
        try {
            const response=await authenticatedFetch(`/api/users/${deleteTarget.uid}`,{ method:"DELETE" });
            const result:unknown=await response.json().catch(()=>null);
            if(!response.ok) throw new Error(getApiError(result,"Unable to delete user"));
            setUsers((current)=>current.filter((user)=>user.uid!==deleteTarget.uid));
            setDeleteTarget(null);
            setFeedback({ message:"User deleted successfully",tone:"success" });
        }
        catch(error:unknown){ setFeedback({ message:error instanceof Error?error.message:"Unable to delete user",tone:"error" }); }
        finally { setDeleting(false); }
    };

    const columns:CRMTableColumn<CRMUser>[] = [
        { key:"name",header:"Name",render:(user)=><span className="font-semibold text-slate-900">{user.displayName}</span> },
        { key:"email",header:"Email",render:(user)=>user.email },
        { key:"role",header:"Role",render:(user)=>roleNames.get(user.roleId) ?? user.roleId },
        { key:"status",header:"Status",render:(user)=><StatusBadge user={user}/> },
        { key:"created",header:"Created date",render:(user)=>formatCRMDate(user.createdAt,"N/A") },
        { key:"actions",header:"Actions",render:(user)=><div className="flex flex-wrap gap-2"><Link href={`/dashboard/users/${user.uid}`} className="rounded-lg border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</Link>{canManage&&<><button type="button" onClick={()=>openEdit(user)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Pencil size={14}/>Edit</button>{user.status !== "suspended" && <button type="button" onClick={()=>void runPasswordAction(user)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Mail size={14}/>{user.mustChangePassword||user.status==="invited"?"Temp Password":"Reset Password"}</button>}<button type="button" disabled={user.status === "suspended"} onClick={()=>disableUser(user)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"><UserMinus size={14}/>Disable</button><button type="button" onClick={()=>setDeleteTarget(user)} className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 size={14}/>Delete</button></>}</div> }
    ];

    return <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">Users</h1><p className="mt-1 text-slate-600">Manage CRM employees and access roles.</p></div>{canManage&&<button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"><UserPlus size={18}/>Add employee</button>}</div>
            <div className="my-6"><FeedbackMessage message={feedback.message} tone={feedback.tone}/></div>
            {temporaryCredential && <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-slate-800"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">Temporary login credentials</p><p className="mt-1">Share this password securely with {temporaryCredential.email}. It is shown only in this browser session.</p></div><button type="button" onClick={()=>setTemporaryCredential(null)} className="font-semibold text-slate-600">Dismiss</button></div><div className="mt-4 flex flex-wrap items-center gap-3"><code className="rounded-lg border bg-white px-4 py-2 font-mono font-semibold">{temporaryCredential.password}</code><button type="button" onClick={async()=>{ await navigator.clipboard.writeText(temporaryCredential.password);setFeedback({ message:"Temporary password copied",tone:"success" }); }} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Copy password</button></div>{temporaryCredential.expiresAt && <p className="mt-3 text-xs text-slate-600">Expires: {new Date(temporaryCredential.expiresAt).toLocaleString()}</p>}</div>}
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
        <Modal open={Boolean(deleteTarget)} title="Delete user" onClose={()=>{ if(!deleting)setDeleteTarget(null); }}>
            <p className="text-slate-700">Are you sure you want to permanently delete this user?</p>
            {deleteTarget&&<p className="mt-2 font-semibold text-slate-900">{deleteTarget.displayName} · {deleteTarget.email}</p>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={deleting} onClick={()=>setDeleteTarget(null)} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Cancel</button><button type="button" disabled={deleting} onClick={()=>void deleteUser()} className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{deleting?"Deleting...":"Delete permanently"}</button></div>
        </Modal>
    </main>;
}

function FormField({ label,value,onChange,type="text" }:{ label:string;value:string;onChange:(value:string)=>void;type?:string }) {
    return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<input type={type} value={value} onChange={(event)=>onChange(event.target.value)} className="rounded-xl border px-4 py-3 font-normal"/></label>;
}

function StatusBadge({ user }:{ user:CRMUser }) {
    const pending=user.mustChangePassword;
    const colors = user.status === "suspended" ? "bg-red-100 text-red-700" : pending ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
    const label=user.status === "suspended" ? "Suspended" : pending ? "Pending password change" : "Active";
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors}`}>{label}</span>;
}

function getPasswordResetError(error:unknown) {
    const code=error instanceof FirebaseError ? error.code : "";
    if(code==="auth/user-not-found") return "No Firebase Authentication user exists for this email address.";
    if(code==="auth/invalid-email") return "The user's Firebase Authentication email address is invalid.";
    if(code==="auth/too-many-requests") return "Too many password reset attempts. Please wait and try again.";
    if(code==="auth/network-request-failed") return "Unable to reach Firebase Authentication. Check your network connection and try again.";
    if(code==="auth/operation-not-allowed") return "Password reset is not enabled for Email/Password accounts in Firebase Authentication.";
    return error instanceof Error ? error.message : "Unable to send password reset email.";
}
