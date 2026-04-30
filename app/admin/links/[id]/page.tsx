import { prisma } from "@/lib/prisma";
import { getLinkStats } from "@/lib/analytics";
import { FullLineChart } from "@/components/admin/charts/FullLineChart";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

export default async function LinkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { id } = await params;
  const { days: daysParam } = await searchParams;
  const days = Math.min(Math.max(parseInt(daysParam ?? "30"), 7), 90);

  const [link, { total: periodClicks, clicksOverTime }] = await Promise.all([
    prisma.affiliateLink.findUnique({
      where: { id },
      include: {
        _count: { select: { clicks: true } },
        articles: {
          include: {
            article: {
              select: {
                id: true, title: true, slug: true, status: true,
                _count: { select: { linkClicks: { where: { linkId: id } } } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getLinkStats(id, days),
  ]);

  if (!link) notFound();

  return (
    <div className="p-8">
      <Link href="/admin/links" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Affiliate Links
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-gray-900">{link.name}</h1>
            <div className={`w-2 h-2 rounded-full ${link.isActive ? "bg-green-400" : "bg-gray-300"}`} />
          </div>
          {link.program && <p className="text-sm text-gray-500">{link.program}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-2">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={`/admin/links/${id}?days=${p.value}`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  days === p.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
          <a
            href={link.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={14} /> Open URL
          </a>
          <Link
            href={`/admin/links/${id}/edit`}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Pencil size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">All-time clicks</p>
          <p className="text-3xl font-semibold text-gray-900">{link._count.clicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Clicks ({days}d)</p>
          <p className="text-3xl font-semibold text-gray-900">{periodClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Used in articles</p>
          <p className="text-3xl font-semibold text-gray-900">{link.articles.length}</p>
        </div>
        {link.commission && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">Commission</p>
            <p className="text-3xl font-semibold text-gray-900">{Number(link.commission)}%</p>
          </div>
        )}
      </div>

      {/* Clicks trend chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Clicks over time ({days}d)</h2>
        <FullLineChart
          data={clicksOverTime}
          series={[{ key: "clicks", label: "Clicks", color: "#111827" }]}
          height={200}
        />
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-3 max-w-xl">
        <Row label="Destination URL">
          <a href={link.targetUrl} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline break-all text-sm">
            {link.targetUrl}
          </a>
        </Row>
        {link.displayLabel && <Row label="Default anchor text"><span className="text-sm">{link.displayLabel}</span></Row>}
        {link.category && <Row label="Category"><span className="text-sm">{link.category}</span></Row>}
        <Row label="Added"><span className="text-sm">{formatDate(link.createdAt)}</span></Row>
        {link.notes && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{link.notes}</p>
          </div>
        )}
      </div>

      {/* Articles using this link */}
      {link.articles.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Articles using this link</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Article</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Clicks from here</th>
                </tr>
              </thead>
              <tbody>
                {link.articles.map(({ article }) => (
                  <tr key={article.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/articles/${article.id}/edit`} className="font-medium text-gray-900 hover:underline">
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={article.status} /></td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {article._count.linkClicks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs font-medium text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
