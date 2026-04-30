import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);

  const siteName = settings?.siteName ?? "My Blog";
  const description = settings?.siteDescription ?? "Helpful guides and product recommendations";
  const siteUrl = settings?.siteUrl ?? process.env.SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      siteName,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      ...(settings?.twitterHandle ? { site: settings.twitterHandle } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-gray-900 font-sans">{children}</body>
    </html>
  );
}
