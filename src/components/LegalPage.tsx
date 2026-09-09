import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export interface LegalSection {
    title:string;
    paragraphs?:string[];
    items?:string[];
}

interface Props {
    eyebrow:string;
    title:string;
    introduction:string;
    sections:LegalSection[];
}

export default function LegalPage({ eyebrow,title,introduction,sections }:Props) {
    return <>
        <Navbar/>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 pb-20 pt-36 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="text-center">
                    <p className="text-sm font-semibold tracking-[0.3em] text-blue-600">{eyebrow}</p>
                    <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
                    <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">{introduction}</p>
                    <p className="mt-4 text-sm text-slate-500">Last updated August 27, 2026</p>
                </div>

                <div className="mt-12 space-y-6">
                    {sections.map((section)=><section key={section.title} className="rounded-[26px] border border-white/80 bg-white/85 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
                        <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                        {section.paragraphs?.map((paragraph)=><p key={paragraph} className="mt-4 leading-7 text-slate-600">{paragraph}</p>)}
                        {section.items&&<ul className="mt-4 space-y-3 text-slate-600">
                            {section.items.map((item)=><li key={item} className="flex gap-3 leading-7"><span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"/><span>{item}</span></li>)}
                        </ul>}
                    </section>)}
                </div>
            </div>
        </main>
        <Footer/>
    </>;
}
