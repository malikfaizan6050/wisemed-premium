import type { ReactNode } from "react";

export interface CRMTableColumn<T> {
    key:string;
    header:string;
    render:(row:T)=>ReactNode;
}

interface Props<T> {
    rows:T[];
    columns:CRMTableColumn<T>[];
    getRowKey:(row:T)=>string;
    emptyMessage:string;
}

export default function CRMTable<T>({ rows,columns,getRowKey,emptyMessage }:Props<T>) {
    return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>{columns.map((column)=><th key={column.key} className="px-5 py-4 font-semibold">{column.header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {rows.map((row)=><tr key={getRowKey(row)} className="text-sm text-slate-700">{columns.map((column)=><td key={column.key} className="px-5 py-4 align-middle">{column.render(row)}</td>)}</tr>)}
                {rows.length === 0 && <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">{emptyMessage}</td></tr>}
            </tbody>
        </table>
    </div>;
}
