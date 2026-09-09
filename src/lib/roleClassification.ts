import type { Permission,Role } from "@/types/crm-auth";

type RoleIdentity=Pick<Role,"id"|"name"|"isSystemRole">&{permissions?:readonly Permission[]};

export function isAdmin(role:RoleIdentity|string|null|undefined){
    const id=typeof role==="string"?role:role?.id;
    return id==="admin";
}

export function isManager(role:RoleIdentity|string|null|undefined){
    const id=typeof role==="string"?role:role?.id;
    return id==="sales_manager";
}

export function isSalesUser(role:RoleIdentity|null|undefined){
    if(!role||isAdmin(role)) return false;
    if(role.id==="sales"||isManager(role)) return true;
    if(role.isSystemRole) return false;
    return Boolean(role.permissions?.some((permission)=>permission==="leads.read.owned"||permission==="leads.update.owned"));
}
