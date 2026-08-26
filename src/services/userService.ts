import "server-only";

import { adminAuth } from "@/lib/firebase-admin";
import { getRoleById } from "@/repositories/roleRepository";
import {
    createUserActivity,
    createUserProfile,
    getUserById,
    listUsers,
    updateUserProfile,
    type UpdateUserProfileInput
} from "@/repositories/userRepository";
import type { CRMUserStatus,CurrentCRMUser } from "@/types/crm-auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const statuses = new Set<CRMUserStatus>(["active","suspended","invited"]);

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
    temporaryPassword?:string;
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

export async function getUsers(limit?:number) {
    return listUsers(limit);
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
    const password = optionalText(input.temporaryPassword,"Temporary password");
    if(password && password.length < 6) throw new UserServiceError("Temporary password must contain at least 6 characters",400,"weak_password");

    await ensureEmailAvailable(email);
    await requireActiveRole(roleId);

    const firebaseUser = await adminAuth.createUser({ email,displayName,password:password ?? undefined,disabled:false });
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
            createdById:actor.uid
        },{
            actorId:actor.uid,
            action:"user.created",
            entityId:firebaseUser.uid,
            metadata:{ roleId,status:"active" }
        });
    }
    catch(error){
        await adminAuth.deleteUser(firebaseUser.uid).catch(()=>undefined);
        throw error;
    }

    const passwordResetLink = password ? null : await adminAuth.generatePasswordResetLink(email);
    return { user:await getUser(firebaseUser.uid),passwordResetLink };
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
            action:"user.updated",
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

export async function createPasswordReset(uid:string,actor:CurrentCRMUser) {
    const user = await getUser(uid);
    if(user.status !== "active") throw new UserServiceError("Password reset is unavailable for inactive users",400,"inactive_user");
    const passwordResetLink = await adminAuth.generatePasswordResetLink(user.email);
    await createUserActivity({
        actorId:actor.uid,
        action:"user.password_reset_requested",
        entityId:uid,
        metadata:{}
    });
    return { passwordResetLink };
}
