import LegalPage from "@/components/LegalPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"HIPAA-Focused Medical Billing & Secure RCM | WiseMedBilling",
    description:"Learn how WiseMedBilling approaches HIPAA-focused medical billing workflows, secure healthcare data handling, authorized access, and provider safeguards.",
    path:"/hipaa",
    keywords:["HIPAA compliant medical billing services","secure healthcare data handling","HIPAA-focused RCM"]
});

const sections=[
    {
        title:"Our HIPAA approach",
        paragraphs:["WiseMedBilling supports healthcare revenue-cycle workflows with safeguards designed to help protect the confidentiality, integrity, and availability of information. Whether HIPAA applies to a specific engagement depends on the services, information involved, the parties' roles, and the governing agreements."],
        items:["When WiseMedBilling acts as a business associate and handles protected health information, responsibilities are defined through the applicable service agreement and Business Associate Agreement."]
    },
    {
        title:"Security safeguards",
        paragraphs:["Our approach combines administrative, technical, and organizational controls appropriate to the approved workflow and the sensitivity of information being processed."],
        items:["Role-based access and least-privilege permissions for authorized personnel.","Authentication and account-status controls for protected systems.","Server-controlled data changes and activity records for important actions.","Secure transmission practices and restricted service-provider access.","Workforce procedures for credential protection, incident reporting, and access removal.","Review and improvement of safeguards as systems and risks change."]
    },
    {
        title:"Public website limitation",
        paragraphs:["The public WiseMedBilling website and consultation form are intended for general provider, practice, and business information. They are not patient portals, clinical communication systems, or emergency services."],
        items:["Do not submit patient names, medical record numbers, dates of birth, insurance member identifiers, diagnosis details, treatment information, claim-level patient data, or other patient-identifiable information unless WiseMedBilling has explicitly approved the submission method and the required agreements are in place."]
    },
    {
        title:"Approved healthcare data workflows",
        paragraphs:["Before protected health information is exchanged, WiseMedBilling and the healthcare organization should confirm the authorized purpose, minimum necessary data, approved users, transfer method, retention expectations, incident contacts, and contractual requirements. Public email or website forms should not replace an approved secure exchange process."]
    },
    {
        title:"Reporting a concern",
        paragraphs:["If you believe sensitive healthcare information was submitted through an incorrect channel, or you need to report a privacy or security concern, stop further transmission and contact support@wisemedbilling.com promptly. Do not include additional patient information in the initial report."]
    }
];

export default function HipaaPage(){
    return <LegalPage eyebrow="HEALTHCARE PRIVACY" title="HIPAA Approach" introduction="WiseMedBilling uses security-focused practices for healthcare revenue-cycle services and requires protected information to be handled only through authorized workflows." sections={sections}/>;
}
