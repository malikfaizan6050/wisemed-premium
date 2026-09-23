import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const pages=[
    { path:"",changeFrequency:"weekly",priority:1 },
    // The consultation form is the page every call to action on the site
    // points at, and it was the one page missing from the sitemap.
    { path:"/consultation",changeFrequency:"monthly",priority:0.9 },
    { path:"/services",changeFrequency:"monthly",priority:0.9 },
    { path:"/solutions",changeFrequency:"monthly",priority:0.9 },
    { path:"/about",changeFrequency:"monthly",priority:0.8 },
    // /resources is intentionally absent while the section is unfinished, so
    // search engines are not pointed at a thin page.
    { path:"/contact",changeFrequency:"yearly",priority:0.7 },
    { path:"/hipaa",changeFrequency:"yearly",priority:0.5 },
    { path:"/privacy",changeFrequency:"yearly",priority:0.3 },
    { path:"/terms",changeFrequency:"yearly",priority:0.3 }
] as const;

export default function sitemap():MetadataRoute.Sitemap{
    return pages.map(({ path,changeFrequency,priority })=>({
        url:`${siteUrl}${path}`,
        changeFrequency,
        priority
    }));
}
