import { PageHeader } from "@/components/admin/PageHeader";
import { PinsManager } from "@/components/admin/PinsManager";
import { prisma } from "@/lib/prisma";

export default async function PinsPage({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string; boardId?: string }>;
}) {
  const { articleId = "", boardId = "" } = await searchParams;
  const [boards, articles, pins] = await Promise.all([
    prisma.pinBoard.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { pins: true } } },
    }),
    prisma.article.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, slug: true, _count: { select: { pins: true } } },
    }),
    prisma.articlePin.findMany({
      where: {
        ...(articleId ? { articleId } : {}),
        ...(boardId === "unassigned" ? { boardId: null } : boardId ? { boardId } : {}),
      },
      orderBy: [{ article: { updatedAt: "desc" } }, { sortOrder: "asc" }],
      include: {
        board: { select: { id: true, name: true } },
        article: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="p-8">
      <PageHeader
        title="Pinterest pins"
        description="Review every generated pin, filter by article, and manage manual Pinterest boards."
      />
      <PinsManager
        pins={pins.map((pin) => ({
          id: pin.id,
          imageUrl: pin.imageUrl,
          title: pin.title,
          description: pin.description,
          linkUrl: pin.linkUrl,
          taggedTopics: pin.taggedTopics,
          createdAt: pin.createdAt.toISOString(),
          boardId: pin.boardId,
          board: pin.board,
          article: pin.article,
        }))}
        boards={boards}
        articles={articles}
        selectedArticleId={articleId}
        selectedBoardId={boardId}
      />
    </div>
  );
}
