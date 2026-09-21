import { NextRequest,NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { recordActivity } from "@/services/activityService";
import { enforceRateLimit } from "@/lib/rateLimit";
import { listLeadsForOwners } from "@/repositories/leadRepository";
import { getLeadVisibilityScope } from "@/services/leadVisibilityService";
import { getLeadStageLabel } from "@/lib/leadStages";
import type { Lead } from "@/types/crm";

const columns = [
    "Provider",
    "Organization",
    "Email",
    "Phone",
    "Status",
    "Priority",
    "Specialty"
] as const;

/**
 * Quotes a CSV cell and neutralises spreadsheet formula injection: a value
 * starting with =, +, - or @ is executed by Excel when the file is opened.
 */
function escapeCell(value:unknown) {
    const text = String(value ?? "");
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"','""')}"`;
}

function toCsv(leads:Lead[]) {
    const rows = leads.map((lead)=>[
        `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim(),
        lead.organization,
        lead.email,
        lead.phone,
        getLeadStageLabel(lead.status),
        lead.priority,
        lead.specialty
    ]);
    return [columns,...rows].map((row)=>row.map(escapeCell).join(",")).join("\n");
}

/**
 * Exporting leads used to happen entirely in the browser, so it could be
 * neither restricted nor recorded. It now runs here: the `leads.export`
 * permission gates it, the caller's visibility scope limits which rows they
 * can take, and every export is written to the audit trail with a row count.
 */
export async function POST(request:NextRequest) {
    const limited = enforceRateLimit(request,"lead.export",10);
    if(limited) return limited;

    const authResult = await requirePermission(request,"leads.export");
    if(!authResult.ok) return authResult.response;
    const user = authResult.user;

    try {
        const body:unknown = await request.json().catch(()=>({}));
        const data = body && typeof body === "object" && !Array.isArray(body)
            ? body as Record<string,unknown>
            : {};
        const requestedIds = Array.isArray(data.leadIds)
            ? data.leadIds.filter((id):id is string=>typeof id === "string")
            : null;
        const scopeLabel = typeof data.scope === "string" ? data.scope : "all";

        // Always re-read through the caller's own visibility scope, so the
        // export cannot widen what they are allowed to see.
        const scope = await getLeadVisibilityScope(user);
        const visibleLeads = await listLeadsForOwners(scope.kind === "all" ? null : scope.ownerIds,2000);
        const leads = requestedIds && requestedIds.length > 0
            ? visibleLeads.filter((lead)=>lead.id && requestedIds.includes(lead.id))
            : visibleLeads;

        if(leads.length === 0){
            return NextResponse.json({ error:"No leads available for this export" },{ status:400 });
        }

        await recordActivity({
            actorId:user.uid,
            actorType:user.authType === "service" ? "integration" : "user",
            action:"lead.exported",
            entityType:"lead",
            entityId:"",
            metadata:{
                rowCount:leads.length,
                scope:scopeLabel,
                exportedAt:new Date().toISOString()
            }
        }).catch(()=>undefined);

        const stamp = new Date().toISOString().slice(0,10);
        return new NextResponse(toCsv(leads),{
            status:200,
            headers:{
                "Content-Type":"text/csv;charset=utf-8",
                "Content-Disposition":`attachment; filename="leads-${scopeLabel}-${stamp}.csv"`,
                "Cache-Control":"no-store"
            }
        });
    }
    catch {
        console.error("Lead export failed");
        return NextResponse.json({ error:"Failed to export leads" },{ status:500 });
    }
}
