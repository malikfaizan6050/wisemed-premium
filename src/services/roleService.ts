import "server-only";

import { validatePermissions } from "@/lib/permissions";
import {
    createRoleRecord,
    deleteRoleRecord,
    getRoleById,
    listRoles,
    roleNameExists,
    updateRoleRecord,
    type UpdateRoleRecord
} from "@/repositories/roleRepository";
import type { CurrentCRMUser,Permission,RoleStatus } from "@/types/crm-auth";

export class RoleServiceError extends Error {
    constructor(message:string,public readonly status:number,public readonly code:string) {
        super(message);
    }
}

export interface CreateRoleInput {
    name:string;
    description?:string;
    permissions:Permission[];
    status?:RoleStatus;
}

export interface UpdateRoleInput {
    name?:string;
    description?:string;
    permissions?:Permission[];
    status?:RoleStatus;
}

function requiredName(value:unknown) {
    if(typeof value !== "string" || !value.trim()) throw new RoleServiceError("Role name is required",400,"validation_error");
    if(value.trim().length > 80) throw new RoleServiceError("Role name is too long",400,"validation_error");
    return value.trim();
}

function description(value:unknown) {
    if(value === undefined || value === null) return "";
    if(typeof value !== "string") throw new RoleServiceError("Description must be a string",400,"validation_error");
    if(value.trim().length > 500) throw new RoleServiceError("Description is too long",400,"validation_error");
    return value.trim();
}

function permissions(value:unknown) {
    const result = validatePermissions(value);
    if(!result) throw new RoleServiceError("Permissions contain an invalid value",400,"invalid_permissions");
    return result;
}

function status(value:unknown):RoleStatus {
    if(value !== "active" && value !== "disabled") throw new RoleServiceError("Role status must be active or disabled",400,"invalid_status");
    return value;
}

export async function getRoles() {
    return listRoles();
}

export async function getRole(id:string) {
    const role = await getRoleById(id);
    if(!role) throw new RoleServiceError("Role not found",404,"role_not_found");
    return role;
}

export async function createRole(input:CreateRoleInput,actor:CurrentCRMUser) {
    const name = requiredName(input.name);
    if(await roleNameExists(name)) throw new RoleServiceError("A role with this name already exists",409,"duplicate_role_name");
    const rolePermissions = permissions(input.permissions);
    const roleStatus = input.status === undefined ? "active" : status(input.status);
    const id = await createRoleRecord({
        name,
        description:description(input.description),
        permissions:rolePermissions,
        isSystemRole:false,
        status:roleStatus,
        createdById:actor.uid,
        updatedById:actor.uid
    },{
        actorId:actor.uid,
        action:"role.created",
        metadata:{ name,status:roleStatus,permissions:rolePermissions }
    });
    return getRole(id);
}

export async function updateRole(id:string,input:UpdateRoleInput,actor:CurrentCRMUser) {
    const current = await getRole(id);
    const updates:UpdateRoleRecord = { updatedById:actor.uid };
    const changedFields:string[] = [];

    if(input.name !== undefined){
        const name = requiredName(input.name);
        if(await roleNameExists(name,id)) throw new RoleServiceError("A role with this name already exists",409,"duplicate_role_name");
        updates.name = name;
        changedFields.push("name");
    }
    if(input.description !== undefined){ updates.description = description(input.description);changedFields.push("description"); }
    if(input.permissions !== undefined){ updates.permissions = permissions(input.permissions);changedFields.push("permissions"); }
    if(input.status !== undefined){
        const roleStatus = status(input.status);
        if(current.isSystemRole && roleStatus === "disabled") throw new RoleServiceError("System roles cannot be disabled",400,"system_role_protected");
        updates.status = roleStatus;
        changedFields.push("status");
    }
    if(changedFields.length === 0) throw new RoleServiceError("No role fields supplied",400,"empty_update");

    await updateRoleRecord(id,updates,{
        actorId:actor.uid,
        action:"role.updated",
        entityId:id,
        metadata:{ changedFields,previousStatus:current.status,newStatus:updates.status ?? current.status }
    });
    return getRole(id);
}

export async function deleteRole(id:string,actor:CurrentCRMUser) {
    const role = await getRole(id);
    if(role.isSystemRole || id === "admin" || id === "sales"){
        throw new RoleServiceError("System roles cannot be deleted",400,"system_role_protected");
    }
    const deleted = await deleteRoleRecord(id,{
        actorId:actor.uid,
        action:"role.deleted",
        entityId:id,
        metadata:{ name:role.name }
    });
    if(!deleted) throw new RoleServiceError("Role is assigned to one or more users",409,"role_in_use");
}
