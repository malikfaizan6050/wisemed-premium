"use client";

import { useEffect } from "react";
import { usePathname,useRouter } from "next/navigation";
import { getCRMRoutePolicy } from "@/lib/crmRoutePermissions";
import { useCRMUser } from "./CRMUserContext";

export default function DashboardRouteGuard({ children }:{ children:React.ReactNode }) {
    const pathname=usePathname();
    const router=useRouter();
    const { loading,roleId,hasPermission,reportAccessDenied }=useCRMUser();
    const routePolicy=getCRMRoutePolicy(pathname);
    const denied=!loading && routePolicy !== null && (
        !roleId ||
        (routePolicy.adminOnly === true && roleId !== "admin") ||
        (routePolicy.permission !== undefined && !hasPermission(routePolicy.permission))
    );

    useEffect(()=>{
        if(!denied) return;
        reportAccessDenied();
        router.replace("/dashboard");
    },[denied,reportAccessDenied,router]);

    if(loading && routePolicy) return <div className="p-8 text-slate-600">Checking permissions...</div>;
    if(denied) return <div className="p-8 text-slate-600">Redirecting...</div>;
    return children;
}
