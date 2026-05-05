import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/public/ArticleCard";
import { HeroSection } from "@/components/public/HeroSection";
import { buildWebSiteJsonLd, jsonLdScript } from "@/lib/jsonld";
import { extractText } from "@/lib/content-renderer";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PER_PAGE = 15; // 3 cols x 5 rows

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));

  const [heroArticle, gridArticles, totalCount, categories, settings] = await Promise.all([
    // Latest article - always the hero (include content for description fallback)
    prisma.article.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true, title: true, excerpt: true, content: true, metaDescription: true, publishedAt: true,
        heroImage: { select: { url: true, altText: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    // Grid: remaining articles, skip hero + previous pages
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: 1 + (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        slug: true, title: true, excerpt: true, publishedAt: true,
        heroImage: { select: { url: true, altText: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null),
  ]);

  const siteName = settings?.siteName ?? "My Blog";
  const siteUrl = settings?.siteUrl ?? process.env.SITE_URL ?? "http://localhost:3000";
  const siteDescription = settings?.siteDescription ?? undefined;
  const webSiteJsonLd = buildWebSiteJsonLd({ siteName, siteUrl, description: siteDescription });

  const activeCategories = categories.filter((c) => c._count.articles > 0);

  // Description priority: metaDescription -> excerpt -> first ~200 chars of body
  const heroDescription = heroArticle
    ? (heroArticle.metaDescription?.trim() ||
        heroArticle.excerpt?.trim() ||
        extractText(heroArticle.content as object).slice(0, 200).trim() ||
        null)
    : null;
  // Total pages for the grid (total minus hero article)
  const totalGridArticles = Math.max(0, totalCount - 1);
  const totalPages = Math.ceil(totalGridArticles / PER_PAGE);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(webSiteJsonLd) }} />

      {/* Hero - latest article, page 1 only */}
      {page === 1 && (
        <HeroSection article={heroArticle} siteName={siteName} siteDescription={siteDescription} heroDescription={heroDescription} />
      )}

      {/* Page 2+ header */}
      {page > 1 && (
        <div className="mx-auto max-w-7xl px-5 pb-2 pt-12 sm:px-8 lg:px-10">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#49685a]">
            All Articles
          </p>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#17201b] lg:text-[28px]">
            Page {page} of {totalPages}
          </h1>
        </div>
      )}

      {/* Category strip */}
      {activeCategories.length > 0 && (
        <div className="border-b border-[#dfe8e0] bg-[#fbfcf9]">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5 overflow-x-auto px-5 py-5 sm:px-8 lg:px-10 scrollbar-none">
          <Link
            href="/"
            className="shrink-0 rounded-lg bg-[#17201b] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white"
          >
            All
          </Link>
          {activeCategories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="shrink-0 whitespace-nowrap rounded-lg border border-[#dfe8e0] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#66736b] transition-colors hover:border-[#49685a] hover:text-[#17201b]"
            >
              {c.name}
              <span className="ml-1.5 text-[#8d9a91]">{c._count.articles}</span>
            </Link>
          ))}
        </div>
        </div>
      )}

      {/* Articles grid */}
      <section className="mx-auto max-w-7xl px-5 py-12 pb-16 sm:px-8 lg:px-10">
        {totalCount === 0 ? (
          <div className="rounded-lg border border-dashed border-[#dfe8e0] bg-white py-24 text-center">
            <p className="text-[13px] text-[#8d9a91]">No articles published yet.</p>
          </div>
        ) : gridArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[13px] text-[#8d9a91]">No more articles.</p>
            <Link href="/" className="mt-4 inline-flex text-[11px] font-semibold uppercase tracking-[0.08em] text-[#e9785f] hover:underline">
              Back to start
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gridArticles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={page === 2 ? "/" : `/?page=${page - 1}`}
                className="rounded-lg border border-[#dfe8e0] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#66736b] transition-colors hover:border-[#49685a] hover:text-[#17201b]"
              >
                Prev
              </Link>
            )}

            <div className="flex items-center gap-1.5">
              {buildPageRange(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-[13px] text-[#8d9a91]">
                    ...
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={p === 1 ? "/" : `/?page=${p}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-semibold transition-all ${
                      p === page
                        ? "bg-[#17201b] text-white"
                        : "text-[#66736b] hover:bg-[#edf4ee] hover:text-[#17201b]"
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}
            </div>

            {page < totalPages && (
              <Link
                href={`/?page=${page + 1}`}
                className="rounded-lg border border-[#dfe8e0] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#66736b] transition-colors hover:border-[#49685a] hover:text-[#17201b]"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
}

/** Returns page numbers + "..." ellipsis for long pagination */
function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
