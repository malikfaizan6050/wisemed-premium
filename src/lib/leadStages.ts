// The single source of truth for the sales pipeline.
//
// These stages previously existed in four diverging copies (types/crm.ts,
// types/lead.ts, LeadDrawer, PipelineOverview, DashboardFilters). The copies
// disagreed: `contract_review` was missing from the pipeline board, so any lead
// sitting in it was invisible on every screen, and types/lead.ts carried two
// stages (`qualified`, `converted`) that no screen has ever rendered.
//
// Add or rename a stage here and every screen follows. Do not re-declare this
// list anywhere else.

export interface LeadStage {
    key:string;
    /** Full label, used in dropdowns and detail views. */
    label:string;
    /** Abbreviated label for the pipeline board, where space is tight. */
    shortLabel:string;
    /** Tailwind colour family used by the board and status pills. */
    color:string;
    /** Stages that close a lead out of the active pipeline. */
    terminal?:boolean;
}

export const LEAD_STAGES:readonly LeadStage[] = [
    { key:"new_inquiry",label:"New Inquiry",shortLabel:"New Inquiry",color:"blue" },
    { key:"initial_review",label:"Initial Review",shortLabel:"Initial Review",color:"indigo" },
    { key:"discovery_scheduled",label:"Discovery Scheduled",shortLabel:"Discovery",color:"purple" },
    { key:"requirements_collected",label:"Requirements Collected",shortLabel:"Requirements",color:"cyan" },
    { key:"proposal_sent",label:"Proposal Sent",shortLabel:"Proposal",color:"orange" },
    { key:"contract_review",label:"Contract Review",shortLabel:"Contract",color:"amber" },
    { key:"onboarding",label:"Onboarding",shortLabel:"Onboarding",color:"green" },
    { key:"active_client",label:"Active Client",shortLabel:"Active Client",color:"emerald",terminal:true },
    { key:"lost",label:"Lost Opportunity",shortLabel:"Lost",color:"red",terminal:true }
] as const;

export type LeadStageKey = typeof LEAD_STAGES[number]["key"];

export const DEFAULT_LEAD_STAGE = "new_inquiry";

const stagesByKey = new Map(LEAD_STAGES.map((stage)=>[stage.key,stage]));

export const LEAD_STAGE_KEYS:readonly string[] = LEAD_STAGES.map((stage)=>stage.key);

export function isLeadStage(value:unknown):value is LeadStageKey {
    return typeof value === "string" && stagesByKey.has(value);
}

export function getLeadStage(value:unknown):LeadStage {
    return (typeof value === "string" ? stagesByKey.get(value) : undefined)
        ?? stagesByKey.get(DEFAULT_LEAD_STAGE)!;
}

/**
 * Labels an unknown stage instead of hiding it. Legacy records carrying a
 * retired stage stay visible and obviously wrong, rather than silently
 * vanishing from every screen the way `contract_review` used to.
 */
export function getLeadStageLabel(value:unknown):string {
    if(isLeadStage(value)) return stagesByKey.get(value)!.label;
    const raw = typeof value === "string" ? value.trim() : "";
    if(!raw) return getLeadStage(DEFAULT_LEAD_STAGE).label;
    return `${raw.replaceAll("_"," ").replace(/\b\w/g,(character)=>character.toUpperCase())} (retired)`;
}

/** Stage options for dropdowns and filters, as [value,label] pairs. */
export const LEAD_STAGE_OPTIONS:readonly (readonly [string,string])[] =
    LEAD_STAGES.map((stage)=>[stage.key,stage.label] as const);
