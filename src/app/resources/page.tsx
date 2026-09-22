import PublicPageShell,{ publicCardClass,SectionHeading } from "@/components/PublicPageShell";
import { BookOpen,FileCheck,HelpCircle,ShieldCheck } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"Healthcare RCM Resources & Medical Billing Guides | WiseMedBilling",
    description:"Explore healthcare RCM resources, practical medical billing guides, secure information-sharing tips, and answers to common provider questions.",
    path:"/resources",
    keywords:["healthcare RCM resources","medical billing guides","revenue cycle education","medical billing FAQ"],
    // Hidden from the menu and sitemap while the section is thin. noIndex keeps
    // it out of search results too, so the page is reachable by direct link but
    // is not presented as finished material. Remove once it has real content.
    noIndex:true
});

const guides=[
    { icon:BookOpen,title:"Revenue cycle basics",description:"RCM covers the administrative and financial steps from patient registration and eligibility through claims, payment, and follow-up." },
    { icon:FileCheck,title:"Cleaner claim workflows",description:"Accurate patient, coverage, coding, and documentation information can help reduce preventable rejections and denials." },
    { icon:ShieldCheck,title:"Safer information sharing",description:"Use approved, secure channels for sensitive healthcare data and limit shared information to what the workflow requires." }
];
const faqs=[
    { question:"What is healthcare revenue cycle management?",answer:"Revenue cycle management is the process healthcare organizations use to manage financial activity connected to patient services, including eligibility, billing, claims, payments, denials, and reporting." },
    { question:"Which organizations can use WiseMedBilling services?",answer:"WiseMedBilling is designed to support healthcare providers and organizations that want more consistent billing workflows, follow-up, and revenue visibility." },
    { question:"Can I submit patient information through the website?",answer:"Public website forms are intended for general provider and business information. Do not submit patient-identifiable information unless an approved secure workflow and applicable agreements are in place." },
    { question:"How do I request a consultation?",answer:"Use the consultation form to share basic information about your organization and current RCM priorities. The WiseMedBilling team will review the request and follow up." }
];

export default function ResourcesPage(){
    return <PublicPageShell eyebrow="RCM RESOURCES" title={<>Helpful guidance for <span className="text-blue-600">healthcare providers</span></>} introduction="Build a clearer understanding of core revenue-cycle workflows and find answers to common questions about working with WiseMedBilling.">
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <SectionHeading eyebrow="RCM EDUCATION" title="A practical starting point" description="These fundamentals can help visitors understand how connected revenue-cycle activities influence claim outcomes and reimbursement."/>
                <div className="grid gap-5 md:grid-cols-3">
                    {guides.map(({ icon:Icon,title,description })=><article key={title} className={publicCardClass}>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Icon size={22}/></div>
                        <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
                        <p className="mt-3 leading-7 text-slate-600">{description}</p>
                    </article>)}
                </div>
            </div>
        </section>
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <SectionHeading eyebrow="FREQUENTLY ASKED QUESTIONS" title="Common questions, clear answers" description="Helpful information about revenue cycle management, our services, and safe ways to contact our team."/>
                <div className="space-y-4">
                    {faqs.map(({ question,answer })=><details key={question} className={`${publicCardClass} group`}>
                        <summary className="flex cursor-pointer list-none items-center gap-4 font-bold text-slate-900"><HelpCircle className="shrink-0 text-blue-600" size={21}/><span>{question}</span></summary>
                        <p className="mt-4 pl-9 leading-7 text-slate-600">{answer}</p>
                    </details>)}
                </div>
            </div>
        </section>
    </PublicPageShell>;
}
