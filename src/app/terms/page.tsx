import LegalPage from "@/components/LegalPage";
import { createPageMetadata } from "@/lib/seo";
import { contactEmail } from "@/lib/contact";

export const metadata=createPageMetadata({
    title:"Terms of Use | WiseMedBilling",
    description:"Review the terms governing use of the WiseMedBilling website, medical billing consultation requests, and authorized employee accounts.",
    path:"/terms"
});

const sections=[
    {
        title:"Website usage",
        paragraphs:["You may use this website for lawful business purposes, to learn about WiseMedBilling services, and to request information. You must not attempt to disrupt the website, bypass security controls, access protected systems without authorization, submit malicious content, impersonate another person, or use automated tools in a way that harms the service."],
        items:["Website content may not be copied, misrepresented, or used to imply a relationship with WiseMedBilling without permission."]
    },
    {
        title:"Consultation requests",
        paragraphs:["Submitting a consultation or RCM assessment request does not create a client relationship, guarantee acceptance, or obligate WiseMedBilling to provide services. Information you submit should be accurate, current, and limited to information you are authorized to share."],
        items:["Do not submit patient-identifiable information through public forms unless WiseMedBilling has expressly approved a secure workflow.","Service scope, pricing, responsibilities, and any applicable healthcare data obligations will be governed by a separate written agreement."]
    },
    {
        title:"Service and information disclaimers",
        paragraphs:["Website materials are provided for general business information and are not medical, legal, tax, accounting, or payer-specific advice. Revenue, denial, reimbursement, and performance examples are illustrative and do not guarantee results. Actual outcomes depend on provider operations, documentation, payer rules, contracts, coding, claim quality, and other factors outside WiseMedBilling's control."],
        items:["The website is provided on an available basis. We may update, suspend, or correct website content without notice."]
    },
    {
        title:"Employee account responsibilities",
        paragraphs:["Protected accounts are for authorized users only. Account holders must keep login credentials confidential, use a personal password, complete required password changes, and immediately report suspected compromise. Users are responsible for activity performed through their account unless promptly reported as unauthorized."],
        items:["Accounts may be suspended or revoked when employment, authorization, role, or security requirements change.","Users must follow assigned permissions and may not attempt to access records outside their approved role or team scope."]
    },
    {
        title:"Intellectual property",
        paragraphs:["The WiseMedBilling name, branding, website design, written materials, software, and related content are owned by WiseMedBilling or its licensors and are protected by applicable intellectual-property laws. Limited personal or internal business use does not transfer ownership rights."]
    },
    {
        title:"Limitation and responsibility",
        paragraphs:["To the extent permitted by applicable law, WiseMedBilling is not responsible for indirect or consequential losses arising solely from use of, or inability to use, the public website. Nothing in these terms limits obligations that cannot legally be excluded or obligations established in a separate signed service agreement."]
    },
    {
        title:"Changes and contact",
        paragraphs:[`We may update these terms as the website, services, or legal requirements change. The date above identifies the latest published version. Questions about these terms may be sent to ${contactEmail}.`]
    }
];

export default function TermsPage(){
    return <LegalPage eyebrow="TERMS" title="Website Terms of Use" introduction="These terms describe the rules for using the WiseMedBilling website, requesting consultations, and accessing authorized employee accounts." sections={sections}/>;
}
