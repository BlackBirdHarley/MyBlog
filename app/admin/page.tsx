import { auth } from "@/lib/auth";
import {
  getOverviewStats,
  getArticleStats,
  getTopArticles,
  getTopLinks,
} from "@/lib/analytics";
import { FileText, Link2, BarChart2, PenSquare, TrendingUp, TrendingDown, Minus, ImageIcon } from "lucide-react";
import Link from "next/link";
import { FullLineChart } from "@/components/admin/charts/FullLineChart";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

type DashboardArticle = Awaited<ReturnType<typeof getDashboardArticles>>[number];

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">no prior data</span>;
  if (value === 0) return (
    <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus size={12} /> 0%</span>
  );
  return value > 0 ? (
    <span className="flex items-center gap-0.5 text-xs text-emerald-600">
      <TrendingUp size={12} /> +{value}%
    </span>
  ) : (
    <span className="flex items-center gap-0.5 text-xs text-red-500">
      <TrendingDown size={12} /> {value}%
    </span>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string }>;
}) {
  const session = await auth();
  const { articleId } = await searchParams;

  let stats = { views: 0, viewsDelta: null as number | null, clicks: 0, clicksDelta: null as number | null, articles: 0 };
  let topArticles: Awaited<ReturnType<typeof getTopArticles>> = [];
  let topLinks: Awaited<ReturnType<typeof getTopLinks>> = [];
  let articleList: DashboardArticle[] = [];

  try {
    [stats, topArticles, topLinks, articleList] = await Promise.all([
      getOverviewStats(30),
      getTopArticles(30, 5),
      getTopLinks(30, 5),
      getDashboardArticles(),
    ]);
  } catch {
    // DB not yet connected - show placeholders
  }

  const selectedArticleId = articleId && articleList.some((a) => a.id === articleId)
    ? articleId
    : articleList[0]?.id;
  const selectedArticle = selectedArticleId
    ? await prisma.article.findUnique({
        where: { id: selectedArticleId },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          pins: { orderBy: { sortOrder: "asc" } },
        },
      })
    : null;
  const selectedStats = selectedArticleId ? await getArticleStats(selectedArticleId, 30).catch(() => null) : null;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <BarChart2 size={14} /> Full analytics
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-4 bg-gray-900 text-white rounded-xl p-5 hover:bg-gray-800 transition-colors"
        >
          <div className="bg-gray-700 rounded-lg p-2.5">
            <PenSquare size={20} />
          </div>
          <div>
            <p className="font-medium">Write new article</p>
            <p className="text-sm text-gray-400">Start drafting a post</p>
          </div>
        </Link>
        <Link
          href="/admin/links/new"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="bg-gray-100 rounded-lg p-2.5 text-gray-600">
            <Link2 size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Add affiliate link</p>
            <p className="text-sm text-gray-500">Register a new link</p>
          </div>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Page views (30d)</span>
            <BarChart2 size={16} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.views.toLocaleString()}</p>
          <div className="mt-1"><Delta value={stats.viewsDelta} /></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Affiliate clicks (30d)</span>
            <Link2 size={16} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.clicks.toLocaleString()}</p>
          <div className="mt-1"><Delta value={stats.clicksDelta} /></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Published articles</span>
            <FileText size={16} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.articles.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">total live posts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 mb-10">
        <section className="bg-white border border-gray-200 rounded-xl p-5 min-w-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-700">Selected article views</h2>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {selectedArticle?.title ?? "No articles yet"}
              </p>
              {selectedArticle && (
                <p className="mt-0.5 text-xs text-gray-400">/blog/{selectedArticle.slug}</p>
              )}
            </div>
            {selectedArticle && (
              <Link
                href={`/admin/articles/${selectedArticle.id}/analytics`}
                className="shrink-0 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <BarChart2 size={14} /> Details
              </Link>
            )}
          </div>

          {selectedStats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">Views (30d)</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedStats.views.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">Clicks (30d)</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedStats.clicks.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">CTR (30d)</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedStats.views > 0 ? ((selectedStats.clicks / selectedStats.views) * 100).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
              <FullLineChart
                data={selectedStats.viewsOverTime}
                series={[{ key: "views", label: "Views", color: "#111827" }]}
                height={260}
              />
            </>
          ) : (
            <div className="h-72 flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
              Select an article to see its traffic.
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Pinned images for this article</h3>
              {selectedArticle && (
                <Link
                  href={`/admin/articles/${selectedArticle.id}/edit`}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Edit pins
                </Link>
              )}
            </div>
            {selectedArticle?.pins.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedArticle.pins.map((pin, index) => (
                  <div key={pin.id} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <div className="relative aspect-[2/3] bg-gray-100">
                      <Image
                        src={pin.imageUrl}
                        alt={pin.altText ?? pin.description ?? `Pin ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 180px"
                      />
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-xs text-gray-500">
                        {pin.description || `Pin ${index + 1}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-10 text-sm text-gray-400">
                <ImageIcon size={16} />
                No pins linked to this article yet.
              </div>
            )}
          </div>
        </section>

        <aside className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-medium text-gray-700">Articles</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click an article to update the chart.</p>
          </div>
          <div className="max-h-[720px] overflow-y-auto">
            {articleList.length > 0 ? (
              articleList.map((article) => {
                const active = article.id === selectedArticleId;
                return (
                  <Link
                    key={article.id}
                    href={`/admin?articleId=${article.id}`}
                    className={`block border-b border-gray-50 px-4 py-3 transition-colors ${
                      active ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`line-clamp-2 text-sm font-medium ${active ? "text-white" : "text-gray-900"}`}>
                          {article.title}
                        </p>
                        <p className={`mt-1 truncate text-xs ${active ? "text-gray-300" : "text-gray-400"}`}>
                          {article.status.toLowerCase()} / {article.slug}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${active ? "text-gray-200" : "text-gray-500"}`}>
                        {article._count.pageViews.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No articles yet.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Top articles + top links */}
      {(topArticles.length > 0 || topLinks.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topArticles.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Top articles (30d)</h2>
              <ol className="space-y-2">
                {topArticles.map((a, i) => (
                  <li key={a.articleId} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                    <Link
                      href={`/admin/articles/${a.articleId}/edit`}
                      className="flex-1 truncate text-gray-700 hover:text-gray-900"
                    >
                      {a.title}
                    </Link>
                    <span className="text-gray-500 shrink-0">{a.views.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {topLinks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Top affiliate links (30d)</h2>
              <ol className="space-y-2">
                {topLinks.map((l, i) => (
                  <li key={l.linkId} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                    <Link
                      href={`/admin/links/${l.linkId}`}
                      className="flex-1 truncate text-gray-700 hover:text-gray-900"
                    >
                      {l.name}
                    </Link>
                    <span className="text-gray-500 shrink-0">{l.clicks.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDashboardArticles() {
  return prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      _count: { select: { pageViews: true } },
    },
  });
}
