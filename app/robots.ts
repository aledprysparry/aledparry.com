import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/demos/",
      },
    ],
    sitemap: "https://aledparry.com/sitemap.xml",
  };
}
