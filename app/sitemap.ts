import { MetadataRoute } from "next";
import { getCaseStudies } from "@/lib/mdx/get-case-studies";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://aledparry.com";

  const staticPages = [
    { url: baseUrl, changeFrequency: "monthly" as const, priority: 1 },
    { url: `${baseUrl}/work`, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/services`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly" as const, priority: 0.6 },
  ];

  const caseStudies = getCaseStudies().map((cs) => ({
    url: `${baseUrl}/work/${cs.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...caseStudies];
}
