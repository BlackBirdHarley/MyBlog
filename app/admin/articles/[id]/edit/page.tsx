import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/editor/ArticleForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [article, categories, tags] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: { heroImage: true, tags: true, pins: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  const initialData = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content as object,
    layoutVariant: article.layoutVariant,
    status: article.status,
    featured: article.featured,
    categoryId: article.categoryId,
    tagIds: article.tags.map((t) => t.id),
    heroImage: article.heroImage
      ? { id: article.heroImage.id, url: article.heroImage.url, altText: article.heroImage.altText }
      : null,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    canonicalUrl: article.canonicalUrl,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    pins: article.pins.map((p) => ({ imageUrl: p.imageUrl, description: p.description })),
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/articles" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Articles
        </Link>
        <PageHeader title={article.title || "Edit article"} />
      </div>
      <ArticleForm articleId={id} initialData={initialData} categories={categories} tags={tags} />
    </div>
  );
}
