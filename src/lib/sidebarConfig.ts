type SidebarRole="admin"|"sales_manager"|"salesperson"|"default";

const performanceLabels:Readonly<Record<SidebarRole,string>> = {
    admin:"Performance",
    sales_manager:"Team Performance",
    salesperson:"My Performance",
    default:"My Performance"
};

// The my-leads page titles itself by role, but the sidebar always said
// "My Leads", so a manager saw one name in the menu and another on the page.
const myLeadsLabels:Readonly<Record<SidebarRole,string>> = {
    admin:"Company Leads",
    sales_manager:"Team Leads",
    salesperson:"My Leads",
    default:"My Leads"
};

function normalizeRole(value:string):string {
    return value.trim().toLowerCase().replace(/[\s-]+/g,"_");
}

function resolveSidebarRole(roleId:string,roleName:string):SidebarRole {
    const identities=[roleId,roleName].map(normalizeRole);
    if(identities.some((role)=>role === "admin" || role === "administrator" || role === "super_admin")) return "admin";
    if(identities.some((role)=>role === "sales_manager" || role === "manager")) return "sales_manager";
    if(identities.some((role)=>role === "sales" || role === "salesperson" || role === "sales_person")) return "salesperson";
    return "default";
}

export function getSidebarLabel(defaultLabel:string,href:string,roleId:string,roleName:string):string {
    const role=resolveSidebarRole(roleId,roleName);
    if(href === "/dashboard/my-performance") return performanceLabels[role];
    if(href === "/dashboard/my-leads") return myLeadsLabels[role];
    return defaultLabel;
}
