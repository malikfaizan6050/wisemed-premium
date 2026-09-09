import "server-only";

import { adminAuth } from "@/lib/firebase-admin";
import { getRoleById } from "@/repositories/roleRepository";
import {
    createUserProfile,
    deleteUserData,
    getUserById,
    listTeamMemberIds,
    listUsers,
    updateUserProfile,
    type ListUsersOptions,
    type UpdateUserProfileInput
} from "@/repositories/userRepository";
import type { AssignableCRMUser,CRMUser,CRMUserStatus,CurrentCRMUser } from "@/types/crm-auth";
import { createNotification } from "@/services/notificationService";
import { randomBytes } from "node:crypto";
import { isAdmin,isSalesUser } from "@/lib/roleClassification";
import { canAssignLead } from "@/lib/leadOwnership";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const statuses = new Set<CRMUserStatus>(["active","suspended","invited"]);
const personalPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export class UserServiceError extends Error {
    constructor(message:string,public readonly status:number,public readonly code:string) {
        super(message);
    }
}

export interface CreateUserInput {
    email:string;
    displayName:string;
    phone?:string;
    jobTitle?:string;
    roleId:string;
    teamId?:string | null;
    managerId?:string | null;
}

export interface UpdateUserInput {
    email?:string;
    displayName?:string;
    phone?:string;
    jobTitle?:string;
    roleId?:string;
    teamId?:string | null;
    managerId?:string | null;
    status?:CRMUserStatus;
}

function requiredText(value:unknown,label:string) {
    if(typeof value !== "string" || !value.trim()) throw new UserServiceError(`${label} is required`,400,"validation_error");
    return value.trim();
}

function optionalText(value:unknown,label:string) {
    if(value === undefined || value === null || value === "") return null;
    if(typeof value !== "string") throw new UserServiceError(`${label} must be a string`,400,"validation_error");
    return value.trim() || null;
}

async function requireActiveRole(roleId:string) {
    const role = await getRoleById(roleId);
    if(!role) throw new UserServiceError("Role not found",400,"invalid_role");
    if(role.status !== "active") throw new UserServiceError("Role is disabled",400,"inactive_role");
    return role;
}

async function ensureEmailAvailable(email:string,excludingUid?:string) {
    try {
        const existing = await adminAuth.getUserByEmail(email);
        if(existing.uid !== excludingUid) throw new UserServiceError("A user with this email already exists",409,"duplicate_email");
    }
    catch(error:unknown){
        if(error instanceof UserServiceError) throw error;
        if((error as { code?:string })?.code !== "auth/user-not-found") throw error;
    }
}

export async function getUsers(options:ListUsersOptions = {}) {
    if(options.status && !statuses.has(options.status)){
        throw new UserServiceError("Invalid user status filter",400,"invalid_status");
    }
    if(options.roleId !== undefined && !options.roleId.trim()){
        throw new UserServiceError("Invalid role filter",400,"invalid_role_filter");
    }
    return listUsers({ ...options,roleId:options.roleId?.trim() });
}

export async function getAssignableUsers(actor:CurrentCRMUser):Promise<AssignableCRMUser[]> {
    if(!canAssignLead(actor)){
        throw new UserServiceError("Insufficient permissions",403,"insufficient_permissions");
    }

    const users=await listUsers({ status:"active",limit:100 });
    const roleEntries=await Promise.all(Array.from(new Set(users.map((user)=>user.roleId))).map(async(roleId)=>[
        roleId,await getRoleById(roleId)
    ] as const));
    const roles=new Map(roleEntries);
    const allowedIds=isAdmin(actor.role)
        ? null
        : new Set(await listTeamMemberIds(actor));

    return users.flatMap((user)=>{
        if(allowedIds&&!allowedIds.has(user.uid)) return [];
        const role=roles.get(user.roleId);
        if(!role||role.status!=="active"||!isSalesUser(role)) return [];
        return [{
            uid:user.uid,
            displayName:user.displayName,
            email:user.email,
            role:{ id:role.id,name:role.name }
        }];
    });
}

export async function getUser(uid:string) {
    const user = await getUserById(uid);
    if(!user) throw new UserServiceError("User not found",404,"user_not_found");
    return user;
}

