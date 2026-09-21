export const CRM_PERMISSIONS = [
    "leads.read.all",
    "leads.read.owned",
    "leads.create",
    "leads.update.all",
    "leads.update.owned",
    "leads.delete",
    "leads.export",
    "leads.assign",
    "users.assignable.read",
    "users.read",
    "users.manage",
    "roles.read",
    "roles.manage",
    "activities.read.all",
    "activities.read.own",
    "analytics.read",
    "import_leads",
    "system.migrate",
    "system.diagnostics"
] as const;

export type Permission = typeof CRM_PERMISSIONS[number];

const permissionSet = new Set<string>(CRM_PERMISSIONS);

export function isPermission(value:unknown):value is Permission {
    return typeof value === "string" && permissionSet.has(value);
}

export function validatePermissions(value:unknown):Permission[] | null {
    if(!Array.isArray(value) || !value.every(isPermission)) return null;
    return Array.from(new Set(value));
}

const impliedPermissions:Partial<Record<Permission,readonly Permission[]>> = {
    "roles.read":["roles.manage"],
    "users.read":["users.manage"],
    "users.assignable.read":["leads.assign"]
};

export function hasPermission(permissions:readonly Permission[],permission:Permission):boolean {
    return permissions.includes(permission) ||
        (impliedPermissions[permission]?.some((candidate)=>permissions.includes(candidate)) ?? false);
}

const leadCreationRestrictedRoles = new Set([
    "sales",
    "salesperson",
    "billing",
    "billing_user"
]);

export function canCreateLead(roleId:string | null | undefined,permissions:readonly Permission[],roleName?:string | null) {
    const normalizeRole=(value:string | null | undefined)=>value?.trim().toLowerCase().replaceAll(" ","_") ?? "";
    const restricted=[normalizeRole(roleId),normalizeRole(roleName)].some((role)=>leadCreationRestrictedRoles.has(role));
    return !restricted && permissions.includes("leads.create");
}

// Admin keeps these two regardless of its toggles. Every other permission,
// admin included, is decided by the switches on the role screen. Without this
// floor an admin could revoke roles.manage and lock every account out of the
// only screen able to grant it back.
export const ADMIN_RECOVERY_PERMISSIONS:readonly Permission[] = ["roles.read","roles.manage"];

// The single authority for "can this role do this". Both the API and the CRM UI
// call it so a hidden button and a 403 can never disagree.
export function resolvePermission(
    roleId:string | null | undefined,
    roleName:string | null | undefined,
    permissions:readonly Permission[],
    permission:Permission
):boolean {
    if(roleId === "admin" && ADMIN_RECOVERY_PERMISSIONS.includes(permission)) return true;
    if(permission === "leads.create") return canCreateLead(roleId,permissions,roleName);
    return hasPermission(permissions,permission);
}
