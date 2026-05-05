import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface HeroArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  heroImage: { url: string; altText: string | null } | null;
  category: { name: string; slug: string } | null;
}

interface HeroSectionProps {
  article: HeroArticle | null;
  siteName?: string;
  siteDescription?: string;
  heroDescription?: string | null;
}

export function HeroSection({ article, siteName = "My Blog", siteDescription, heroDescription }: HeroSectionProps) {
  if (!article) {
    return (
      <section className="bg-[#17201b] px-6 py-24 text-center sm:px-10 lg:px-16 lg:py-32">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e9785f]">
          Welcome
        </p>
        <h1 className="mx-auto mb-5 max-w-2xl text-4xl font-bold leading-[1.06] tracking-tight text-white lg:text-6xl">
          {siteName}
        </h1>
        {siteDescription && (
          <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-[#b9c7bd]">
            {siteDescription}
          </p>
        )}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#17201b] transition-all hover:-translate-y-px hover:bg-[#f3f7f2]"
        >
          Start Reading
        </Link>
      </section>
    );
  }

  return (
    <section className="relative min-h-[560px] overflow-hidden bg-[#17201b]">
      {article.heroImage ? (
        <Image
          src={article.heroImage.url}
          alt={article.heroImage.altText ?? article.title}
          fill
          priority
          className="object-cover opacity-88"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[#dbe5dc]" />
      )}
      <div className="absolute inset-0 bg-[#17201b]/58" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#17201b]/85 to-transparent" />

      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="max-w-3xl animate-fade-up">
          {article.category && (
            <Link href={`/categories/${article.category.slug}`}>
              <span className="inline-flex rounded-full bg-white/14 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/20 backdrop-blur">
                {article.category.name}
              </span>
            </Link>
          )}
          {!article.category && (
            <span className="inline-flex rounded-full bg-white/14 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/20 backdrop-blur">
              Featured
            </span>
          )}
          <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {article.title}
          </h1>
          {heroDescription && (
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/82 line-clamp-3">
              {heroDescription}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {article.publishedAt && (
              <span className="text-[11px] uppercase tracking-[0.08em] text-white/68">
                {formatDate(article.publishedAt)}
              </span>
            )}
            <Link
              href={`/blog/${article.slug}`}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#17201b] transition-all hover:-translate-y-px hover:bg-[#f3f7f2]"
            >
              Read Article
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
