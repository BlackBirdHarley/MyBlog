import { prisma } from "@/lib/prisma";

export type Granularity = "day" | "week" | "month";

function dateRange(days: number): { gte: Date } {
  return { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
}

// ---------- overview ----------

export async function getOverviewStats(days = 30) {
  const since = dateRange(days);
  const prevSince = { gte: new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000) };
  const prevUntil = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [views, prevViews, clicks, prevClicks, articles] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: since } }),
    prisma.pageView.count({ where: { createdAt: { gte: prevSince.gte, lt: prevUntil } } }),
    prisma.linkClick.count({ where: { createdAt: since } }),
    prisma.linkClick.count({ where: { createdAt: { gte: prevSince.gte, lt: prevUntil } } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
  ]);

  return {
    views,
    viewsDelta: prevViews > 0 ? Math.round(((views - prevViews) / prevViews) * 100) : null,
    clicks,
    clicksDelta: prevClicks > 0 ? Math.round(((clicks - prevClicks) / prevClicks) * 100) : null,
    articles,
  };
}

// ---------- views over time ----------

export async function getViewsOverTime(days = 30): Promise<{ date: string; views: number }[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const counts: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    counts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts).map(([date, views]) => ({ date, views }));
}

// ---------- top articles ----------

export async function getTopArticles(days = 30, limit = 10) {
  const since = dateRange(days);
  const rows = await prisma.pageView.groupBy({
    by: ["articleId"],
    where: { articleId: { not: null }, createdAt: since },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const ids = rows.map((r) => r.articleId!);
  const articles = await prisma.article.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, slug: true },
  });
  const articleMap = Object.fromEntries(articles.map((a) => [a.id, a]));

  return rows.map((r) => ({
    articleId: r.articleId,
    views: r._count.id,
    title: articleMap[r.articleId!]?.title ?? "Unknown",
    slug: articleMap[r.articleId!]?.slug ?? "",
  }));
}

// ---------- top links ----------

export async function getTopLinks(days = 30, limit = 10) {
  const since = dateRange(days);
  const rows = await prisma.linkClick.groupBy({
    by: ["linkId"],
    where: { createdAt: since },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const ids = rows.map((r) => r.linkId);
  const links = await prisma.affiliateLink.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, targetUrl: true, program: true },
  });
  const linkMap = Object.fromEntries(links.map((l) => [l.id, l]));

  return rows.map((r) => ({
    linkId: r.linkId,
    clicks: r._count.id,
    name: linkMap[r.linkId]?.name ?? "Unknown",
    targetUrl: linkMap[r.linkId]?.targetUrl ?? "",
    program: linkMap[r.linkId]?.program ?? null,
  }));
}

// ---------- device breakdown ----------

export async function getDeviceBreakdown(days = 30) {
  const since = dateRange(days);
  const rows = await prisma.pageView.groupBy({
    by: ["device"],
    where: { createdAt: since },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return rows.map((r) => ({ device: r.device ?? "unknown", count: r._count.id }));
}

// ---------- browser breakdown ----------

export async function getBrowserBreakdown(days = 30) {
  const since = dateRange(days);
  const rows = await prisma.pageView.groupBy({
    by: ["browser"],
    where: { createdAt: since },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return rows.map((r) => ({ browser: r.browser ?? "unknown", count: r._count.id }));
}

// ---------- referrer breakdown ----------

export async function getTopReferrers(days = 30, limit = 10) {
  const since = dateRange(days);
  const rows = await prisma.pageView.findMany({
    where: { referrer: { not: null }, createdAt: since },
    select: { referrer: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.referrer) continue;
    let host = row.referrer;
    try {
      host = new URL(row.referrer).hostname.replace(/^www\./, "");
    } catch {}
    counts[host] = (counts[host] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([referrer, count]) => ({ referrer, count }));
}

// ---------- per-article stats ----------

export async function getArticleStats(articleId: string, days = 30) {
  const since = dateRange(days);
  const [views, clicks, viewsOverTime, linkBreakdown] = await Promise.all([
    prisma.pageView.count({ where: { articleId, createdAt: since } }),
    prisma.linkClick.count({ where: { articleId, createdAt: since } }),
    getArticleViewsOverTime(articleId, days),
    getArticleLinkBreakdown(articleId, days),
  ]);
  return { views, clicks, viewsOverTime, linkBreakdown };
}

async function getArticleViewsOverTime(articleId: string, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.pageView.findMany({
    where: { articleId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const counts: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    counts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([date, views]) => ({ date, views }));
}

async function getArticleLinkBreakdown(articleId: string, days: number) {
  const since = dateRange(days);
  const rows = await prisma.linkClick.groupBy({
    by: ["linkId"],
    where: { articleId, createdAt: since },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const ids = rows.map((r) => r.linkId);
  const links = await prisma.affiliateLink.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const linkMap = Object.fromEntries(links.map((l) => [l.id, l]));
  return rows.map((r) => ({
    linkId: r.linkId,
    clicks: r._count.id,
    name: linkMap[r.linkId]?.name ?? "Unknown",
  }));
}

// ---------- per-link stats ----------

export async function getLinkStats(linkId: string, days = 30) {
  const since = dateRange(days);
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [total, rows] = await Promise.all([
    prisma.linkClick.count({ where: { linkId, createdAt: since } }),
    prisma.linkClick.findMany({
      where: { linkId, createdAt: { gte: sinceDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(sinceDate.getTime() + i * 24 * 60 * 60 * 1000);
    counts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return {
    total,
    clicksOverTime: Object.entries(counts).map(([date, clicks]) => ({ date, clicks })),
  };
}
