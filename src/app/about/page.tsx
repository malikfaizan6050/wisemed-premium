import PublicPageShell,{ publicCardClass,SectionHeading } from "@/components/PublicPageShell";
import { HeartPulse,ShieldCheck,Stethoscope,TrendingUp } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"Healthcare RCM Company & Medical Billing Experts | WiseMedBilling",
    description:"Meet WiseMedBilling, a provider-focused healthcare RCM company delivering medical billing expertise, secure data handling, and revenue-cycle support across the USA.",
    path:"/about",
    keywords:["healthcare RCM company","medical billing experts","secure healthcare data handling","provider-focused RCM solutions"]
});

const strengths=[
    { icon:Stethoscope,title:"Healthcare RCM expertise",description:"Our team understands the operational details behind eligibility, claims, denials, payments, and revenue reporting." },
    { icon:ShieldCheck,title:"Security-focused workflows",description:"We use role-aware processes and safeguards designed for the sensitivity of healthcare revenue-cycle information." },
    { icon:TrendingUp,title:"Performance visibility",description:"Clear workflows and practical reporting help provider teams identify delays, reduce leakage, and improve follow-up." },
    { icon:HeartPulse,title:"Provider-first support",description:"We work to reduce billing friction so healthcare teams can keep their attention on patients and practice growth." }
];

export default function AboutPage(){
    return <PublicPageShell eyebrow="ABOUT WISEMEDBILLING" title={<>Revenue-cycle support built for <span className="text-blue-600">healthcare providers</span></>} introduction="WiseMedBilling helps healthcare organizations simplify revenue-cycle operations through dependable workflows, experienced support, and clearer financial visibility.">
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <SectionHeading eyebrow="OUR APPROACH" title="Practical expertise across the revenue cycle" description="We combine healthcare billing knowledge with consistent operational processes to help providers move claims from patient verification through final payment."/>
                <div className="grid gap-5 md:grid-cols-2">
                    {strengths.map(({ icon:Icon,title,description })=><article key={title} className={publicCardClass}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Icon size={24}/></div>
                        <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
                        <p className="mt-3 leading-7 text-slate-600">{description}</p>
                    </article>)}
                </div>
            </div>
        </section>
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <div className={publicCardClass}>
                    <p className="text-xs font-bold tracking-[0.25em] text-blue-600">SECURITY & COMPLIANCE</p>
                    <h2 className="mt-4 text-2xl font-bold text-slate-900">Responsible healthcare information handling</h2>
                    <p className="mt-4 leading-7 text-slate-600">Our security and compliance approach centers on authorized access, approved data workflows, minimum-necessary handling, and clear responsibilities under applicable agreements.</p>
                </div>
                <div className={publicCardClass}>
                    <p className="text-xs font-bold tracking-[0.25em] text-blue-600">WHY CHOOSE US</p>
                    <h2 className="mt-4 text-2xl font-bold text-slate-900">A focused partner for better revenue performance</h2>
                    <p className="mt-4 leading-7 text-slate-600">WiseMedBilling brings claims accuracy, responsive support, denial prevention, and actionable revenue insight together in one coordinated approach.</p>
                </div>
            </div>
        </section>
    </PublicPageShell>;
}
