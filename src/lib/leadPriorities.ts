// The priority values getLeadPriority() produces, shared so the API, the
// filters and the drawer's dropdown cannot drift apart.
export const LEAD_PRIORITIES = ["critical","high","standard"] as const;

export const LEAD_PRIORITY_OPTIONS:readonly (readonly [string,string])[] = [
    ["critical","Critical"],
    ["high","High"],
    ["standard","Standard"]
] as const;
