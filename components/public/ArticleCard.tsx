import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    heroImage: { url: string; altText: string | null } | null;
    category: { name: string; slug: string } | null;
    tags?: { name: string; slug: string }[];
  };
  featured?: boolean;
  variant?: "default" | "large";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E4E9EC] hover:border-[#CDD6DC] hover:shadow-[0_18px_40px_rgba(35,45,55,0.09)] transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div
        className={`relative w-full bg-[#EDF1F4] overflow-hidden ${
          variant === "large" ? "aspect-4/3" : "aspect-video"
        }`}
      >
        {article.heroImage ? (
          <Image
            src={article.heroImage.url}
            alt={article.heroImage.altText ?? article.title}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-[#E4ECF1] to-[#D2DCE4]" />
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-2.5 flex-1">
        {article.category && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#FF9B7A]">
            {article.category.name}
          </span>
        )}
        <h2 className="font-semibold text-[#1E252B] leading-[1.32] tracking-[-0.01em] text-[15px] group-hover:text-[#26313A] transition-colors line-clamp-2">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-[13px] text-[#7D8790] leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-[#F0F4F6]">
          {article.publishedAt ? (
            <span className="text-[11px] text-[#9AA3AA] uppercase tracking-[0.06em]">
              {formatDate(article.publishedAt)}
            </span>
          ) : (
            <span />
          )}
          <span className="text-[11px] font-semibold text-[#FF9B7A] uppercase tracking-[0.06em] group-hover:translate-x-0.5 transition-transform">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}
