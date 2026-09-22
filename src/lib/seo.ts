import type { Metadata } from "next";
import { contactEmail,contactPhoneE164 } from "@/lib/contact";

// NOTE: this default is a Vercel preview URL, so canonical links, share
// previews and the sitemap all publish under it unless NEXT_PUBLIC_SITE_URL is
// set. It is also why the site's address does not match its wisemedbilling.com
// email. Set NEXT_PUBLIC_SITE_URL to the live domain before launch.
export const siteUrl=process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,"")||"https://wisemed-premium-bdgf.vercel.app";
export const siteName="WiseMedBilling";

const sharedKeywords=[
    "healthcare revenue cycle management",
    "medical billing services",
    "medical billing company",
    "RCM services",
    "medical billing outsourcing",
    "healthcare billing solutions"
];

interface PageSeo {
    title:string;
    description:string;
    path:string;
    keywords?:string[];
    /** Keeps an unfinished page out of search results while it stays reachable. */
    noIndex?:boolean;
}

export function createPageMetadata({ title,description,path,keywords=[],noIndex=false }:PageSeo):Metadata{
    const canonical=path==="/"?siteUrl:`${siteUrl}${path}`;
    return {
        metadataBase:new URL(siteUrl),
        title,
        description,
        keywords:[...sharedKeywords,...keywords],
        alternates:{ canonical },
        ...(noIndex ? { robots:{ index:false,follow:true } } : {}),
        openGraph:{
            type:"website",
            locale:"en_US",
            url:canonical,
            siteName,
            title,
            description
        },
        twitter:{
            card:"summary",
            title,
            description
        }
    };
}

export const specialtyServiceSeo=[
    { slug:"cardiology-billing-services",name:"Cardiology Billing Services" },
    { slug:"orthopedic-billing-services",name:"Orthopedic Billing Services" },
    { slug:"behavioral-health-billing-services",name:"Behavioral Health Billing Services" },
    { slug:"primary-care-billing-services",name:"Primary Care Billing Services" }
] as const;

export const organizationSchema={
    "@context":"https://schema.org",
    "@type":"Organization",
    "@id":`${siteUrl}/#organization`,
    name:siteName,
    url:siteUrl,
    email:contactEmail,
    telephone:contactPhoneE164,
    description:"Healthcare revenue cycle management company helping medical practices improve billing performance, claims management, collections, and revenue optimization.",
    areaServed:{ "@type":"Country",name:"United States" },
    contactPoint:{
        "@type":"ContactPoint",
        contactType:"customer support",
        email:contactEmail,
        telephone:contactPhoneE164,
        areaServed:"US",
        availableLanguage:"English"
    },
    knowsAbout:["Medical billing","Claims management","Denial management","Payment posting","Insurance eligibility verification","Healthcare revenue analytics"]
};

export const websiteSchema={
    "@context":"https://schema.org",
    "@type":"WebSite",
    "@id":`${siteUrl}/#website`,
    name:siteName,
    url:siteUrl,
    publisher:{ "@id":`${siteUrl}/#organization` },
    inLanguage:"en-US"
};

export function serviceSchema(name:string,description:string,path:string){
    return {
        "@context":"https://schema.org",
        "@type":"Service",
        name,
        description,
        url:`${siteUrl}${path}`,
        provider:{ "@id":`${siteUrl}/#organization` },
        areaServed:{ "@type":"Country",name:"United States" },
        audience:{ "@type":"Audience",audienceType:"US healthcare providers, medical practices, clinics, and healthcare organizations" },
        serviceType:"Healthcare Revenue Cycle Management"
    };
}
