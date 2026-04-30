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
      <section className="bg-[#26313A] px-10 lg:px-16 py-24 lg:py-32 text-center">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#FF9B7A] font-semibold mb-5">
          Welcome
        </p>
        <h1 className="text-4xl lg:text-6xl font-bold text-white leading-[1.06] tracking-[-0.03em] mb-5 max-w-2xl mx-auto">
          {siteName}
        </h1>
        {siteDescription && (
          <p className="text-[15px] text-[#9AA3AA] max-w-md mx-auto leading-relaxed mb-8">
            {siteDescription}
          </p>
        )}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#FF9B7A] text-white text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-[#F08060] transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,155,122,0.4)]"
        >
          Start Reading
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col lg:flex-row min-h-130 lg:min-h-150">
      {/* Dark info panel */}
      <div className="w-full lg:w-[44%] bg-[#26313A] flex flex-col justify-between p-10 lg:p-14 shrink-0 order-2 lg:order-1">
        <div className="animate-fade-up">
          {article.category && (
            <Link href={`/categories/${article.category.slug}`}>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#FF9B7A] font-semibold">
                {article.category.name}
              </span>
            </Link>
          )}
          {!article.category && (
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#FF9B7A] font-semibold">
              Featured
            </span>
          )}
          <h1 className="mt-4 text-3xl lg:text-[38px] xl:text-[44px] font-bold text-white leading-[1.08] tracking-tight text-center">
            {article.title}
          </h1>
          {heroDescription && (
            <p className="mt-5 text-[15px] text-[#9AA3AA] leading-relaxed line-clamp-3 text-center italic">
              {heroDescription}
            </p>
          )}
        </div>

        <div className="animate-fade-up delay-200">
          <div className="mb-6 h-px bg-white/10" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            {article.publishedAt && (
              <span className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790]">
                {formatDate(article.publishedAt)}
              </span>
            )}
            <Link
              href={`/blog/${article.slug}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9B7A] text-white text-[11px] font-semibold uppercase tracking-[0.06em] hover:bg-[#F08060] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(255,155,122,0.4)]"
            >
              Read Article →
            </Link>
          </div>
        </div>
      </div>

      {/* Image panel */}
      <div className="relative order-1 lg:order-2 flex-1 min-h-65 lg:min-h-0 bg-[#D8E0E6]">
        {article.heroImage ? (
          <Image
            src={article.heroImage.url}
            alt={article.heroImage.altText ?? article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 65vw"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-[#DDE4E8] to-[#C8D4DC]" />
        )}
        {/* Floating badge */}
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[#1E252B] font-semibold">
            Featured
          </span>
        </div>
      </div>
    </section>
  );
}
