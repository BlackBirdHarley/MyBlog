import {
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
import { BarChart2, FileText, Link2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">—</span>;
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
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = Math.min(Math.max(parseInt(daysParam ?? "30"), 7), 90);

  const [stats, viewsOverTime, topArticles, topLinks, devices, browsers, referrers] =
    await Promise.all([
      getOverviewStats(days),
      getViewsOverTime(days),
      getTopArticles(days, 10),
      getTopLinks(days, 10),
      getDeviceBreakdown(days),
      getBrowserBreakdown(days),
      getTopReferrers(days, 10),
    ]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/analytics?days=${p.value}`}
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Page views</span>
            <BarChart2 size={16} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.views.toLocaleString()}</p>
          <div className="mt-1"><Delta value={stats.viewsDelta} /></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Affiliate clicks</span>
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
        </div>
      </div>

      {/* Views over time */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Page views over time</h2>
        <FullLineChart
          data={viewsOverTime}
          series={[{ key: "views", label: "Views", color: "#111827" }]}
          height={220}
        />
      </div>

      {/* Top articles + top links */}
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
                    href={`/admin/articles/${a.articleId}/analytics`}
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

      {/* Device + Browser breakdown */}
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

      {/* Top referrers */}
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
    </div>
  );
}
