import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 deprecated `middleware.ts` and renamed it to `proxy.ts`. The
 * behaviour is unchanged; see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 *
 * One deployment serves two products, and both are reached at `/`:
 *   crm.wisemedbilling.com -> the CRM login portal, which is src/app/page.tsx
 *   wisemedbilling.com     -> the marketing site, landing at src/app/home/page.tsx
 *
 * The CRM host renders the root page as it stands, so the address bar stays
 * `https://crm.wisemedbilling.com/` with no redirect to a subpath. Marketing
 * hosts get an internal rewrite to /home, which the browser never sees either.
 */

const readHosts=(value:string|undefined,fallback:string)=>new Set(
    (value??fallback).split(",").map((host)=>host.trim().toLowerCase()).filter(Boolean)
);

const crmHosts=readHosts(process.env.CRM_HOSTS,"crm.wisemedbilling.com");
const marketingHosts=readHosts(process.env.MARKETING_HOSTS,"wisemedbilling.com,www.wisemedbilling.com");

/** Strips the port development adds and the list a forwarding proxy can send. */
const hostnameOf=(request:NextRequest)=>{
    const header=request.headers.get("x-forwarded-host")??request.headers.get("host")??"";
    return header.split(",")[0].trim().toLowerCase().split(":")[0];
};

const isCrmHost=(hostname:string)=>crmHosts.has(hostname)||hostname.split(".")[0]==="crm";

// Preview deployments carry generated *.vercel.app names that cannot be listed
// ahead of time, and they serve the marketing site today, so they keep doing so.
const isMarketingHost=(hostname:string)=>marketingHosts.has(hostname)||hostname.endsWith(".vercel.app");

function crmPortal(){
    const response=NextResponse.next();
    // The old /login route was disallowed in robots.txt. `/` cannot be, because
    // the marketing landing page shares that path, so the portal is marked here.
    response.headers.set("X-Robots-Tag","noindex, nofollow");
    return response;
}

export function proxy(request:NextRequest){
    const hostname=hostnameOf(request);
    if(isCrmHost(hostname)) return crmPortal();
    if(isMarketingHost(hostname)) return NextResponse.rewrite(new URL("/home",request.url));
    // Everything else, localhost above all, gets the CRM, so `/` is the login
    // portal while developing. The marketing landing stays open at /home.
    return crmPortal();
}

export const config={ matcher:"/" };
