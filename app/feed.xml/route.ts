import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const siteName = settings?.siteName ?? "My Blog";

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: { slug: true, title: true, excerpt: true, publishedAt: true, updatedAt: true },
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(settings?.siteDescription ?? siteName)}</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles
      .map(
        (a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${siteUrl}/blog/${a.slug}</link>
      <guid>${siteUrl}/blog/${a.slug}</guid>
      ${a.excerpt ? `<description>${escapeXml(a.excerpt)}</description>` : ""}
      ${a.publishedAt ? `<pubDate>${a.publishedAt.toUTCString()}</pubDate>` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
