const permissionLabels: Readonly<Record<string,string>> = {
    "roles.read":"View Roles",
    "roles.manage":"Manage Roles",
    "users.read":"View Users",
    "users.manage":"Manage Users",
    "leads.read.all":"View All Leads",
    "leads.read.owned":"View Assigned Leads",
    "leads.create":"Create Leads",
    "leads.update.all":"Update All Leads",
    "leads.update.owned":"Update Assigned Leads",
    "leads.assign":"Assign Leads",
    "activities.read.all":"View All Activities",
    "activities.read.own":"View Own Activities",
    "analytics.read":"View Analytics",
    "import_leads":"Import Leads"
};

export function formatPermission(permissionKey:string):string {
    const label=permissionLabels[permissionKey];
    if(label) return label;

    const readable=permissionKey
        .split(".")
        .flatMap((part)=>part.split(/[_-]+/))
        .filter(Boolean)
        .map((word)=>word.charAt(0).toUpperCase()+word.slice(1).toLowerCase())
        .join(" ");

    return readable || "Permission";
}
