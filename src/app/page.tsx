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


export default function Home() {

return (

<main className="pt-28">

<Navbar />

<Hero />

<TrustSection />

<SolutionsSection />

<WorkflowSection />

<WhyChoose />

<PerformanceSection />

<TestimonialSection />

<CTASection />

<Footer />

</main>

);

}