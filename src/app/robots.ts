import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots():MetadataRoute.Robots{
    return {
        rules:{
            userAgent:"*",
            allow:"/",
            disallow:["/api/","/dashboard/","/login","/forgot-password","/change-password","/test-firebase"]
        },
        sitemap:`${siteUrl}/sitemap.xml`,
        host:siteUrl
    };
}
