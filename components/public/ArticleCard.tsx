import Link from "next/link";
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
      className="group flex flex-col overflow-hidden rounded-lg border border-[#dfe8e0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#bfd0c2] hover:shadow-[0_18px_40px_rgba(23,32,27,0.10)]"
    >
      {/* Image */}
      <div
        className={`relative w-full bg-[#EDF1F4] overflow-hidden ${
          variant === "large" ? "aspect-4/3" : "aspect-[5/3]"
        }`}
      >
        {article.heroImage ? (
          <img
            src={article.heroImage.url}
            alt={article.heroImage.altText ?? article.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#e5eee6]" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {article.category && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#49685a]">
            {article.category.name}
          </span>
        )}
        <h2 className="line-clamp-2 text-[16px] font-semibold leading-[1.26] tracking-tight text-[#17201b] transition-colors group-hover:text-[#2f4d3f]">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-[#66736b]">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-[#edf2ed] pt-3.5">
          {article.publishedAt ? (
            <span className="text-[11px] uppercase tracking-[0.06em] text-[#8d9a91]">
              {formatDate(article.publishedAt)}
            </span>
          ) : (
            <span />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#e9785f] transition-transform group-hover:translate-x-0.5">
            Read
          </span>
        </div>
      </div>
    </Link>
  );
}
