import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { TagManager } from "@/components/admin/TagManager";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="p-8">
      <PageHeader title="Tags" description="Label articles with keywords" />
      <TagManager initialTags={tags} />
    </div>
  );
}
