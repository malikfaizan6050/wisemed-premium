import type { Permission } from "@/lib/permissions";

interface ProtectedCRMRoute {
    path:string;
    permission?:Permission;
    adminOnly?:boolean;
}

const protectedCRMRoutes:readonly ProtectedCRMRoute[] = [
    { path:"/dashboard/users",permission:"users.read" },
    { path:"/dashboard/roles",permission:"roles.read" },
    { path:"/dashboard/settings" },
    { path:"/admin/import-leads",permission:"import_leads",adminOnly:true }
];

export function getCRMRoutePolicy(pathname:string):ProtectedCRMRoute | null {
    return protectedCRMRoutes.find(({ path })=>pathname === path || pathname.startsWith(`${path}/`)) ?? null;
}
