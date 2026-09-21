import LegalPage from "@/components/LegalPage";
import { createPageMetadata } from "@/lib/seo";
import { contactEmail } from "@/lib/contact";

export const metadata=createPageMetadata({
    title:"Privacy Policy | WiseMedBilling",
    description:"Learn how WiseMedBilling collects, uses, protects, and processes information submitted through its website and healthcare revenue-cycle services.",
    path:"/privacy",
    keywords:["healthcare data privacy","secure healthcare data handling"]
});

const sections=[
    {
        title:"Information we collect",
        paragraphs:["We collect information that you voluntarily provide when requesting an RCM assessment or contacting WiseMedBilling. This may include your name, business email, phone number, organization, provider specialty, NPI, claims volume, billing systems, operational challenges, and message content."],
        items:["Please do not include patient names, medical record numbers, dates of birth, insurance identifiers, clinical details, or other patient-identifiable information in public website forms unless WiseMedBilling has expressly approved a secure workflow for that purpose."]
    },
    {
        title:"Consultation form data",
        paragraphs:["Consultation information is used to respond to your request, evaluate potential revenue-cycle needs, prevent duplicate inquiries, calculate an internal opportunity score, and coordinate follow-up. Authorized personnel and service providers may process this information only for legitimate business and service-delivery purposes."]
    },
    {
        title:"Firebase authentication",
        paragraphs:["WiseMedBilling uses Firebase Authentication to identify authorized employee users and manage access to protected systems. Firebase may process account identifiers, authentication tokens, login events, and security-related technical information. Website consultation visitors are not required to create a Firebase account."]
    },
    {
        title:"Google reCAPTCHA",
        paragraphs:["The consultation form uses Google reCAPTCHA to help detect automated abuse. Google may collect device, browser, interaction, and network information according to Google's applicable privacy policy and terms. This security check is required before a consultation request can be accepted."]
    },
    {
        title:"Email processing",
        paragraphs:["We may use email providers to deliver consultation confirmations, operational messages, account notices, and service communications. Email addresses and the minimum information required to prepare and deliver each message may be processed by those providers."],
        items:["We do not store account passwords in website records or send plain-text personal passwords by email."]
    },
    {
        title:"Analytics and technical information",
        paragraphs:["We may use aggregated or limited technical information to understand website performance, improve navigation, diagnose errors, and protect the service. This can include page activity, browser and device characteristics, approximate location derived from network information, referral data, and timestamps. We do not use public website analytics as a substitute for clinical records."]
    },
    {
        title:"Healthcare information handling",
        paragraphs:["WiseMedBilling applies administrative, technical, and organizational safeguards appropriate to the sensitivity of information it handles. When protected health information is involved, its collection and use must occur only through an approved service arrangement and authorized workflow, including a Business Associate Agreement when applicable."],
        items:["Public forms are intended for provider and business information, not patient care, emergencies, or clinical communications."]
    },
    {
        title:"Retention, sharing, and your choices",
        paragraphs:["We retain information for as long as reasonably needed to respond to requests, provide services, meet legal or contractual obligations, resolve disputes, and maintain security. We do not sell consultation information. We may share information with authorized service providers, professional advisers, or authorities when required by law."],
        items:[`To request access, correction, or deletion where applicable, contact ${contactEmail}.`]
    }
];

export default function PrivacyPage(){
    return <LegalPage eyebrow="PRIVACY" title="Privacy Policy" introduction="This policy explains how WiseMedBilling handles information collected through our public website, consultation process, authentication services, and related communications." sections={sections}/>;
}
