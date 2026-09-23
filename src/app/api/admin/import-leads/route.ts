import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requirePermission } from "@/lib/apiAuth";
import { calculateLeadScore,getLeadPriority } from "@/lib/leadScoring";
import { normalizeEmail,normalizeOrganization,normalizePhone } from "@/lib/leadDuplicateDetection";
import { emptyImportRecord,importLeadFields,splitFullName,validateImportRecord } from "@/lib/crmImport";
import type { DuplicateStrategy,ImportHistoryEntry,ImportLeadRecord,ImportRowAnalysis } from "@/types/crm-import";

const MAX_IMPORT_ROWS=2000;

function numericValue(value:string|number):number {
    const parsed=Number(String(value).replace(/[$,\s]/g,""));
    return Number.isFinite(parsed)?parsed:0;
}

function sanitizeRecord(value:Record<string,unknown>):ImportLeadRecord {
    const text=(field:string)=>typeof value[field]==="string"||typeof value[field]==="number"?String(value[field]).trim():"";
    // Built from the field list rather than written out, so adding a mappable
    // column in one place is enough.
    const record=emptyImportRecord();
    for(const { value:field } of importLeadFields) record[field]=text(field);
    return record;
}

/**
 * Resolves the provider's name from whichever columns were mapped.
 *
 * A calling sheet usually has one combined "Dr Name" column; an exported CRM
 * usually has two. Explicit first/last columns win when present, and the
 * combined column is split only to fill what they leave empty.
 */
function resolveName(record:ImportLeadRecord) {
    const split=splitFullName(record.fullName ?? "");
    const firstName=record.firstName.trim()||split.firstName;
    const lastName=record.lastName.trim()||split.lastName;
    return { firstName,lastName };
}

async function authorize(request:Request){
    const authorization=await requirePermission(request,"import_leads");
    if(!authorization.ok) return authorization;
    if(authorization.user.role.id!=="admin") return {
        ok:false as const,
        response:NextResponse.json({ error:"Access Denied." },{ status:403 })
    };
    return authorization;
}

/**
 * Builds the comparison keys for every stored lead.
 *
 * Keys are always recomputed from the raw fields rather than read from the
 * stored `*Normalized` ones. Those were written by two different algorithms
 * over the life of this collection, so a stored key cannot be assumed to be in
 * the format the current normaliser produces.
 */
async function loadDuplicateIndex(){
    const snapshot=await db.collection("crm_leads").select("email","phone","organization").get();
    const email=new Map<string,string>();
    const phone=new Map<string,string>();
    const organization=new Map<string,string>();
    for(const document of snapshot.docs){
        const data=document.data();
        const emailKey=normalizeEmail(typeof data.email==="string"?data.email:"");
        const phoneKey=normalizePhone(typeof data.phone==="string"?data.phone:"");
        const organizationKey=normalizeOrganization(typeof data.organization==="string"?data.organization:"");
        if(emailKey&&!email.has(emailKey)) email.set(emailKey,document.id);
        if(phoneKey&&!phone.has(phoneKey)) phone.set(phoneKey,document.id);
        if(organizationKey&&!organization.has(organizationKey)) organization.set(organizationKey,document.id);
    }
    return { email,phone,organization };
}

