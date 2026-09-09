"use client";

import { useCallback,useEffect,useMemo,useState } from "react";
import { Download,FileSpreadsheet,Upload } from "lucide-react";
import Papa from "papaparse";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { emptyImportRecord,importLeadFields,suggestImportField } from "@/lib/crmImport";
import CRMTable,{ type CRMTableColumn } from "@/components/CRM/CRMTable";
import FeedbackMessage from "@/components/CRM/FeedbackMessage";
import type { DuplicateStrategy,ImportHistoryEntry,ImportLeadField,ImportLeadRecord,ImportRowAnalysis } from "@/types/crm-import";

type Step="upload"|"mapping"|"preview"|"complete";
type SourceRow=Record<string,unknown>;

export default function ImportLeadsPage(){
    const [step,setStep]=useState<Step>("upload");
    const [fileName,setFileName]=useState("");
    const [headers,setHeaders]=useState<string[]>([]);
    const [rows,setRows]=useState<SourceRow[]>([]);
    const [mapping,setMapping]=useState<Record<string,ImportLeadField|"">>({});
    const [records,setRecords]=useState<ImportLeadRecord[]>([]);
    const [analysis,setAnalysis]=useState<ImportRowAnalysis[]>([]);
    const [strategy,setStrategy]=useState<DuplicateStrategy>("skip");
    const [history,setHistory]=useState<ImportHistoryEntry[]>([]);
    const [loading,setLoading]=useState(false);
    const [message,setMessage]=useState<{ text:string;tone:"error"|"success" }>({ text:"",tone:"error" });
    const summary=useMemo(()=>({
        total:analysis.length,
        valid:analysis.filter((row)=>row.valid).length,
        errors:analysis.filter((row)=>!row.valid).length,
        duplicates:analysis.filter((row)=>row.duplicate).length
    }),[analysis]);

    const loadHistory=useCallback(async()=>{
        const response=await authenticatedFetch("/api/admin/import-leads");
        const result:unknown=await response.json().catch(()=>null);
        if(response.ok&&result&&typeof result==="object"&&"history" in result&&Array.isArray(result.history)) setHistory(result.history as ImportHistoryEntry[]);
    },[]);
    useEffect(()=>{
        let active=true;
        authenticatedFetch("/api/admin/import-leads")
            .then(async(response)=>({ response,result:await response.json().catch(()=>null) as unknown }))
            .then(({ response,result })=>{
                if(active&&response.ok&&result&&typeof result==="object"&&"history" in result&&Array.isArray(result.history)) setHistory(result.history as ImportHistoryEntry[]);
            })
            .catch(()=>undefined);
        return ()=>{ active=false; };
    },[]);

    const resetImport=()=>{
        setStep("upload");setFileName("");setHeaders([]);setRows([]);setMapping({});setRecords([]);setAnalysis([]);setStrategy("skip");setMessage({ text:"",tone:"error" });
    };

    const acceptRows=(name:string,parsedRows:SourceRow[])=>{
        const cleanRows=parsedRows.filter((row)=>Object.values(row).some((value)=>String(value??"").trim()));
        const discovered=Array.from(new Set(cleanRows.flatMap((row)=>Object.keys(row).map((header)=>header.trim())).filter(Boolean)));
        if(!cleanRows.length||!discovered.length) throw new Error("The selected file does not contain any data rows.");
        setFileName(name);setHeaders(discovered);setRows(cleanRows);
        setMapping(Object.fromEntries(discovered.map((header)=>[header,suggestImportField(header)])));
        setStep("upload");setMessage({ text:"",tone:"error" });
    };

    const parseFile=async(file:File)=>{
        setLoading(true);setMessage({ text:"",tone:"error" });
        try{
            if(file.size>10*1024*1024) throw new Error("Choose a file smaller than 10 MB.");
            const extension=file.name.split(".").pop()?.toLowerCase();
            if(extension==="csv"){
                const text=await file.text();
                const parsed=Papa.parse<SourceRow>(text,{ header:true,skipEmptyLines:"greedy",transformHeader:(header)=>header.trim() });
                if(parsed.errors.length) throw new Error(parsed.errors[0].message);
                acceptRows(file.name,parsed.data);
            }else if(extension==="xlsx"){
                const XLSX=await import("xlsx");
                const workbook=XLSX.read(await file.arrayBuffer(),{ type:"array",cellDates:false });
                const sheet=workbook.Sheets[workbook.SheetNames[0]];
                if(!sheet) throw new Error("The workbook does not contain a worksheet.");
                acceptRows(file.name,XLSX.utils.sheet_to_json<SourceRow>(sheet,{ defval:"",raw:false }));
            }else throw new Error("Choose a .csv or .xlsx file.");
        }catch(error){ setMessage({ text:error instanceof Error?error.message:"Unable to read the selected file.",tone:"error" }); }
        finally{ setLoading(false); }
    };

    const mappedRecords=()=>rows.map((row)=>{
        const record=emptyImportRecord();
        for(const header of headers){
            const field=mapping[header];
            if(!field) continue;
            const value=row[header];
            record[field]=field==="monthlyClaims"||field==="monthlyCollections"?String(value??""):String(value??"").trim();
        }
        return record;
    });

    const preview=async()=>{
        const selectedFields=new Set(Object.values(mapping).filter(Boolean));
        if(!selectedFields.has("firstName")||!selectedFields.has("organization")||(!selectedFields.has("email")&&!selectedFields.has("phone"))){
            setMessage({ text:"Map First Name, Organization, and at least Email or Phone before continuing.",tone:"error" });return;
        }
        const nextRecords=mappedRecords();
        setLoading(true);setMessage({ text:"",tone:"error" });
        try{
            const response=await authenticatedFetch("/api/admin/import-leads",{ method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ mode:"preview",fileName,records:nextRecords }) });
            const result:unknown=await response.json().catch(()=>null);
            if(!response.ok) throw new Error(apiError(result,"Unable to validate import data."));
            const nextAnalysis=result&&typeof result==="object"&&"analysis" in result&&Array.isArray(result.analysis)?result.analysis as ImportRowAnalysis[]:[];
            setRecords(nextRecords);setAnalysis(nextAnalysis);setStep("preview");
        }catch(error){ setMessage({ text:error instanceof Error?error.message:"Unable to validate import data.",tone:"error" }); }
        finally{ setLoading(false); }
    };

    const runImport=async()=>{
        setLoading(true);setMessage({ text:"",tone:"error" });
        try{
            const response=await authenticatedFetch("/api/admin/import-leads",{ method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ mode:"import",fileName,records,duplicateStrategy:strategy }) });
            const result:unknown=await response.json().catch(()=>null);
            if(!response.ok) throw new Error(apiError(result,"Unable to import leads."));
            const imported=result&&typeof result==="object"&&"summary" in result&&result.summary&&typeof result.summary==="object"&&"successfulImports" in result.summary?Number(result.summary.successfulImports):0;
            setStep("complete");setMessage({ text:`Import completed. ${imported} lead${imported===1?"":"s"} imported successfully.`,tone:"success" });
            await loadHistory();
        }catch(error){ setMessage({ text:error instanceof Error?error.message:"Unable to import leads.",tone:"error" }); }
        finally{ setLoading(false); }
    };

    const downloadErrors=()=>{
        const errorRows=analysis.filter((row)=>!row.valid).map((row)=>Object.fromEntries(Object.entries({ "Row":row.index+2,"Errors":row.errors.join("; "),...records[row.index] }).map(([key,value])=>[key,safeSpreadsheetValue(value)])));
        if(!errorRows.length) return;
        downloadCsv(`${fileName.replace(/\.[^.]+$/,"")}-errors.csv`,Papa.unparse(errorRows));
    };

    const historyColumns:CRMTableColumn<ImportHistoryEntry>[]=[
        { key:"file",header:"File Name",render:(item)=><span className="font-semibold text-slate-900">{item.fileName}</span> },
        { key:"records",header:"Records",render:(item)=>item.totalRecords },
        { key:"success",header:"Successful",render:(item)=>item.successfulImports },
        { key:"failed",header:"Failed",render:(item)=>item.failedImports },
        { key:"by",header:"Imported By",render:(item)=>item.importedByName||item.importedBy },
        { key:"date",header:"Date",render:(item)=>item.createdAt?new Date(item.createdAt).toLocaleString():"N/A" }
    ];

    return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-slate-900">Import Leads</h1><p className="mt-1 text-slate-600">Upload CSV or Excel files to create leads in CRM.</p>
        <div className="my-6"><FeedbackMessage message={message.text} tone={message.tone}/></div>

        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
            {step==="upload"&&<><h2 className="text-lg font-bold text-slate-900">Upload File</h2><label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-blue-400"><Upload className="text-blue-600" size={30}/><span className="mt-3 font-semibold text-slate-800">Choose CSV/XLSX File</span><span className="mt-1 text-sm text-slate-500">Supported: .csv and .xlsx · Maximum 2,000 rows</span><input type="file" accept=".csv,.xlsx" className="sr-only" disabled={loading} onChange={(event)=>{ const file=event.target.files?.[0];if(file)void parseFile(file);event.target.value=""; }}/></label>{fileName&&<div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-3"><FileSpreadsheet className="text-blue-600"/><div><p className="font-semibold text-slate-900">{fileName}</p><p className="text-sm text-slate-500">{rows.length} total rows</p></div></div><button type="button" onClick={()=>setStep("mapping")} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Continue</button></div>}</>}

            {step==="mapping"&&<><h2 className="text-lg font-bold text-slate-900">Map Columns</h2><p className="mt-1 text-sm text-slate-500">Match each imported column to the corresponding CRM field.</p><div className="mt-5 grid gap-3">{headers.map((header)=><div key={header} className="grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto_1fr]"><span className="font-semibold text-slate-800">{header}</span><span className="text-slate-400">→</span><select aria-label={`CRM field for ${header}`} value={mapping[header]??""} onChange={(event)=>setMapping((current)=>({ ...current,[header]:event.target.value as ImportLeadField|"" }))} className="rounded-xl border px-3 py-2"><option value="">Do not import</option>{importLeadFields.map((field)=><option key={field.value} value={field.value}>{field.label}</option>)}</select></div>)}</div><div className="mt-6 flex justify-between gap-3"><button type="button" onClick={()=>setStep("upload")} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Back</button><button type="button" disabled={loading} onClick={()=>void preview()} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading?"Validating...":"Continue to Preview"}</button></div></>}

            {(step==="preview"||step==="complete")&&<><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">Data Preview</h2><p className="text-sm text-slate-500">Review validation and duplicate results before importing.</p></div>{step==="complete"&&<button type="button" onClick={resetImport} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Import Another File</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SummaryCard label="Total Records" value={summary.total}/><SummaryCard label="Valid" value={summary.valid}/><SummaryCard label="Errors" value={summary.errors}/><SummaryCard label="Duplicates" value={summary.duplicates}/></div>{summary.errors>0&&<button type="button" onClick={downloadErrors} className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700"><Download size={16}/>Download Error Report</button>}<div className="mt-5 overflow-x-auto rounded-xl border"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["Name","Email","Phone","Organization","Specialty","Status"].map((label)=><th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y">{records.slice(0,25).map((record,index)=>{ const result=analysis[index];return <tr key={index}><td className="px-4 py-3 font-semibold text-slate-900">{`${record.firstName} ${record.lastName}`.trim()}</td><td className="px-4 py-3">{record.email||"—"}</td><td className="px-4 py-3">{record.phone||"—"}</td><td className="px-4 py-3">{record.organization}</td><td className="px-4 py-3">{record.specialty||"—"}</td><td className="px-4 py-3"><RowStatus result={result}/></td></tr>;})}</tbody></table></div>{records.length>25&&<p className="mt-2 text-xs text-slate-500">Showing the first 25 of {records.length} records.</p>}{step==="preview"&&<><fieldset className="mt-6"><legend className="font-bold text-slate-900">Duplicate handling</legend><div className="mt-3 grid gap-3 md:grid-cols-3">{([{ value:"skip",label:"Skip duplicate",description:"Keep the existing CRM lead unchanged." },{ value:"update",label:"Update existing",description:"Update the matching lead with imported values." },{ value:"import",label:"Import anyway",description:"Create another lead despite the match." }] as const).map((option)=><label key={option.value} className={`cursor-pointer rounded-xl border p-4 ${strategy===option.value?"border-blue-500 bg-blue-50":""}`}><input type="radio" name="duplicateStrategy" value={option.value} checked={strategy===option.value} onChange={()=>setStrategy(option.value)} className="mr-2 accent-blue-600"/><span className="font-semibold text-slate-900">{option.label}</span><p className="mt-1 text-sm text-slate-500">{option.description}</p></label>)}</div></fieldset><div className="mt-6 flex justify-between gap-3"><button type="button" onClick={()=>setStep("mapping")} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Back</button><button type="button" disabled={loading||summary.valid===0} onClick={()=>void runImport()} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading?"Importing...":"Import Valid Leads"}</button></div></>}</>}
        </section>

        <section className="mt-8"><h2 className="text-xl font-bold text-slate-900">Previous Imports</h2><p className="mt-1 text-sm text-slate-500">Recent administrator import activity.</p><div className="mt-4"><CRMTable rows={history} columns={historyColumns} getRowKey={(item)=>item.id} emptyMessage="No previous imports found."/></div></section>
    </div></main>;
}

function SummaryCard({ label,value }:{ label:string;value:number }){ return <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>; }
function RowStatus({ result }:{ result?:ImportRowAnalysis }){ if(!result)return <span>Checking</span>;if(!result.valid)return <span className="font-semibold text-red-600" title={result.errors.join("; ")}>Error</span>;if(result.duplicate)return <span className="font-semibold text-amber-600" title={`Matched ${result.matchingFields.join(", ")}`}>Duplicate Found</span>;return <span className="font-semibold text-green-600">New Inquiry</span>; }
function apiError(result:unknown,fallback:string){ return result&&typeof result==="object"&&"error" in result&&typeof result.error==="string"?result.error:fallback; }
function downloadCsv(fileName:string,csv:string){ const url=URL.createObjectURL(new Blob([csv],{ type:"text/csv;charset=utf-8" }));const link=document.createElement("a");link.href=url;link.download=fileName;link.click();URL.revokeObjectURL(url); }
function safeSpreadsheetValue(value:unknown){ const text=String(value??"");return /^[=+\-@]/.test(text)?`'${text}`:text; }
