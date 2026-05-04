import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export default async function CategoriesPage() {
  const [categories, articles] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        tags: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, _count: { select: { articles: true } } },
        },
        _count: { select: { articles: true } },
      },
    }),
    prisma.article.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        categoryId: true,
        tags: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="p-8">
      <PageHeader title="Taxonomy" description="Manage categories, tags, and article groups in one place" />
      <TaxonomyManager
        initialCategories={categories}
        articles={articles.map((article) => ({ ...article, updatedAt: article.updatedAt.toISOString() }))}
      />
    </div>
  );
}
