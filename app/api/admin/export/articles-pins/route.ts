import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Article title",
  "Article status",
  "Article URL",
  "Affiliate links",
  "Pin number",
  "Pin title",
  "Pin description",
  "Pin link",
  "Pin topics",
  "Pin image URL",
];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [articles, settings] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      include: {
        articleLinks: {
          include: { link: true },
          orderBy: { createdAt: "asc" },
        },
        pins: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null),
  ]);

  const siteUrl = (settings?.siteUrl || process.env.SITE_URL || "").replace(/\/$/, "");
  const rows = articles.flatMap((article) => {
    const articleUrl = siteUrl ? `${siteUrl}/blog/${article.slug}` : `/blog/${article.slug}`;
    const affiliateLinks = article.articleLinks
      .map(({ link }) => formatAffiliateLink(link.name, link.targetUrl, link.displayLabel))
      .join("\n");
    const pins = article.pins.length > 0 ? article.pins : [null];

    return pins.map((pin, index) => [
      article.title,
      article.status,
      articleUrl,
      affiliateLinks,
      pin ? String(index + 1) : "",
      pin?.title ?? "",
      pin?.description ?? "",
      pin?.linkUrl ?? "",
      pin?.taggedTopics.join(", ") ?? "",
      pin?.imageUrl ?? "",
    ]);
  });

  const csv = "\uFEFF" + [HEADERS, ...rows].map(toCsvRow).join("\r\n");
  const filename = `articles-pins-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function formatAffiliateLink(name: string, targetUrl: string, displayLabel: string | null) {
  return `${displayLabel || name}: ${targetUrl}`;
}

function toCsvRow(values: string[]) {
  return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(",");
}
