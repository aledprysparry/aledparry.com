export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Aled Parry",
    jobTitle: "Digital Producer & Creative Director",
    url: "https://aledparry.com",
    sameAs: ["https://linkedin.com/in/aledparry"],
    knowsLanguage: ["en", "cy"],
    description:
      "Award-winning Welsh/English digital producer and creative director specialising in broadcast, interactive formats and bilingual content.",
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