async function analyze(records:ImportLeadRecord[]):Promise<ImportRowAnalysis[]> {
    const index=await loadDuplicateIndex();
    return records.map((record,rowIndex)=>{
        const errors=validateImportRecord(record);
        const matches=new Map<string,string>();
        const emailKey=normalizeEmail(record.email);
        const phoneKey=normalizePhone(record.phone);
        const organizationKey=normalizeOrganization(record.organization);
        // Only the contact details identify a person. The practice name is
        // reported when it matches as well, but it never makes a row a
        // duplicate on its own: every provider at one clinic shares it, and
        // with the "update existing" strategy that turned an import of a
        // practice's staff into each row overwriting the one before it.
        if(emailKey&&index.email.has(emailKey)) matches.set("email",index.email.get(emailKey)!);
        if(phoneKey&&index.phone.has(phoneKey)) matches.set("phone",index.phone.get(phoneKey)!);
        const duplicateId=matches.values().next().value as string|undefined;
        if(duplicateId&&organizationKey&&index.organization.get(organizationKey)===duplicateId){
            matches.set("organization",duplicateId);
        }
        if(!duplicateId&&errors.length===0){
            // Claims these keys for this row, so a second row carrying the same
            // contact details inside one file is caught as a duplicate too.
            const temporaryId=`row:${rowIndex}`;
            if(emailKey) index.email.set(emailKey,temporaryId);
            if(phoneKey) index.phone.set(phoneKey,temporaryId);
            if(organizationKey&&!index.organization.has(organizationKey)) index.organization.set(organizationKey,temporaryId);
        }
        const matchedIds=new Set(Array.from(matches.values()).filter((id)=>!id.startsWith("row:")));
        if(matchedIds.size>1) errors.push("Row matches multiple existing leads");
        return { index:rowIndex,valid:errors.length===0,errors,duplicate:Boolean(duplicateId),duplicateId:duplicateId?.startsWith("row:")?null:duplicateId??null,matchingFields:Array.from(matches.keys()) };
    });
}

function storedLead(record:ImportLeadRecord,userId:string){
    const monthlyClaims=numericValue(record.monthlyClaims);
    const monthlyCollections=numericValue(record.monthlyCollections);
    const { firstName,lastName }=resolveName(record);
    const base={
        firstName,lastName,email:record.email.trim(),phone:record.phone.trim(),
        organization:record.organization.trim(),specialty:record.specialty.trim(),monthlyClaims,claimsVolume:monthlyClaims,
        monthlyCollections,estimatedRevenue:monthlyCollections,status:"new_inquiry",source:"import",createdBy:userId,createdById:userId,
        assignedTo:null,ownerId:null,ownerSnapshot:null,assignedById:null,assignedAt:null,activity:[],
        notes:record.notes.trim(),
        nextAction:record.nextAction.trim()||"Review imported provider lead",
        dueDate:null,

        // Practice and contact routes beyond the primary line.
        practiceLocation:record.practiceLocation.trim(),
        alternatePhone:record.alternatePhone.trim(),
        fax:record.fax.trim(),
        website:record.website.trim(),
        conversationSummary:record.conversationSummary.trim(),

        // Call-desk history. Dates and times are stored exactly as the sheet
        // wrote them: a spreadsheet exports them as locale-formatted text, so
        // "05/06/2026" is May or June depending on where the file was made.
        // Guessing would silently corrupt the history, so it is kept verbatim.
        callStatus:record.callStatus.trim(),
        callDate:record.callDate.trim(),
        callTime:record.callTime.trim(),
        callRemarks:record.callRemarks.trim(),
        receptionistName:record.receptionistName.trim(),
        officeManagerName:record.officeManagerName.trim(),
        authorization:record.authorization.trim(),
        faxConfirmed:record.faxConfirmed.trim(),
        willDoctorJoin:record.willDoctorJoin.trim(),
        sourceReference:record.sourceReference.trim(),

        emailNormalized:normalizeEmail(record.email),phoneNormalized:normalizePhone(record.phone),
        npiNormalized:"",organizationNormalized:normalizeOrganization(record.organization)
    };
    const leadScore=calculateLeadScore(base);
    return { ...base,leadScore,opportunityScore:leadScore,priority:getLeadPriority(leadScore) };
}

export async function GET(request:Request){
    const authorization=await authorize(request);
    if(!authorization.ok) return authorization.response;
    const snapshot=await db.collection("import_history").orderBy("createdAt","desc").limit(50).get();
    const history:ImportHistoryEntry[]=snapshot.docs.map((document)=>{
        const data=document.data();
        return {
            id:document.id,fileName:String(data.fileName??""),importedBy:String(data.importedBy??""),importedByName:String(data.importedByName??""),
            totalRecords:Number(data.totalRecords??0),successfulImports:Number(data.successfulImports??0),failedImports:Number(data.failedImports??0),duplicateRecords:Number(data.duplicateRecords??0),
            createdAt:data.createdAt?.toDate?.().toISOString?.()??null
        };
    });
    return NextResponse.json({ history });
}