export async function createUser(input:CreateUserInput,actor:CurrentCRMUser) {
    const email = requiredText(input.email,"Email").toLowerCase();
    if(!emailPattern.test(email)) throw new UserServiceError("Invalid email address",400,"invalid_email");
    const displayName = requiredText(input.displayName,"Display name");
    const roleId = requiredText(input.roleId,"Role");
    await ensureEmailAvailable(email);
    await requireActiveRole(roleId);

    const temporaryPassword = generateTemporaryPassword();
    const temporaryPasswordExpiresAt = getTemporaryPasswordExpiry();
    const firebaseUser = await adminAuth.createUser({ email,displayName,password:temporaryPassword,disabled:false });
    try {
        await adminAuth.setCustomUserClaims(firebaseUser.uid,{ roleId });
        await createUserProfile({
            uid:firebaseUser.uid,
            email,
            displayName,
            phone:optionalText(input.phone,"Phone") ?? "",
            jobTitle:optionalText(input.jobTitle,"Job title") ?? "",
            roleId,
            teamId:optionalText(input.teamId,"Team"),
            managerId:optionalText(input.managerId,"Manager"),
            status:"active",
            mustChangePassword:true,
            temporaryPasswordExpiresAt,
            createdById:actor.uid
        },{
            actorId:actor.uid,
            action:"user.created",
            entityId:firebaseUser.uid,
            metadata:{ roleId,status:"active",mustChangePassword:true }
        });
    }
    catch(error){
        await adminAuth.deleteUser(firebaseUser.uid).catch(()=>undefined);
        throw error;
    }

    await createNotification({
        userId:firebaseUser.uid,type:"user.created",title:"CRM account created",
        message:"Your CRM employee profile is ready.",entityType:"user",entityId:firebaseUser.uid
    }).catch(()=>undefined);
    return { user:await getUser(firebaseUser.uid),temporaryPassword,temporaryPasswordExpiresAt:temporaryPasswordExpiresAt.toISOString() };
}

export async function updateUser(uid:string,input:UpdateUserInput,actor:CurrentCRMUser) {
    const current = await getUser(uid);
    const updates:UpdateUserProfileInput = {};
    const changedFields:string[] = [];

    if(input.email !== undefined){
        const email = requiredText(input.email,"Email").toLowerCase();
        if(!emailPattern.test(email)) throw new UserServiceError("Invalid email address",400,"invalid_email");
        await ensureEmailAvailable(email,uid);
        updates.email = email;
        changedFields.push("email");
    }
    for(const field of ["displayName","phone","jobTitle"] as const){
        if(input[field] !== undefined){
            updates[field] = field === "displayName" ? requiredText(input[field],"Display name") : optionalText(input[field],field) ?? "";
            changedFields.push(field);
        }
    }
    for(const field of ["teamId","managerId"] as const){
        if(input[field] !== undefined){ updates[field] = optionalText(input[field],field);changedFields.push(field); }
    }
    if(input.status !== undefined){
        if(!statuses.has(input.status)) throw new UserServiceError("Invalid user status",400,"invalid_status");
        updates.status = input.status;
        changedFields.push("status");
    }
    if(input.roleId !== undefined){
        const roleId = requiredText(input.roleId,"Role");
        await requireActiveRole(roleId);
        updates.roleId = roleId;
        changedFields.push("roleId");
    }
    if(changedFields.length === 0) throw new UserServiceError("No user fields supplied",400,"empty_update");

    const authUser = await adminAuth.getUser(uid).catch(()=>{ throw new UserServiceError("Firebase user not found",404,"auth_user_not_found"); });
    const previousClaims = authUser.customClaims ?? {};
    try {
        await adminAuth.updateUser(uid,{
            email:updates.email,
            displayName:updates.displayName,
            disabled:updates.status ? updates.status !== "active" : undefined
        });
        if(updates.roleId) await adminAuth.setCustomUserClaims(uid,{ ...previousClaims,roleId:updates.roleId });
        await updateUserProfile(uid,updates,{
            actorId:actor.uid,
            action:updates.roleId ? "role.changed" : "user.updated",
            entityId:uid,
            metadata:{ changedFields,previousRoleId:current.roleId,newRoleId:updates.roleId ?? current.roleId }
        });
        if(updates.status && updates.status !== "active") await adminAuth.revokeRefreshTokens(uid);
    }
    catch(error){
        await adminAuth.updateUser(uid,{ email:authUser.email,displayName:authUser.displayName,disabled:authUser.disabled }).catch(()=>undefined);
        if(updates.roleId) await adminAuth.setCustomUserClaims(uid,previousClaims).catch(()=>undefined);
        throw error;
    }
    return getUser(uid);
}

export async function disableUser(uid:string,actor:CurrentCRMUser) {
    if(uid === actor.uid) throw new UserServiceError("You cannot disable your own account",400,"self_disable");
    await getUser(uid);
    await adminAuth.updateUser(uid,{ disabled:true }).catch(()=>{ throw new UserServiceError("Firebase user not found",404,"auth_user_not_found"); });
    try {
        await updateUserProfile(uid,{ status:"suspended" },{
            actorId:actor.uid,action:"user.disabled",entityId:uid,metadata:{ status:"suspended" }
        });
        await adminAuth.revokeRefreshTokens(uid);
    }
    catch(error){
        await adminAuth.updateUser(uid,{ disabled:false }).catch(()=>undefined);
        throw error;
    }
    return getUser(uid);
}

