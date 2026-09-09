import PublicPageShell,{ publicCardClass,SectionHeading } from "@/components/PublicPageShell";
import { BarChart3,ClipboardCheck,FileText,ShieldAlert,Stethoscope,Wallet } from "lucide-react";
import StructuredData from "@/components/StructuredData";
import { createPageMetadata,serviceSchema } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"Medical Billing, Claims & Denial Management Services | WiseMedBilling",
    description:"Explore medical billing services, claims management, denial management, eligibility verification, payment posting, and healthcare analytics for US providers.",
    path:"/services",
    keywords:["medical claims processing services","denial management services","medical coding and billing services","insurance eligibility verification services","payment posting services","healthcare analytics solutions"]
});

const services=[
    { id:"medical-billing",icon:FileText,title:"Medical Billing",description:"Support accurate charge and claim workflows with organized billing processes designed to reduce avoidable delays." },
    { id:"claims-management",icon:ClipboardCheck,title:"Claims Management",description:"Track claims from submission through payer response, follow up on outstanding items, and keep work moving toward resolution." },
    { id:"denial-management",icon:ShieldAlert,title:"Denial Management",description:"Identify recurring denial causes, prioritize follow-up, and apply lessons from resolved claims to help prevent repeat issues." },
    { id:"eligibility-verification",icon:Stethoscope,title:"Eligibility Verification",description:"Confirm available coverage and eligibility details before service to help teams set expectations and reduce downstream claim friction." },
    { id:"payment-posting",icon:Wallet,title:"Payment Posting",description:"Record payments and adjustments accurately, reconcile payer activity, and surface discrepancies for timely review." },
    { id:"revenue-analytics",icon:BarChart3,title:"Revenue Analytics",description:"Turn operational revenue-cycle data into clear views of claims, denials, payments, trends, and follow-up priorities." }
];

export default function ServicesPage(){
    return <PublicPageShell eyebrow="RCM SERVICES" title={<>Connected services for a <span className="text-blue-600">stronger revenue cycle</span></>} introduction="WiseMedBilling supports the essential workflows that help healthcare providers submit cleaner claims, resolve issues, and understand financial performance.">
        <StructuredData data={services.map(({ title,description,id })=>serviceSchema(title,description,`/services#${id}`))}/>
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <SectionHeading eyebrow="WHAT WE DO" title="Revenue-cycle support from eligibility to analytics" description="Each service works as part of a coordinated process and can be aligned to your organization’s operational needs."/>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {services.map(({ id,icon:Icon,title,description })=><article id={id} key={title} className={`${publicCardClass} scroll-mt-32`}>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Icon size={22}/></div>
                        <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
                        <p className="mt-3 leading-7 text-slate-600">{description}</p>
                    </article>)}
                </div>
            </div>
        </section>
    </PublicPageShell>;
}
