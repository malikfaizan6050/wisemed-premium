/**
 * Absolute address of the CRM login portal, which is the CRM host's root now
 * that /login is gone.
 *
 * NEXT_PUBLIC_APP_URL is deliberately not the fallback: it names the marketing
 * origin, where `/` serves the landing page rather than the portal. Set CRM_URL
 * in the deployment to override the CRM host this links to.
 */
export const crmLoginUrl=()=>{
    const origin=process.env.CRM_URL
        ??(process.env.NODE_ENV==="production"?"https://crm.wisemedbilling.com":"http://localhost:3000");
    return `${origin.replace(/\/$/,"")}/`;
};
