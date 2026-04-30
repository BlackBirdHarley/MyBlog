import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PinterestPinsBar } from "@/components/public/PinterestPinsBar";
import { extractText } from "@/lib/content-renderer";

interface VisualGalleryLayoutProps {
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
  siteUrl: string;
  pinterestUserId?: string | null;
  pins?: { imageUrl: string; description: string | null }[];
  relatedArticles?: Array<{
    slug: string; title: string; excerpt: string | null; publishedAt: Date | null;
    heroImage: { url: string; altText: string | null } | null;
    category: { name: string; slug: string } | null;
  }>;
}

export function VisualGalleryLayout({ article, contentHtml, siteUrl, pinterestUserId, pins = [], relatedArticles = [] }: VisualGalleryLayoutProps) {
  const plainText = extractText(article.content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(wordCount / 200));

  return (
    <article>
      {article.heroImage ? (
        <div className="relative w-full h-[55vh] min-h-72 bg-gray-900">
          <Image
            src={article.heroImage.url}
            alt={article.heroImage.altText ?? article.title}
            fill
            priority
            className="object-cover opacity-80"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-gray-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-3">
              {article.category && (
                <Link href={`/categories/${article.category.slug}`} className="text-rose-400 font-medium hover:underline">
                  {article.category.name}
                </Link>
              )}
              {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
              <span>{mins} min read</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">{article.excerpt}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
            {article.category && (
              <Link href={`/categories/${article.category.slug}`} className="text-rose-600 font-medium hover:underline">
                {article.category.name}
              </Link>
            )}
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-xl text-gray-500 leading-relaxed">{article.excerpt}</p>
          )}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div
          className={[
            "prose prose-gray prose-lg max-w-none flow-root",
            "prose-a:text-rose-600 prose-a:no-underline hover:prose-a:underline",
            "prose-img:shadow-md",
            "prose-headings:font-extrabold",
            "prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-t prose-h2:border-gray-100 prose-h2:pt-8",
          ].join(" ")}
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

      {relatedArticles.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-16 pt-4">
          <div className="border-t border-gray-100 pt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Related articles</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="group rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                  {a.heroImage && (
                    <div className="relative w-full aspect-video bg-gray-100">
                      <Image src={a.heroImage.url} alt={a.heroImage.altText ?? a.title} fill className="object-cover" sizes="320px" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600">{a.title}</p>
                    {a.publishedAt && <p className="text-xs text-gray-400 mt-1">{formatDate(a.publishedAt)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
