export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Aled Parry",
    jobTitle: "Digital Innovation Consultant & Creative Technologist",
    url: "https://aledparry.com",
    sameAs: ["https://linkedin.com/in/aledparry"],
    knowsLanguage: ["en", "cy"],
    description:
      "Digital innovation consultant and creative technologist helping business owners, public sector teams and organisations solve difficult problems with AI, automation and process design. BAFTA winner, bilingual in Welsh and English.",
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