export async function deleteUser(uid:string,actor:CurrentCRMUser) {
    if(uid === actor.uid) throw new UserServiceError("You cannot delete your own account",400,"self_delete");
    const user = await getUser(uid);
    const role = await getRoleById(user.roleId);
    if(isAdmin(user.roleId) || (role?.isSystemRole === true && !isSalesUser(role))){
        throw new UserServiceError("Admin and system accounts cannot be deleted",403,"protected_system_user");
    }

    const firebaseUser = await adminAuth.getUser(uid).catch((error:unknown)=>{
        if((error as { code?:string })?.code === "auth/user-not-found") return null;
        throw error;
    });
    if(firebaseUser){
        await adminAuth.updateUser(uid,{ disabled:true });
        await adminAuth.revokeRefreshTokens(uid);
    }

    if(firebaseUser) await adminAuth.deleteUser(uid);
    await deleteUserData(user,actor.uid);
    return { deleted:true,id:uid };
}

export async function handlePasswordAction(uid:string,actor:CurrentCRMUser) {
    const user = await getUser(uid);
    if(user.status === "suspended") throw new UserServiceError("Suspended users cannot receive temporary passwords",400,"suspended_user");
    if(!user.mustChangePassword&&user.status!=="invited"){
        const firebaseUser=await adminAuth.getUser(uid).catch((error:unknown)=>{
            const code=(error as { code?:string })?.code;
            if(code==="auth/user-not-found") throw new UserServiceError("No Firebase Authentication user exists for this employee",404,"auth/user-not-found");
            throw new UserServiceError("Unable to verify the employee in Firebase Authentication",502,code||"auth/verification-failed");
        });
        const passwordResetEmail=firebaseUser.email?.trim().toLowerCase()??"";
        if(!emailPattern.test(passwordResetEmail)){
            throw new UserServiceError("The employee's Firebase Authentication email address is invalid",400,"auth/invalid-email");
        }
        return { passwordResetEmail };
    }
    const temporaryPassword = generateTemporaryPassword();
    const temporaryPasswordExpiresAt = getTemporaryPasswordExpiry();
    await updateUserProfile(uid,{ status:"active",mustChangePassword:true,temporaryPasswordExpiresAt },{
        actorId:actor.uid,
        action:"user.temporary_password_regenerated",
        entityId:uid,
        metadata:{ expiresAt:temporaryPasswordExpiresAt.toISOString() }
    });
    try {
        await adminAuth.updateUser(uid,{ password:temporaryPassword,disabled:false });
        await adminAuth.revokeRefreshTokens(uid);
    }
    catch(error){
        await updateUserProfile(uid,{
            status:user.status,
            mustChangePassword:user.mustChangePassword,
            temporaryPasswordExpiresAt:user.temporaryPasswordExpiresAt
        },{
            actorId:actor.uid,
            action:"user.temporary_password_regeneration_rolled_back",
            entityId:uid,
            metadata:{}
        }).catch(()=>undefined);
        throw error;
    }
    return { temporaryPassword,temporaryPasswordExpiresAt:temporaryPasswordExpiresAt.toISOString() };
}

export async function completeTemporaryPasswordSetup(uid:string,newPassword:unknown) {
    const user = await getUser(uid);
    if((user.status !== "active" && user.status !== "invited") || !user.mustChangePassword){
        throw new UserServiceError("Password change is not required",400,"password_change_not_required");
    }
    if(isExpired(user.temporaryPasswordExpiresAt)){
        throw new UserServiceError("Temporary password has expired. Ask an administrator to regenerate it.",403,"temporary_password_expired");
    }
    if(typeof newPassword !== "string" || !personalPasswordPattern.test(newPassword)){
        throw new UserServiceError("Password must be 12-128 characters and include uppercase, lowercase, number, and symbol",400,"weak_password");
    }
    await adminAuth.updateUser(uid,{ password:newPassword });
    await updateUserProfile(uid,{ mustChangePassword:false,temporaryPasswordExpiresAt:null,lastLoginAt:new Date() },{
        actorId:uid,
        action:"user.password_setup_completed",
        entityId:uid,
        metadata:{}
    });
    return { passwordChanged:true };
}

function generateTemporaryPassword() {
    try {
        return `${randomBytes(18).toString("base64url")}aA1!`;
    }
    catch {
        throw new UserServiceError("Secure temporary password generation failed",500,"password_generation_failed");
    }
}

function getTemporaryPasswordExpiry() {
    const configured = Number(process.env.CRM_TEMPORARY_PASSWORD_TTL_HOURS ?? "24");
    const hours = Number.isFinite(configured) && configured > 0 ? Math.min(configured,168) : 24;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function isExpired(value:CRMUser["temporaryPasswordExpiresAt"]) {
    if(!value) return true;
    const date = value instanceof Date ? value : value.toDate();
    return date.getTime() <= Date.now();
}
