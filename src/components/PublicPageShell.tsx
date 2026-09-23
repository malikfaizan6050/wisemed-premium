import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppSection from "@/components/WhatsAppSection";
import type { ReactNode } from "react";

interface PublicPageShellProps {
    eyebrow:string;
    title:ReactNode;
    introduction:string;
    children:ReactNode;
    showCta?:boolean;
}

export default function PublicPageShell({ eyebrow,title,introduction,children,showCta=true }:PublicPageShellProps){
    return <>
        <Navbar/>
        {/* pt clears the fixed navbar, which is shorter on small screens. */}
        <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white pt-24 sm:pt-36">
            <section className="relative overflow-hidden px-5 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
                <div className="absolute left-1/2 top-0 h-[350px] w-[350px] max-w-full -translate-x-1/2 rounded-full bg-blue-100/40 blur-[120px]"/>
                <div className="relative mx-auto max-w-3xl text-center">
                    <p className="text-xs font-bold tracking-[0.25em] text-blue-600 sm:text-sm">{eyebrow}</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:mt-5 sm:text-4xl md:text-5xl">{title}</h1>
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">{introduction}</p>
                </div>
            </section>
            {children}
            {showCta&&<CTASection/>}
            <WhatsAppSection/>
        </main>
        <Footer/>
    </>;
}

export function SectionHeading({ eyebrow,title,description }:{ eyebrow:string;title:string;description:string }){
    return <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
        <p className="text-xs font-bold tracking-[0.25em] text-blue-600">{eyebrow}</p>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{description}</p>
    </div>;
}

export const publicCardClass="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6";
