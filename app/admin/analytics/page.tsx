import {
  getArticleStats,
  getOverviewStats,
  getViewsOverTime,
  getTopArticles,
  getTopLinks,
  getDeviceBreakdown,
  getBrowserBreakdown,
  getTopReferrers,
} from "@/lib/analytics";
import { FullLineChart } from "@/components/admin/charts/FullLineChart";
import { PieBreakdown } from "@/components/admin/charts/PieBreakdown";
import { prisma } from "@/lib/prisma";
import { BarChart2, FileText, Link2, TrendingUp, TrendingDown, Minus, Layers3 } from "lucide-react";
import Link from "next/link";

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">-</span>;
  if (value === 0) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus size={12} /> 0%</span>;
  return value > 0 ? (
    <span className="flex items-center gap-0.5 text-xs text-emerald-600"><TrendingUp size={12} /> +{value}%</span>
  ) : (
    <span className="flex items-center gap-0.5 text-xs text-red-500"><TrendingDown size={12} /> {value}%</span>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; articleId?: string }>;
}) {
  const { days: daysParam, articleId } = await searchParams;
  const days = Math.min(Math.max(parseInt(daysParam ?? "30"), 7), 90);
  const selectedArticleId = articleId || "";

  const [articles, selectedArticle, stats, viewsOverTime, topArticles, topLinks, devices, browsers, referrers, selectedStats] =
    await Promise.all([
      getAnalyticsArticles(),
      selectedArticleId
        ? prisma.article.findUnique({
            where: { id: selectedArticleId },
            select: { id: true, title: true, slug: true, status: true },
          })
        : Promise.resolve(null),
      selectedArticleId ? Promise.resolve(null) : getOverviewStats(days),
      selectedArticleId ? Promise.resolve([]) : getViewsOverTime(days),
      selectedArticleId ? Promise.resolve([]) : getTopArticles(days, 10),
      selectedArticleId ? Promise.resolve([]) : getTopLinks(days, 10),
      selectedArticleId ? Promise.resolve([]) : getDeviceBreakdown(days),
      selectedArticleId ? Promise.resolve([]) : getBrowserBreakdown(days),
      selectedArticleId ? Promise.resolve([]) : getTopReferrers(days, 10),
      selectedArticleId ? getArticleStats(selectedArticleId, days).catch(() => null) : Promise.resolve(null),
    ]);
  const isArticleView = Boolean(selectedArticleId && selectedArticle);
  const activeStats = isArticleView && selectedStats
    ? { views: selectedStats.views, viewsDelta: null, clicks: selectedStats.clicks, clicksDelta: null, articles: 1 }
    : stats ?? { views: 0, viewsDelta: null, clicks: 0, clicksDelta: null, articles: 0 };
  const activeViewsOverTime = isArticleView && selectedStats ? selectedStats.viewsOverTime : viewsOverTime;
  const activeLinkBreakdown = isArticleView && selectedStats ? selectedStats.linkBreakdown : topLinks;
  const activeTitle = selectedArticle?.title ?? "Analytics";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isArticleView ? activeTitle : "Analytics"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isArticleView ? "Analytics for the selected article only." : "All article analytics across the site."}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/analytics?days=${p.value}${selectedArticleId ? `&articleId=${selectedArticleId}` : ""}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === p.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <aside className="xl:sticky xl:top-6 xl:self-start bg-white border border-gray-200 rounded-xl p-3">
          <Link
            href={`/admin/analytics?days=${days}`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              !selectedArticleId ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Layers3 size={15} />
            All articles
          </Link>
          <div className="mt-3 max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto pr-1">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/analytics?days=${days}&articleId=${article.id}`}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedArticleId === article.id ? "bg-[#edf4ed] text-gray-950" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="block truncate font-medium">{article.title}</span>
                <span className="mt-0.5 block text-xs text-gray-400">
                  {article._count.pageViews.toLocaleString()} views · {article._count.linkClicks.toLocaleString()} clicks
                </span>
              </Link>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Page views</span>
                <BarChart2 size={16} className="text-gray-400" />
              </div>
              <p className="text-3xl font-semibold text-gray-900">{activeStats.views.toLocaleString()}</p>
              <div className="mt-1"><Delta value={activeStats.viewsDelta} /></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Affiliate clicks</span>
                <Link2 size={16} className="text-gray-400" />
              </div>
              <p className="text-3xl font-semibold text-gray-900">{activeStats.clicks.toLocaleString()}</p>
              <div className="mt-1"><Delta value={activeStats.clicksDelta} /></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{isArticleView ? "Selected article" : "Published articles"}</span>
                <FileText size={16} className="text-gray-400" />
              </div>
              <p className="text-3xl font-semibold text-gray-900">{activeStats.articles.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Page views over time</h2>
            <FullLineChart
              data={activeViewsOverTime}
              series={[{ key: "views", label: "Views", color: "#111827" }]}
              height={220}
            />
          </div>

          {isArticleView ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Affiliate links in this article</h2>
              {activeLinkBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">No clicks for this article yet.</p>
              ) : (
                <ol className="space-y-2">
                  {activeLinkBreakdown.map((l, i) => (
                    <li key={l.linkId} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                      <span className="flex-1 truncate text-gray-700">{l.name}</span>
                      <span className="text-gray-500 shrink-0 font-medium">{l.clicks.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-4">Top articles</h2>
                  {topArticles.length === 0 ? (
                    <p className="text-sm text-gray-400">No data yet.</p>
                  ) : (
                    <ol className="space-y-2">
                      {topArticles.map((a, i) => (
                        <li key={a.articleId} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                          <Link
                            href={`/admin/analytics?days=${days}&articleId=${a.articleId}`}
                            className="flex-1 truncate text-gray-700 hover:text-gray-900"
                          >
                            {a.title}
                          </Link>
                          <span className="text-gray-500 shrink-0 font-medium">{a.views.toLocaleString()}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-4">Top affiliate links</h2>
                  {topLinks.length === 0 ? (
                    <p className="text-sm text-gray-400">No data yet.</p>
                  ) : (
                    <ol className="space-y-2">
                      {topLinks.map((l, i) => (
                        <li key={l.linkId} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                          <Link
                            href={`/admin/links/${l.linkId}`}
                            className="flex-1 truncate text-gray-700 hover:text-gray-900"
                          >
                            {l.name}
                          </Link>
                          <span className="text-gray-500 shrink-0 font-medium">{l.clicks.toLocaleString()}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Device breakdown</h2>
                  {devices.length === 0 ? (
                    <p className="text-sm text-gray-400">No data yet.</p>
                  ) : (
                    <PieBreakdown data={devices.map((d) => ({ name: d.device, value: d.count }))} />
                  )}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Browser breakdown</h2>
                  {browsers.length === 0 ? (
                    <p className="text-sm text-gray-400">No data yet.</p>
                  ) : (
                    <PieBreakdown data={browsers.map((b) => ({ name: b.browser, value: b.count }))} />
                  )}
                </div>
              </div>

              {referrers.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-4">Top referrers</h2>
                  <ol className="space-y-2">
                    {referrers.map((r, i) => (
                      <li key={r.referrer} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                        <span className="flex-1 truncate text-gray-700">{r.referrer}</span>
                        <span className="text-gray-500 shrink-0 font-medium">{r.count.toLocaleString()}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function getAnalyticsArticles() {
  return prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      _count: { select: { pageViews: true, linkClicks: true } },
    },
  });
}
