import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addHeadingIds,
  addImageAltTooltips,
  extractHeadings,
  renderContent,
} from "@/lib/content-renderer";
import { ClassicLayout } from "@/components/public/layouts/ClassicLayout";
import { ComparisonLayout } from "@/components/public/layouts/ComparisonLayout";
import { ListicleLayout } from "@/components/public/layouts/ListicleLayout";
import { UltimateGuideLayout } from "@/components/public/layouts/UltimateGuideLayout";
import { VisualGalleryLayout } from "@/components/public/layouts/VisualGalleryLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePreviewPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [article, settings] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        heroImage: true,
        category: true,
        tags: true,
        pins: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null),
  ]);

  if (!article) notFound();

  const siteUrl = settings?.siteUrl ?? process.env.SITE_URL ?? "http://localhost:3000";
  const contentJson = (article.content ?? {}) as object;
  const rawHtml = addImageAltTooltips(renderContent(contentJson, article.id));
  const related = article.categoryId
    ? await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          categoryId: article.categoryId,
          id: { not: article.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          heroImage: { select: { url: true, altText: true } },
          category: { select: { name: true, slug: true } },
        },
      })
    : [];

  const sharedProps = {
    article: { ...article, content: contentJson },
    contentHtml: rawHtml,
    relatedArticles: related,
    siteUrl,
    pinterestUserId: settings?.pinterestUserId ?? null,
    pins: article.pins.map((pin) => ({
      imageUrl: pin.imageUrl,
      altText: pin.altText,
      description: pin.description,
    })),
  };

  let preview: React.ReactNode;
  switch (article.layoutVariant) {
    case "LISTICLE":
      preview = <ListicleLayout {...sharedProps} />;
      break;
    case "ULTIMATE_GUIDE":
      preview = (
        <UltimateGuideLayout
          {...sharedProps}
          contentHtml={addHeadingIds(rawHtml)}
          headings={extractHeadings(contentJson)}
        />
      );
      break;
    case "VISUAL_GALLERY":
      preview = <VisualGalleryLayout {...sharedProps} />;
      break;
    case "COMPARISON":
      preview = <ComparisonLayout {...sharedProps} contentHtml={addHeadingIds(rawHtml)} />;
      break;
    default:
      preview = <ClassicLayout {...sharedProps} />;
  }

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Preview mode: this article is visible only in admin.
      </div>
      {preview}
    </>
  );
}
