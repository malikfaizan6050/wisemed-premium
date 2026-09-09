import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requirePermission } from "@/lib/apiAuth";
import { calculateLeadScore,getLeadPriority } from "@/lib/leadScoring";
import { normalizeEmail,normalizePhone } from "@/lib/leadDuplicateDetection";
import { validateImportRecord } from "@/lib/crmImport";
import type { DuplicateStrategy,ImportHistoryEntry,ImportLeadRecord,ImportRowAnalysis } from "@/types/crm-import";

const MAX_IMPORT_ROWS=2000;

function normalizeOrganization(value:string):string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]/g,"");
}

function numericValue(value:string|number):number {
    const parsed=Number(String(value).replace(/[$,\s]/g,""));
    return Number.isFinite(parsed)?parsed:0;
}

function sanitizeRecord(value:Record<string,unknown>):ImportLeadRecord {
    const text=(field:string)=>typeof value[field]==="string"||typeof value[field]==="number"?String(value[field]).trim():"";
    return {
        firstName:text("firstName"),lastName:text("lastName"),email:text("email"),phone:text("phone"),organization:text("organization"),specialty:text("specialty"),
        monthlyClaims:text("monthlyClaims"),monthlyCollections:text("monthlyCollections")
    };
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

async function loadDuplicateIndex(){
    const snapshot=await db.collection("crm_leads").select("email","emailNormalized","phone","phoneNormalized","organization","organizationNormalized").get();
    const email=new Map<string,string>();
    const phone=new Map<string,string>();
    const organization=new Map<string,string>();
    for(const document of snapshot.docs){
        const data=document.data();
        const emailKey=typeof data.emailNormalized==="string"?data.emailNormalized:normalizeEmail(typeof data.email==="string"?data.email:"");
        const phoneKey=typeof data.phoneNormalized==="string"?data.phoneNormalized:normalizePhone(typeof data.phone==="string"?data.phone:"");
        const organizationKey=typeof data.organizationNormalized==="string"?data.organizationNormalized:normalizeOrganization(typeof data.organization==="string"?data.organization:"");
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
        if(emailKey&&index.email.has(emailKey)) matches.set("email",index.email.get(emailKey)!);
        if(phoneKey&&index.phone.has(phoneKey)) matches.set("phone",index.phone.get(phoneKey)!);
        if(organizationKey&&index.organization.has(organizationKey)) matches.set("organization",index.organization.get(organizationKey)!);
        const initialDuplicateId=matches.values().next().value as string|undefined;
        if(!initialDuplicateId&&errors.length===0){
            const temporaryId=`row:${rowIndex}`;
            if(emailKey&&index.email.has(emailKey)) matches.set("email",index.email.get(emailKey)!);
            if(phoneKey&&index.phone.has(phoneKey)) matches.set("phone",index.phone.get(phoneKey)!);
            if(organizationKey&&index.organization.has(organizationKey)) matches.set("organization",index.organization.get(organizationKey)!);
            if(emailKey) index.email.set(emailKey,temporaryId);
            if(phoneKey) index.phone.set(phoneKey,temporaryId);
            if(organizationKey) index.organization.set(organizationKey,temporaryId);
        }
        const matchedIds=new Set(matches.values());
        if(Array.from(matchedIds).filter((id)=>!id.startsWith("row:")).length>1) errors.push("Row matches multiple existing leads");
        const resolvedId=initialDuplicateId??(matches.values().next().value as string|undefined);
        return { index:rowIndex,valid:errors.length===0,errors,duplicate:Boolean(resolvedId),duplicateId:resolvedId?.startsWith("row:")?null:resolvedId??null,matchingFields:Array.from(matches.keys()) };
    });
}

function storedLead(record:ImportLeadRecord,userId:string){
    const monthlyClaims=numericValue(record.monthlyClaims);
    const monthlyCollections=numericValue(record.monthlyCollections);
    const base={
        firstName:record.firstName.trim(),lastName:record.lastName.trim(),email:record.email.trim(),phone:record.phone.trim(),
        organization:record.organization.trim(),specialty:record.specialty.trim(),monthlyClaims,claimsVolume:monthlyClaims,
        monthlyCollections,estimatedRevenue:monthlyCollections,status:"new_inquiry",source:"import",createdBy:userId,createdById:userId,
        assignedTo:null,ownerId:null,ownerSnapshot:null,assignedById:null,assignedAt:null,activity:[],notes:"",nextAction:"Review imported provider lead",
        emailNormalized:normalizeEmail(record.email),phoneNormalized:normalizePhone(record.phone),organizationNormalized:normalizeOrganization(record.organization)
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
                writes.push(writer.update(db.collection("crm_leads").doc(row.duplicateId),{
                    firstName:lead.firstName,lastName:lead.lastName,email:lead.email,phone:lead.phone,organization:lead.organization,specialty:lead.specialty,
                    monthlyClaims:lead.monthlyClaims,claimsVolume:lead.claimsVolume,monthlyCollections:lead.monthlyCollections,estimatedRevenue:lead.estimatedRevenue,
                    emailNormalized:lead.emailNormalized,phoneNormalized:lead.phoneNormalized,organizationNormalized:lead.organizationNormalized,
                    leadScore:lead.leadScore,opportunityScore:lead.opportunityScore,priority:lead.priority,source:"import",updatedAt:FieldValue.serverTimestamp(),updatedById:authorization.user.uid
                }));
            }else if(row.duplicate&&strategy==="update"){
                skippedDuplicates++;continue;
            }else{
                writes.push(writer.create(db.collection("crm_leads").doc(),{ ...lead,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp() }));
            }
        }
        const results=await Promise.allSettled(writes);
        await writer.close();
        const successfulImports=results.filter((result)=>result.status==="fulfilled").length;
        const writeFailures=results.length-successfulImports;
        const invalidRecords=records.length-valid;
        const failedImports=invalidRecords+writeFailures+skippedDuplicates;
        const historyReference=await db.collection("import_history").add({
            fileName,importedBy:authorization.user.uid,importedByName:authorization.user.displayName,totalRecords:records.length,
            successfulImports,failedImports,duplicateRecords:duplicates,duplicateStrategy:strategy,createdAt:FieldValue.serverTimestamp()
        });
        return NextResponse.json({ success:true,historyId:historyReference.id,analysis,summary:{ total:records.length,successfulImports,failedImports,duplicates } });
    }catch(error){
        console.error("Lead import failed",error);
        return NextResponse.json({ error:"Unable to process lead import" },{ status:500 });
    }
}
