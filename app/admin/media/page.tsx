import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default async function MediaPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-8">
      <PageHeader
        title="Media"
        description={`${media.length} file${media.length !== 1 ? "s" : ""}`}
      />
      <MediaLibrary initialMedia={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </div>
  );
}
