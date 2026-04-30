import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, ExternalLink, BarChart2, Pencil } from "lucide-react";
import { LinkDeleteButton } from "@/components/admin/LinkDeleteButton";

export default async function LinksPage() {
  const links = await prisma.affiliateLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true, articles: true } } },
  });

  const active = links.filter((l) => l.isActive).length;

  return (
    <div className="p-8">
      <PageHeader
        title="Affiliate Links"
        description={`${links.length} total · ${active} active`}
        action={
          <Link
            href="/admin/links/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            New link
          </Link>
        }
      />

      {links.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ExternalLink size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500">No affiliate links yet</p>
          <p className="text-sm mt-1">
            <Link href="/admin/links/new" className="text-gray-900 underline underline-offset-2">
              Add your first link
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Name</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Program</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Articles</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Clicks</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Added</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${link.isActive ? "bg-green-400" : "bg-gray-300"}`}
                        title={link.isActive ? "Active" : "Inactive"}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{link.name}</p>
                        {link.displayLabel && (
                          <p className="text-xs text-gray-400">{link.displayLabel}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {link.program ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {link._count.articles}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 hidden md:table-cell">
                    {link._count.clicks}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {formatDate(link.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/links/${link.id}`}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                        title="Details"
                      >
                        <BarChart2 size={15} />
                      </Link>
                      <Link
                        href={`/admin/links/${link.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </Link>
                      <a
                        href={link.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                        title="Open destination URL"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <LinkDeleteButton id={link.id} name={link.name} />
                    </div>
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
