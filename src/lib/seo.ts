import type { Metadata } from "next";

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
}

export function createPageMetadata({ title,description,path,keywords=[] }:PageSeo):Metadata{
    const canonical=path==="/"?siteUrl:`${siteUrl}${path}`;
    return {
        metadataBase:new URL(siteUrl),
        title,
        description,
        keywords:[...sharedKeywords,...keywords],
        alternates:{ canonical },
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
    email:"support@wisemedbilling.com",
    description:"Healthcare revenue cycle management company helping medical practices improve billing performance, claims management, collections, and revenue optimization.",
    areaServed:{ "@type":"Country",name:"United States" },
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
