import { CRMUserProvider } from "@/components/CRM/CRMUserContext";
import DashboardRouteGuard from "@/components/CRM/DashboardRouteGuard";
import Sidebar from "@/components/CRM/Sidebar";

export default function DashboardLayout({ children }:{ children:React.ReactNode }) {
    return <CRMUserProvider>
        <Sidebar/>
        <div className="min-h-screen pt-16 lg:pl-64 lg:pt-0"><DashboardRouteGuard>{children}</DashboardRouteGuard></div>
    </CRMUserProvider>;
}