export async function POST(request:Request){
    const authorization=await authorize(request);
    if(!authorization.ok) return authorization.response;
    try{
        const body:unknown=await request.json();
        if(!body||typeof body!=="object"||Array.isArray(body)) return NextResponse.json({ error:"Invalid import request" },{ status:400 });
        const input=body as Record<string,unknown>;
        const rawRecords=Array.isArray(input.records)?input.records:[];
        const fileName=typeof input.fileName==="string"?input.fileName.trim().slice(0,255):"";
        const mode=input.mode==="import"?"import":"preview";
        const strategy:DuplicateStrategy=input.duplicateStrategy==="update"||input.duplicateStrategy==="import"?input.duplicateStrategy:"skip";
        if(!fileName||rawRecords.length===0||rawRecords.length>MAX_IMPORT_ROWS) return NextResponse.json({ error:`Provide a file name and 1-${MAX_IMPORT_ROWS} records` },{ status:400 });
        if(!rawRecords.every((record)=>record&&typeof record==="object"&&!Array.isArray(record))) return NextResponse.json({ error:"Invalid import rows" },{ status:400 });
        const records=rawRecords.map((record)=>sanitizeRecord(record as Record<string,unknown>));

        const analysis=await analyze(records);
        const valid=analysis.filter((row)=>row.valid).length;
        const duplicates=analysis.filter((row)=>row.duplicate).length;
        if(mode==="preview") return NextResponse.json({ analysis,summary:{ total:records.length,valid,errors:records.length-valid,duplicates } });

        const writer=db.bulkWriter();
        const writes:Promise<unknown>[]=[];
        let skippedDuplicates=0;
        for(const row of analysis){
            if(!row.valid) continue;
            if(row.duplicate&&strategy==="skip"){ skippedDuplicates++;continue; }
            const lead=storedLead(records[row.index],authorization.user.uid);
            if(row.duplicate&&strategy==="update"&&row.duplicateId){
                // Everything the importer can supply is refreshed. Ownership,
                // pipeline status and created-at are deliberately absent: an
                // update must not reset a lead someone is already working.
                const { status:_status,source:_source,createdBy:_createdBy,createdById:_createdById,
                    assignedTo:_assignedTo,ownerId:_ownerId,ownerSnapshot:_ownerSnapshot,assignedById:_assignedById,
                    assignedAt:_assignedAt,activity:_activity,dueDate:_dueDate,...refreshable }=lead;
                void _status;void _source;void _createdBy;void _createdById;void _assignedTo;void _ownerId;
                void _ownerSnapshot;void _assignedById;void _assignedAt;void _activity;void _dueDate;
                writes.push(writer.update(db.collection("crm_leads").doc(row.duplicateId),{
                    ...refreshable,source:"import",updatedAt:FieldValue.serverTimestamp(),updatedById:authorization.user.uid
                }));
            }else if(row.duplicate&&strategy==="update"){
                skippedDuplicates++;continue;
            }else{
                writes.push(writer.create(db.collection("crm_leads").doc(),{ ...lead,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp() }));
            }
        }
        // Closed first: BulkWriter only settles the per-write promises once the
        // batches holding them have actually been flushed.
        await writer.close();
        const results=await Promise.allSettled(writes);
        const successfulImports=results.filter((result)=>result.status==="fulfilled").length;
        const writeFailures=results.length-successfulImports;
        const invalidRecords=records.length-valid;
        // Skipped duplicates are reported separately; counting them as
        // failures told an administrator that rows had failed when the import
        // had done exactly what the chosen strategy asked for.
        const failedImports=invalidRecords+writeFailures;
        const historyReference=await db.collection("import_history").add({
            fileName,importedBy:authorization.user.uid,importedByName:authorization.user.displayName,totalRecords:records.length,
            successfulImports,failedImports,skippedDuplicates,duplicateRecords:duplicates,duplicateStrategy:strategy,createdAt:FieldValue.serverTimestamp()
        });
        return NextResponse.json({ success:true,historyId:historyReference.id,analysis,summary:{ total:records.length,successfulImports,failedImports,skippedDuplicates,duplicates } });
    }catch(error){
        console.error("Lead import failed",error);
        return NextResponse.json({ error:"Unable to process lead import" },{ status:500 });
    }
}
