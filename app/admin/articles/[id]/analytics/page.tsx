import { prisma } from "@/lib/prisma";
import { getArticleStats } from "@/lib/analytics";
import { FullLineChart } from "@/components/admin/charts/FullLineChart";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2, Link2, MousePointerClick } from "lucide-react";

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

export default async function ArticleAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { id } = await params;
  const { days: daysParam } = await searchParams;
  const days = Math.min(Math.max(parseInt(daysParam ?? "30"), 7), 90);

  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      title: true,
      slug: true,
      _count: { select: { pageViews: true, linkClicks: true } },
    },
  });

  if (!article) notFound();

  const { views, clicks, viewsOverTime, linkBreakdown } = await getArticleStats(id, days);

  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8">
      <Link
        href={`/admin/articles/${id}/edit`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> {article.title}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/articles/${id}/analytics?days=${p.value}`}
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Views ({days}d)</span>
            <BarChart2 size={15} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{views.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Clicks ({days}d)</span>
            <Link2 size={15} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{clicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">CTR ({days}d)</span>
            <MousePointerClick size={15} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{ctr}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">All-time views</span>
            <BarChart2 size={15} className="text-gray-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {article._count.pageViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Views chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Views over time</h2>
        <FullLineChart
          data={viewsOverTime}
          series={[{ key: "views", label: "Views", color: "#111827" }]}
          height={220}
        />
      </div>

      {/* Per-link click breakdown */}
      {linkBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Affiliate link clicks ({days}d)
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 py-2">Link</th>
                <th className="text-right font-medium text-gray-500 py-2">Clicks</th>
                <th className="text-right font-medium text-gray-500 py-2">Share</th>
              </tr>
            </thead>
            <tbody>
              {linkBreakdown.map((l) => (
                <tr key={l.linkId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5">
                    <Link
                      href={`/admin/links/${l.linkId}`}
                      className="text-gray-700 hover:text-gray-900 hover:underline"
                    >
                      {l.name}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    {l.clicks.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-gray-500">
                    {clicks > 0 ? ((l.clicks / clicks) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
