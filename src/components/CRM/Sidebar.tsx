"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,ContactRound,LayoutDashboard,Menu,Settings,ShieldCheck,Upload,
    UserRoundCheck,UsersRound,X,type LucideIcon
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import { getSidebarLabel } from "@/lib/sidebarConfig";
import { useCRMUser } from "./CRMUserContext";
import NotificationBell from "./NotificationBell";

interface NavigationItem {
    label:string;
    href:string;
    icon:LucideIcon;
    permission?:Permission;
    adminOnly?:boolean;
    exact?:boolean;
}

const navigation:NavigationItem[] = [
    { label:"Dashboard",href:"/dashboard",icon:LayoutDashboard,exact:true },
    { label:"Leads",href:"/dashboard/leads",icon:ContactRound },
    { label:"My Leads",href:"/dashboard/my-leads",icon:UserRoundCheck },
    { label:"My Performance",href:"/dashboard/my-performance",icon:Activity },
    { label:"Activities",href:"/dashboard/activities",icon:Activity,permission:"activities.read.all" },
    { label:"Users",href:"/dashboard/users",icon:UsersRound,permission:"users.read" },
    { label:"Roles",href:"/dashboard/roles",icon:ShieldCheck,permission:"roles.read" },
    { label:"Import Leads",href:"/admin/import-leads",icon:Upload,permission:"import_leads",adminOnly:true },
    { label:"Settings",href:"/dashboard/settings",icon:Settings }
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen,setMobileOpen] = useState(false);
    const { displayName,roleId,roleName,loading,hasPermission } = useCRMUser();
    const visibleItems = navigation.filter((item)=>(!item.adminOnly || roleId === "admin") && (!item.permission || hasPermission(item.permission)));

    const navigationContent = (
        <>
            <div className="border-b border-slate-200 px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">W</div>
                    <div className="min-w-0"><p className="truncate font-bold text-slate-900">WiseMedBilling</p><p className="text-xs text-slate-500">CRM Workspace</p></div>
                </div>
            </div>

            <nav aria-label="CRM navigation" className="flex-1 space-y-1 px-3 py-5">
                {visibleItems.map((item)=>{
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={()=>setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                    ><Icon size={19}/>{getSidebarLabel(item.label,item.href,roleId,roleName)}</Link>;
                })}
            </nav>

            <div className="border-t border-slate-200 px-4 py-4">
                <div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{loading ? "Loading profile..." : displayName || "CRM User"}</p>{!loading && roleName && <p className="mt-1 truncate text-xs text-slate-500">{roleName}</p>}</div><NotificationBell/></div>
            </div>
        </>
    );

    return <>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">{navigationContent}</aside>

        <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">W</div><span className="font-bold text-slate-900">WiseMedBilling CRM</span></div>
            <button type="button" onClick={()=>setMobileOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileOpen} className="rounded-xl border border-slate-200 p-2 text-slate-700"><Menu size={22}/></button>
        </div>

        {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close navigation menu" onClick={()=>setMobileOpen(false)} className="absolute inset-0 bg-black/40"/>
            <aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">
                <button type="button" onClick={()=>setMobileOpen(false)} aria-label="Close navigation menu" className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button>
                {navigationContent}
            </aside>
        </div>}
    </>;
}
