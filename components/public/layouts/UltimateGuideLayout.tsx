import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PinterestPinsBar } from "@/components/public/PinterestPinsBar";
import { extractText } from "@/lib/content-renderer";

interface TOCEntry { id: string; level: number; text: string; }

interface UltimateGuideLayoutProps {
  article: {
    slug: string;
    title: string;
    excerpt: string | null;
    content: object;
    publishedAt: Date | null;
    heroImage: { url: string; altText: string | null; width?: number | null; height?: number | null } | null;
    category: { name: string; slug: string } | null;
    tags: { name: string; slug: string }[];
  };
  contentHtml: string;
  headings: TOCEntry[];
  siteUrl: string;
  pinterestUserId?: string | null;
  pins?: { imageUrl: string; description: string | null }[];
  relatedArticles?: Array<{
    slug: string; title: string; excerpt: string | null; publishedAt: Date | null;
    heroImage: { url: string; altText: string | null } | null;
    category: { name: string; slug: string } | null;
  }>;
}

export function UltimateGuideLayout({
  article, contentHtml, headings, siteUrl, pinterestUserId, pins = [], relatedArticles = [],
}: UltimateGuideLayoutProps) {
  const plainText = extractText(article.content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(wordCount / 200));
  const h2s = headings.filter((h) => h.level === 2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="max-w-3xl mb-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
          {article.category && (
            <Link href={`/categories/${article.category.slug}`} className="text-rose-600 font-medium hover:underline">
              {article.category.name}
            </Link>
          )}
          {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          <span>{mins} min read</span>
          <span className="bg-gray-900 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide uppercase">
            Ultimate Guide
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-xl text-gray-500 leading-relaxed">{article.excerpt}</p>
        )}
      </header>

      {article.heroImage && (
        <div className="relative w-full aspect-21/9 overflow-hidden mb-10 bg-gray-100">
          <Image
            src={article.heroImage.url}
            alt={article.heroImage.altText ?? article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
      )}

      <div className="flex gap-10 items-start">
        {h2s.length >= 3 && (
          <aside className="hidden lg:block w-56 shrink-0 sticky top-8 self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              In this guide
            </p>
            <nav className="space-y-1">
              {h2s.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className="block text-sm text-gray-500 hover:text-gray-900 py-1 border-l-2 border-gray-100 hover:border-rose-500 pl-3 transition-colors leading-snug"
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {h2s.length >= 3 && (
            <details className="lg:hidden mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 open:pb-3">
              <summary className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                Table of contents
              </summary>
              <nav className="mt-3 space-y-1">
                {h2s.map((h) => (
                  <a key={h.id} href={`#${h.id}`} className="block text-sm text-gray-500 hover:text-gray-900 py-1">
                    {h.text}
                  </a>
                ))}
              </nav>
            </details>
          )}

          <div
            className="prose prose-gray prose-lg max-w-none prose-a:text-rose-600 prose-a:no-underline hover:prose-a:underline prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:scroll-mt-8 prose-h3:scroll-mt-8 flow-root"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <PinterestPinsBar pins={pins} pageUrl={`${siteUrl}/blog/${article.slug}`} pinterestUserId={pinterestUserId ?? null} />

          {article.tags.length > 0 && (
            <div className="clear-both flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-200">
              {article.tags.map((t) => (
                <Link key={t.slug} href={`/tags/${t.slug}`} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors">
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-8 border-t border-gray-100 max-w-3xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Related articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedArticles.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                {a.heroImage && (
                  <div className="relative w-20 h-16 shrink-0 overflow-hidden bg-gray-100">
                    <Image src={a.heroImage.url} alt={a.heroImage.altText ?? a.title} fill className="object-cover" sizes="80px" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600">{a.title}</p>
                  {a.publishedAt && <p className="text-xs text-gray-400 mt-1">{formatDate(a.publishedAt)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
