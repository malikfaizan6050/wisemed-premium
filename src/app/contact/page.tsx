import PublicPageShell,{ publicCardClass,SectionHeading } from "@/components/PublicPageShell";
import Link from "next/link";
import { ArrowRight,Mail,Phone } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { contactEmail,contactEmailHref,contactPhoneDisplay,contactPhoneHref } from "@/lib/contact";

export const metadata=createPageMetadata({
    title:"Contact a Medical Billing Company | WiseMedBilling",
    description:"Contact WiseMedBilling to discuss secure medical billing and revenue cycle management services for your US medical practice, clinic, or healthcare organization.",
    path:"/contact",
    keywords:["contact medical billing company","medical billing consultation","RCM support for healthcare providers"]
});

export default function ContactPage(){
    return <PublicPageShell eyebrow="CONTACT US" title={<>Let&apos;s talk about your <span className="text-blue-600">revenue cycle</span></>} introduction="Connect with WiseMedBilling for general support, service questions, or a conversation about your organization’s billing priorities." showCta={false}>
        <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <SectionHeading eyebrow="HOW TO REACH US" title="Our team is ready to help" description="Choose the contact option that best fits your needs. For patient privacy, do not send protected health information through general email."/>
                <div className="grid gap-5 md:grid-cols-2">
                    <a href={contactEmailHref} className={`${publicCardClass} group transition hover:-translate-y-1 hover:shadow-xl`}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Mail size={24}/></div>
                        <h2 className="mt-5 text-xl font-bold text-slate-900">Support email</h2>
                        <p className="mt-3 text-slate-600">For general questions and assistance</p>
                        <p className="mt-4 font-semibold text-blue-600">{contactEmail}</p>
                    </a>
                    <a href={contactPhoneHref} className={`${publicCardClass} group transition hover:-translate-y-1 hover:shadow-xl`}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Phone size={24}/></div>
                        <h2 className="mt-5 text-xl font-bold text-slate-900">Phone</h2>
                        <p className="mt-3 text-slate-600">Speak with the WiseMedBilling team</p>
                        <p className="mt-4 font-semibold text-blue-600">{contactPhoneDisplay}</p>
                    </a>
                </div>
                <div className="mt-6 rounded-[36px] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-8 py-12 text-center shadow-[0_30px_80px_rgba(37,99,235,0.18)]">
                    <h2 className="text-3xl font-bold text-white">Ready for a closer look at your RCM?</h2>
                    <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">Tell us about your organization and current revenue-cycle challenges. Our team will review your request and follow up.</p>
                    <Link href="/consultation" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-blue-600 shadow-xl">Request a consultation <ArrowRight size={18}/></Link>
                </div>
            </div>
        </section>
    </PublicPageShell>;
}
