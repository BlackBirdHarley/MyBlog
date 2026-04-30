import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/public/ArticleCard";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog" };

const PER_PAGE = 12;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}) {
  const { page: pageStr, category: categorySlug, tag: tagSlug } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));

  const where = {
    status: "PUBLISHED" as const,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
  };

  const [articles, total, categories] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        slug: true, title: true, excerpt: true, publishedAt: true,
        heroImage: { select: { url: true, altText: true } },
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
      },
    }),
    prisma.article.count({ where }),
    prisma.category.findMany({
      where: { articles: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      {/* Page header */}
      <div className="px-8 lg:px-12 pt-14 pb-10 border-b border-[#E7ECEF]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#FF9B7A] font-semibold mb-3">
          The Blog
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1 className="text-3xl lg:text-[40px] font-bold text-[#1E252B] tracking-tight leading-tight">
            All Articles
          </h1>
          <span className="text-[13px] text-[#9AA3AA]">
            {total} article{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="px-8 lg:px-12 py-5 border-b border-[#E7ECEF] flex items-center gap-2.5 overflow-x-auto scrollbar-none">
          <Link
            href="/blog"
            className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              !categorySlug
                ? "bg-[#26313A] text-white"
                : "border border-[#E4E9EC] text-[#7D8790] hover:border-[#26313A] hover:text-[#1E252B]"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/blog?category=${c.slug}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors whitespace-nowrap ${
                categorySlug === c.slug
                  ? "bg-[#26313A] text-white"
                  : "border border-[#E4E9EC] text-[#7D8790] hover:border-[#26313A] hover:text-[#1E252B]"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Articles grid */}
      <div className="px-8 lg:px-12 py-10 pb-16">
        {articles.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#E4E9EC] rounded-[18px]">
            <p className="text-[13px] text-[#9AA3AA]">No articles found.</p>
            <Link href="/blog" className="mt-4 inline-flex text-[11px] font-semibold text-[#FF9B7A] uppercase tracking-[0.08em] hover:underline">
              Clear filters →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (p > 1) params.set("page", String(p));
              if (categorySlug) params.set("category", categorySlug);
              if (tagSlug) params.set("tag", tagSlug);
              const href = `/blog${params.size ? `?${params}` : ""}`;
              return (
                <Link
                  key={p}
                  href={href}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-[12px] font-semibold transition-all ${
                    p === page
                      ? "bg-[#26313A] text-white"
                      : "text-[#7D8790] hover:bg-[#F0F4F6] hover:text-[#1E252B]"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
