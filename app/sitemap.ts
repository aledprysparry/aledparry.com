import { MetadataRoute } from "next";

// /work and /work/[slug] are intentionally omitted while the Work page is
// hidden from public nav. Re-add when ready to relaunch.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://aledparry.com";

  return [
    { url: baseUrl, changeFrequency: "monthly" as const, priority: 1 },
    { url: `${baseUrl}/how-we-work`, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/services`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly" as const, priority: 0.6 },
    { url: `${baseUrl}/buan`, changeFrequency: "monthly" as const, priority: 0.8 },
  ];
}
