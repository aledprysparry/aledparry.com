import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /app/buan is explicitly allowed (more specific than the /app/ block)
        // so crawlers can follow its redirect to the canonical /buan landing.
        allow: ["/", "/app/buan"],
        disallow: ["/app/", "/admin/", "/demos/"],
      },
    ],
    sitemap: "https://aledparry.com/sitemap.xml",
  };
}
