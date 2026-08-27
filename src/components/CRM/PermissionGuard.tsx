"use client";

import type { ReactNode } from "react";
import type { Permission } from "@/lib/permissions";
import { useCRMUser } from "./CRMUserContext";

export default function PermissionGuard({ permission,children }:{ permission:Permission; children:ReactNode }) {
    const { loading,hasPermission } = useCRMUser();
    if(loading) return <div className="p-8 text-slate-600">Checking permissions...</div>;
    if(!hasPermission(permission)) return <div role="alert" className="m-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">You do not have permission to access this section.</div>;
    return children;
}
