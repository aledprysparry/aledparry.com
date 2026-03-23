import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/admin/", "/demos/"],
      },
    ],
    sitemap: "https://aledparry.com/sitemap.xml",
  };
}
