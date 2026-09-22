import { contactPhoneE164 } from "@/lib/contact";

const defaultMessage="Hello WiseMedBilling team, I would like to know more about your services.";

/**
 * Builds the WhatsApp chat link.
 *
 * NEXT_PUBLIC_WHATSAPP_NUMBER overrides, so a dedicated WhatsApp line can be
 * pointed at without a code change. It falls back to the business number
 * rather than returning null, because NEXT_PUBLIC_* values are inlined at
 * build time: the variable lives only in a gitignored .env.local, so every
 * deployed build had no number and the button and the homepage WhatsApp
 * section both rendered nothing, with no error to notice.
 */
export function getWhatsAppUrl(){
    const configured=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g,"");
    const phoneNumber=configured || contactPhoneE164.replace(/\D/g,"");
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
}

export function WhatsAppIcon({ className="h-7 w-7" }:{ className?:string }){
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.58-.487-.501-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-4.99 7.127h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.821 9.821 0 0 1 7.021 2.91 9.825 9.825 0 0 1 2.9 7.027c-.003 5.45-4.435 9.884-9.926 9.884M20.901 3.193A11.815 11.815 0 0 0 12.488 0C5.615 0 .022 5.592.019 12.464c0 2.198.574 4.347 1.668 6.238L.008 24l5.421-1.422a12.4 12.4 0 0 0 5.965 1.517h.005c6.873 0 12.466-5.592 12.469-12.465a12.39 12.39 0 0 0-2.967-8.437"/>
    </svg>;
}

export default function WhatsAppButton(){
    const whatsappUrl=getWhatsAppUrl();

    return <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with WiseMedBilling on WhatsApp"
        className="fixed bottom-24 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_20px_50px_rgba(37,211,102,0.35)] transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#20bd5a] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 sm:right-8 sm:h-16 sm:w-16"
    >
        <WhatsAppIcon className="h-8 w-8 sm:h-9 sm:w-9"/>
    </a>;
}
