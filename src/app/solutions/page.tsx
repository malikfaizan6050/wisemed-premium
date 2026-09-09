import PublicPageShell,{ publicCardClass,SectionHeading } from "@/components/PublicPageShell";
import { CheckCircle2,ClipboardCheck,DollarSign,FileCheck,TrendingUp } from "lucide-react";
import StructuredData from "@/components/StructuredData";
import { createPageMetadata,serviceSchema } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"Revenue Cycle Optimization & Healthcare Billing Solutions | WiseMedBilling",
    description:"Improve billing performance with healthcare billing solutions that connect eligibility, claims, denial workflows, payment recovery, and revenue-cycle insight.",
    path:"/solutions",
    keywords:["revenue cycle optimization","healthcare billing solutions","medical billing company for clinics","medical billing partner for practices"]
});

const workflow=[
    { icon:ClipboardCheck,step:"01",title:"Verify",description:"Review patient and coverage information before billing begins." },
    { icon:FileCheck,step:"02",title:"Process",description:"Prepare, submit, monitor, and follow up on claims with consistent workflows." },
    { icon:DollarSign,step:"03",title:"Recover",description:"Post payments, resolve denials, and identify opportunities to improve collections." }
];
const benefits=["Fewer preventable billing delays","Better visibility into claims and denials","More consistent follow-up workflows","Clearer revenue performance insight"];

export default function SolutionsPage(){
    return <PublicPageShell eyebrow="PROVIDER SOLUTIONS" title={<>A coordinated approach to <span className="text-blue-600">healthcare revenue</span></>} introduction="Our provider solutions connect the people, processes, and information needed to manage revenue-cycle work with greater clarity and consistency.">
        <StructuredData data={serviceSchema("Healthcare Revenue Cycle Optimization","Provider-focused healthcare billing solutions connecting verification, claims processing, denial management, payment recovery, and analytics.","/solutions")}/>
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <SectionHeading eyebrow="HOW IT WORKS" title="A clear workflow from verification to payment" description="WiseMedBilling supports the connected steps that influence claim quality, payer follow-up, reimbursement, and financial visibility."/>
                <div className="grid gap-5 md:grid-cols-3">
                    {workflow.map(({ icon:Icon,step,title,description })=><article key={step} className={`${publicCardClass} text-center`}>
                        <p className="text-xs font-bold tracking-[0.25em] text-blue-600">STEP {step}</p>
                        <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Icon size={27}/></div>
                        <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
                        <p className="mt-3 leading-7 text-slate-600">{description}</p>
                    </article>)}
                </div>
            </div>
        </section>
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
                <div>
                    <p className="text-sm font-bold tracking-[0.2em] text-blue-600">PRACTICAL BENEFITS</p>
                    <h2 className="mt-5 text-3xl font-bold text-slate-900 md:text-4xl">Designed to strengthen everyday RCM operations</h2>
                    <p className="mt-5 text-lg leading-8 text-slate-600">A connected workflow helps teams spend less time navigating disconnected tasks and more time acting on the work that affects reimbursement.</p>
                </div>
                <div className={publicCardClass}>
                    {benefits.map((benefit)=><div key={benefit} className="flex items-center gap-4 border-b border-blue-50 py-4 last:border-0"><CheckCircle2 className="shrink-0 text-blue-600" size={22}/><p className="font-semibold text-slate-800">{benefit}</p></div>)}
                    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50/70 p-5 text-blue-700"><TrendingUp size={22}/><p className="font-semibold">Stronger visibility supports better decisions.</p></div>
                </div>
            </div>
        </section>
    </PublicPageShell>;
}
