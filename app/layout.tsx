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
    default: "Aled Parry — Digital Producer & Creative Director",
    template: "%s | Aled Parry - Digital Producer & Creative Director",
  },
  description:
    "Welsh/English digital producer and creative director. I lead broadcast, interactive and bilingual content projects for commissioners, agencies and brands across the UK.",
  keywords: [
    "digital producer Wales",
    "creative director Wales",
    "digital producer UK",
    "creative director UK",
    "Welsh English bilingual content",
    "TV digital producer",
    "children's digital content producer",
    "interactive format development",
    "S4C digital production",
    "bilingual content strategy",
  ],
  authors: [{ name: "Aled Parry", url: "https://aledparry.com" }],
  creator: "Aled Parry",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://aledparry.com",
    siteName: "Aled Parry",
    images: [{ url: "/og-image", width: 1200, height: 630, alt: "Aled Parry — Digital Producer & Creative Director" }],
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
