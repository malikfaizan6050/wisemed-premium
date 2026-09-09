import { getWhatsAppUrl,WhatsAppIcon } from "@/components/WhatsAppButton";

export default function WhatsAppSection(){
    const whatsappUrl=getWhatsAppUrl();
    if(!whatsappUrl) return null;

    return <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[26px] border border-white/80 bg-white/80 px-6 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-10 md:py-12">
            <p className="text-xs font-bold tracking-[0.25em] text-blue-600">WHATSAPP SUPPORT</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Need Help? Chat With Us on WhatsApp</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Have questions about our platform or services? Our team is available to assist you.</p>
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-7 py-4 font-semibold text-white shadow-lg shadow-green-200 transition duration-300 hover:-translate-y-0.5 hover:bg-[#20bd5a] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
            >
                <WhatsAppIcon className="h-6 w-6"/>
                Chat on WhatsApp
            </a>
        </div>
    </section>;
}
