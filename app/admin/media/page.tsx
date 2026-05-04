import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import Link from "next/link";
import { FileText, ImageIcon, PencilLine } from "lucide-react";

type MediaRecord = Awaited<ReturnType<typeof getMediaRecords>>[number];

interface ArticleMediaItem {
  id: string | null;
  key: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string | null;
  source: "Hero" | "Inline" | "Pinterest";
  description?: string | null;
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string }>;
}) {
  const { articleId } = await searchParams;
  const [media, articles] = await Promise.all([
    getMediaRecords(),
    prisma.article.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        content: true,
        heroImage: true,
        pins: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  const mediaByUrl = new Map(media.map((item) => [item.url, item]));
  const articleSummaries = articles.map((article) => {
    const count = buildArticleMedia(article, mediaByUrl).length;
    return { id: article.id, title: article.title, slug: article.slug, status: article.status, count };
  });
  const selectedArticleId = articleId && articleSummaries.some((article) => article.id === articleId)
    ? articleId
    : articleSummaries[0]?.id;
  const selectedArticle = articles.find((article) => article.id === selectedArticleId) ?? null;
  const selectedMedia = selectedArticle ? buildArticleMedia(selectedArticle, mediaByUrl) : [];

  return (
    <div className="p-8">
      <PageHeader
        title="Media"
        description={`${media.length} upload${media.length !== 1 ? "s" : ""} across ${articles.length} article${articles.length !== 1 ? "s" : ""}`}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-8 xl:self-start">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
                <FileText size={16} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Articles</h2>
                <p className="mt-0.5 text-xs text-gray-500">Choose one to inspect its media set.</p>
              </div>
            </div>
          </div>
          <div className="max-h-[720px] overflow-y-auto">
            {articleSummaries.length > 0 ? (
              articleSummaries.map((article) => {
                const active = article.id === selectedArticleId;
                return (
                  <Link
                    key={article.id}
                    href={`/admin/media?articleId=${article.id}`}
                    className={`block border-b border-gray-100 px-4 py-3 transition-colors ${
                      active ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`line-clamp-2 text-sm font-medium ${active ? "text-white" : "text-gray-900"}`}>
                          {article.title}
                        </p>
                        <p className={`mt-1 truncate text-xs ${active ? "text-gray-300" : "text-gray-400"}`}>
                          {article.status.toLowerCase()}
                        </p>
                        <p className={`mt-1 truncate text-[11px] ${active ? "text-gray-400" : "text-gray-400"}`}>
                          /{article.slug}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {article.count}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No articles yet.</div>
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {selectedArticle ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
                      <ImageIcon size={16} />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
                      {selectedMedia.length} image{selectedMedia.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-gray-900">{selectedArticle.title}</h2>
                  <p className="mt-1 text-sm text-gray-400">/blog/{selectedArticle.slug}</p>
                </div>
                <Link
                  href={`/admin/articles/${selectedArticle.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <PencilLine size={15} />
                  Edit article
                </Link>
              </div>
              <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  ["Hero", selectedMedia.filter((item) => item.source === "Hero").length],
                  ["Inline", selectedMedia.filter((item) => item.source === "Inline").length],
                  ["Pinterest", selectedMedia.filter((item) => item.source === "Pinterest").length],
                ].map(([label, count]) => (
                  <div key={label} className="px-5 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <MediaLibrary
            sections={[
              { title: "Hero image", items: selectedMedia.filter((item) => item.source === "Hero") },
              { title: "Inline images", items: selectedMedia.filter((item) => item.source === "Inline") },
              { title: "Pinterest pins", items: selectedMedia.filter((item) => item.source === "Pinterest") },
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function getMediaRecords() {
  return prisma.media.findMany({ orderBy: { createdAt: "desc" } });
}

function buildArticleMedia(
  article: {
    id: string;
    title: string;
    content: unknown;
    heroImage: MediaRecord | null;
    pins: Array<{ id: string; imageUrl: string; altText: string | null; description: string | null; createdAt: Date }>;
  },
  mediaByUrl: Map<string, MediaRecord>
): ArticleMediaItem[] {
  const items: ArticleMediaItem[] = [];

  if (article.heroImage) {
    items.push(toMediaItem(article.heroImage, "Hero", `hero-${article.heroImage.id}`));
  }

  extractImageNodes(article.content).forEach((image, index) => {
    const media = mediaByUrl.get(image.src);
    items.push(media
      ? toMediaItem(media, "Inline", `inline-${media.id}-${index}`, image.alt)
      : {
          id: null,
          key: `inline-external-${index}-${image.src}`,
          filename: image.src.split("/").pop() ?? `Inline image ${index + 1}`,
          url: image.src,
          thumbnailUrl: null,
          altText: image.alt,
          fileSize: null,
          mimeType: null,
          createdAt: null,
          source: "Inline",
        });
  });

  article.pins.forEach((pin, index) => {
    const media = mediaByUrl.get(pin.imageUrl);
    items.push(media
      ? toMediaItem(media, "Pinterest", `pin-${media.id}-${index}`, pin.altText, pin.description)
      : {
          id: null,
          key: `pin-external-${pin.id}`,
          filename: pin.imageUrl.split("/").pop() ?? `Pinterest pin ${index + 1}`,
          url: pin.imageUrl,
          thumbnailUrl: null,
          altText: pin.altText,
          fileSize: null,
          mimeType: null,
          createdAt: pin.createdAt.toISOString(),
          source: "Pinterest",
          description: pin.description,
        });
  });

  return dedupeArticleMedia(items);
}

function toMediaItem(
  media: MediaRecord,
  source: ArticleMediaItem["source"],
  key: string,
  altOverride?: string | null,
  description?: string | null
): ArticleMediaItem {
  return {
    id: media.id,
    key,
    filename: media.filename,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    altText: altOverride ?? media.altText,
    fileSize: media.fileSize,
    mimeType: media.mimeType,
    createdAt: media.createdAt.toISOString(),
    source,
    description,
  };
}

function dedupeArticleMedia(items: ArticleMediaItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.source}:${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractImageNodes(content: unknown): Array<{ src: string; alt: string | null }> {
  const images: Array<{ src: string; alt: string | null }> = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (record.type === "image" || record.type === "imageAlign") {
      const attrs = record.attrs as Record<string, unknown> | undefined;
      if (typeof attrs?.src === "string" && attrs.src) {
        images.push({
          src: attrs.src,
          alt: typeof attrs.alt === "string" && attrs.alt.trim() ? attrs.alt.trim() : null,
        });
      }
    }
    if (Array.isArray(record.content)) record.content.forEach(walk);
  }

  walk(content);
  return images;
}
