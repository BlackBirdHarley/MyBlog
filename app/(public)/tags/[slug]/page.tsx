import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/public/ArticleCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return {};
  return { title: `#${tag.name}` };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: {
          slug: true, title: true, excerpt: true, publishedAt: true,
          heroImage: { select: { url: true, altText: true } },
          category: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!tag) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-gray-900 mb-8">#{tag.name}</h1>
      {tag.articles.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No articles with this tag yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tag.articles.map((a) => <ArticleCard key={a.slug} article={a} />)}
        </div>
      )}
    </main>
  );
}
