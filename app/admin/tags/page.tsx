import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { TagManager } from "@/components/admin/TagManager";

export default async function TagsPage() {
  const [tags, categories] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { articles: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="p-8">
      <PageHeader title="Tags" description="Label articles with keywords" />
      <TagManager initialTags={tags} categories={categories} />
    </div>
  );
}
