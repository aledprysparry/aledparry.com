export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Aled Parry",
    jobTitle: "Creative Technologist & Consultant",
    url: "https://aledparry.com",
    sameAs: ["https://linkedin.com/in/aledparry"],
    knowsLanguage: ["en", "cy"],
    description:
      "Creative technologist and consultant helping people and organisations figure out what's actually broken, then fixing it with whatever combination of technology, design and process actually helps. BAFTA winner, bilingual in Welsh and English.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "GB",
      addressRegion: "Wales",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
