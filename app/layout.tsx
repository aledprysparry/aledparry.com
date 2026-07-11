import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider } from "@/lib/i18n/context";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aledparry.com"),
  title: {
    default: "Aled Parry – Creative Technologist, Founder & Consultant",
    template: "%s | Aled Parry – Creative Technologist, Founder & Consultant",
  },
  description:
    "Creative technologist, founder and consultant helping broadcasters, brands and bilingual organisations solve complex media, product and workflow challenges. BAFTA-winning background in broadcast and interactive content. Builder of Capsiynau.com and Nodiadau.com.",
  keywords: [
    "creative technologist Wales",
    "product consultant Wales",
    "media consultant UK",
    "product founder Wales",
    "AI product builder UK",
    "bilingual digital products",
    "Welsh language AI tooling",
    "Capsiynau",
    "Nodiadau",
    "format development",
    "broadcast pipeline tooling",
    "S4C digital production",
  ],
  authors: [{ name: "Aled Parry", url: "https://aledparry.com" }],
  creator: "Aled Parry",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://aledparry.com",
    siteName: "Aled Parry",
    images: [{ url: "/og-image", width: 1200, height: 630, alt: "Aled Parry – Creative Technologist, Founder & Consultant" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://aledparry.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-stone-50 text-stone-900 antialiased">
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
