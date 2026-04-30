import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="p-8">
      <PageHeader title="Categories" description="Organise articles into topics" />
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
