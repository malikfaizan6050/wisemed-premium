export const CRM_PERMISSIONS = [
    "leads.read.all",
    "leads.read.owned",
    "leads.create",
    "leads.update.all",
    "leads.update.owned",
    "leads.assign",
    "users.assignable.read",
    "users.read",
    "users.manage",
    "roles.read",
    "roles.manage",
    "activities.read.all",
    "activities.read.own",
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
