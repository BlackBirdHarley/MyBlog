import { auth } from "@/lib/auth";
import {
  getOverviewStats,
  getViewsOverTime,
  getTopArticles,
  getTopLinks,
} from "@/lib/analytics";
import { FileText, Link2, BarChart2, PenSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { MiniLineChart } from "@/components/admin/charts/MiniLineChart";

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

export default async function AdminDashboard() {
  const session = await auth();

  let stats = { views: 0, viewsDelta: null as number | null, clicks: 0, clicksDelta: null as number | null, articles: 0 };
  let viewsOverTime: { date: string; views: number }[] = [];
  let topArticles: Awaited<ReturnType<typeof getTopArticles>> = [];
  let topLinks: Awaited<ReturnType<typeof getTopLinks>> = [];

  try {
    [stats, viewsOverTime, topArticles, topLinks] = await Promise.all([
      getOverviewStats(30),
      getViewsOverTime(30),
      getTopArticles(30, 5),
      getTopLinks(30, 5),
    ]);
  } catch {
    // DB not yet connected — show placeholders
  }

  const hasData = viewsOverTime.some((d) => d.views > 0);

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

      {/* Views chart */}
      {hasData && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-10">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Page views — last 30 days</h2>
          <MiniLineChart data={viewsOverTime} dataKey="views" />
        </div>
      )}

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
                      href={`/admin/articles/${a.articleId}`}
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
