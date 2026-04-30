import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import Link from "next/link";
import { PenSquare, Plus, Eye, BarChart2 } from "lucide-react";
import { ArticleDeleteButton } from "@/components/admin/ArticleDeleteButton";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? "1");
  const limit = 20;

  const where = status ? { status: status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED" } : {};

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        _count: { select: { pageViews: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const statuses = ["", "DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"];

  return (
    <div className="p-8">
      <PageHeader
        title="Articles"
        description={`${total} total`}
        action={
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            New article
          </Link>
        }
      />

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {statuses.map((s) => {
          const label = s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase();
          const active = (status ?? "") === s;
          return (
            <Link
              key={s}
              href={s ? `/admin/articles?status=${s}` : "/admin/articles"}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <PenSquare size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500">No articles yet</p>
          <p className="text-sm mt-1">
            <Link href="/admin/articles/new" className="text-gray-900 underline underline-offset-2">
              Write your first article
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Title</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Updated</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 line-clamp-1">{article.title}</span>
                      {article.featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">/blog/{article.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {article.category?.name ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {formatDate(article.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {article.status === "PUBLISHED" && (
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                          title="View"
                        >
                          <Eye size={15} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/articles/${article.id}/analytics`}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                        title="Analytics"
                      >
                        <BarChart2 size={15} />
                      </Link>
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                        title="Edit"
                      >
                        <PenSquare size={15} />
                      </Link>
                      <ArticleDeleteButton id={article.id} title={article.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/articles?${status ? `status=${status}&` : ""}page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium ${
                p === page ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
