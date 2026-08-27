"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
    open:boolean;
    title:string;
    children:ReactNode;
    onClose:()=>void;
    maxWidth?:"md" | "lg" | "xl";
}

const widths = { md:"max-w-md",lg:"max-w-2xl",xl:"max-w-4xl" };

export default function Modal({ open,title,children,onClose,maxWidth="lg" }:Props) {
    if(!open) return null;
    return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute inset-0"/>
        <section role="dialog" aria-modal="true" aria-labelledby="crm-modal-title" className={`relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-7 shadow-xl ${widths[maxWidth]}`}>
            <div className="mb-6 flex items-center justify-between"><h2 id="crm-modal-title" className="text-2xl font-bold text-slate-900">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></div>
            {children}
        </section>
    </div>;
}
