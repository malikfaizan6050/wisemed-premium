import Navbar from "@/components/Navbar";
import Hero from "@/components/hero";
import TrustSection from "@/components/TrustSection";
import SolutionsSection from "@/components/SolutionsSection";
import WorkflowSection from "@/components/WorkflowSection";
import WhyChoose from "@/components/WhyChoose";
import PerformanceSection from "@/components/PerformanceSection";
import TestimonialSection from "@/components/TestimonialSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import WhatsAppSection from "@/components/WhatsAppSection";
import StructuredData from "@/components/StructuredData";
import { createPageMetadata,organizationSchema,websiteSchema } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"Healthcare Revenue Cycle Management Services | WiseMedBilling",
    description:"WiseMedBilling is a US-focused medical billing company providing secure RCM services, claims management, denial support, and revenue optimization for healthcare providers.",
    path:"/",
    keywords:["revenue cycle management company","outsource medical billing","HIPAA compliant medical billing services","revenue cycle management services USA","medical billing partner for practices"]
});


export default function Home() {

return (

<main className="pt-28">

<StructuredData data={[organizationSchema,websiteSchema]} />

<Navbar />

<Hero />

<TrustSection />

<SolutionsSection />

<WorkflowSection />

<WhyChoose />

<PerformanceSection />

<TestimonialSection />

<CTASection />

<WhatsAppSection />

<Footer />

</main>

);

}
