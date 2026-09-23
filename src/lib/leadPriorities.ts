// The priority values getLeadPriority() produces, shared so the API, the
// filters and the drawer's dropdown cannot drift apart.
export const LEAD_PRIORITIES = ["critical","high","standard"] as const;

export type LeadPriority = typeof LEAD_PRIORITIES[number];

export const LEAD_PRIORITY_OPTIONS:readonly (readonly [string,string])[] = [
    ["critical","Critical"],
    ["high","High"],
    ["standard","Standard"]
] as const;

export function isLeadPriority(value:unknown):value is LeadPriority {
    return typeof value === "string" && (LEAD_PRIORITIES as readonly string[]).includes(value);
}
