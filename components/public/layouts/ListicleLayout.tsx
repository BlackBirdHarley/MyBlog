import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PinterestPinsBar } from "@/components/public/PinterestPinsBar";
import { extractText } from "@/lib/content-renderer";

interface ListicleLayoutProps {
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

function extractCount(title: string): number | null {
  const m = title.match(/^(\d+)\s/);
  return m ? parseInt(m[1]) : null;
}

export function ListicleLayout({ article, contentHtml, siteUrl, pinterestUserId, pins = [], relatedArticles = [] }: ListicleLayoutProps) {
  const count = extractCount(article.title);
  const plainText = extractText(article.content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(wordCount / 200));

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
        {article.category && (
          <Link href={`/categories/${article.category.slug}`} className="text-rose-600 font-medium hover:underline">
            {article.category.name}
          </Link>
        )}
        {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
        <span>{mins} min read</span>
        {count && (
          <span className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {count} picks
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
        {article.title}
      </h1>

      {article.excerpt && (
        <p className="text-lg text-gray-500 leading-relaxed mb-8">{article.excerpt}</p>
      )}

      {article.heroImage && (
        <div className="relative w-full aspect-video overflow-hidden mb-8 bg-gray-100">
          <Image
            src={article.heroImage.url}
            alt={article.heroImage.altText ?? article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      )}

      <div
        className={[
          "prose prose-gray prose-lg max-w-none flow-root",
          "prose-a:text-rose-600 prose-a:no-underline hover:prose-a:underline",
          "prose-headings:font-extrabold",
          "[counter-reset:listicle-item]",
          "[&>h2]:[counter-increment:listicle-item]",
          "[&>h2]:flex [&>h2]:items-center [&>h2]:gap-3",
          "[&>h2]:before:content-[counter(listicle-item)] [&>h2]:before:flex [&>h2]:before:items-center [&>h2]:before:justify-center",
          "[&>h2]:before:w-8 [&>h2]:before:h-8 [&>h2]:before:rounded-full",
          "[&>h2]:before:bg-rose-600 [&>h2]:before:text-white [&>h2]:before:text-sm [&>h2]:before:font-bold [&>h2]:before:shrink-0",
          "[&>h2]:mt-10 [&>h2]:mb-4",
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

      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-8 border-t border-gray-100">
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
    </article>
  );
}
