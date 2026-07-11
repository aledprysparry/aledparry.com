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
    default: "Aled Parry – Digital Innovation Consultant & Creative Technologist",
    template: "%s | Aled Parry – Digital Innovation Consultant & Creative Technologist",
  },
  description:
    "I help business owners, public sector teams and organisations solve difficult problems – sometimes with AI, sometimes automation, sometimes neither. Twenty years turning ideas into working products. Based in Wales, working across the UK.",
  keywords: [
    "digital innovation consultant Wales",
    "AI consultant Wales",
    "AI consultant UK",
    "AI strategy consultant",
    "digital transformation consultant",
    "innovation consultant UK",
    "AI for local government",
    "AI for business",
    "automation consultant",
    "process automation consultant",
    "creative technology consultant",
    "AI workshop Wales",
    "AI discovery session",
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
    images: [{ url: "/og-image", width: 1200, height: 630, alt: "Aled Parry – Digital Innovation Consultant & Creative Technologist" }],
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
