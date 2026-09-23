import ConsultationForm from "@/components/ConsultationForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { createPageMetadata } from "@/lib/seo";

export const metadata=createPageMetadata({
    title:"Request a Free RCM Assessment | WiseMedBilling",
    description:"Request a free revenue cycle assessment from WiseMedBilling. Share your practice's billing priorities and an RCM specialist will review them and follow up.",
    path:"/consultation",
    keywords:["free medical billing assessment","RCM consultation","medical billing quote","revenue cycle review"]
});

/**
 * The page every call to action on the site points at.
 *
 * It rendered the form alone: no navigation, no footer and no metadata of its
 * own. A visitor arriving from an ad or a search result had no way back into
 * the site, and the page inherited the root layout's generic title with no
 * canonical URL or share preview, unlike every other public page.
 *
 * The form supplies its own heading and hero, so it is not wrapped in
 * PublicPageShell, which would add a second <h1>. Footer already renders the
 * floating WhatsApp button, so this page must not render one as well.
 */
export default function ConsultationPage(){

return (

<>

<Navbar />

{/* Clears the fixed navbar, which is shorter on small screens. */}
<main className="pt-20 sm:pt-28">

<ConsultationForm />

</main>

<Footer />

</>

)

}
