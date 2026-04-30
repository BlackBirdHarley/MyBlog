import { prisma } from "@/lib/prisma";
import { renderContent, extractHeadings, addHeadingIds } from "@/lib/content-renderer";
import { ClassicLayout } from "@/components/public/layouts/ClassicLayout";
import { ListicleLayout } from "@/components/public/layouts/ListicleLayout";
import { UltimateGuideLayout } from "@/components/public/layouts/UltimateGuideLayout";
import { VisualGalleryLayout } from "@/components/public/layouts/VisualGalleryLayout";
import { ComparisonLayout } from "@/components/public/layouts/ComparisonLayout";
import { ViewTracker } from "@/components/public/ViewTracker";
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getSettings() {
  return prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    prisma.article.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: {
        title: true, metaTitle: true, metaDescription: true, excerpt: true,
        publishedAt: true, updatedAt: true, canonicalUrl: true,
        heroImage: { select: { url: true, width: true, height: true } },
      },
    }),
    getSettings(),
  ]);
  if (!article) return {};

  const siteName = settings?.siteName ?? "My Blog";
  const siteUrl = settings?.siteUrl ?? process.env.SITE_URL ?? "http://localhost:3000";
  const title = article.metaTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt ?? undefined;
  const canonical = article.canonicalUrl ?? `${siteUrl}/blog/${slug}`;
  const ogImage = article.heroImage
    ? [{ url: article.heroImage.url, width: article.heroImage.width ?? undefined, height: article.heroImage.height ?? undefined }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description: description ?? undefined,
      url: canonical,
      siteName,
      locale: "en_US",
      type: "article",
      images: ogImage,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [siteUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description ?? undefined,
      images: article.heroImage ? [article.heroImage.url] : undefined,
      ...(settings?.twitterHandle ? { site: settings.twitterHandle } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const [article, settings, session] = await Promise.all([
    prisma.article.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: { heroImage: true, category: true, tags: true, pins: { orderBy: { sortOrder: "asc" } } },
    }),
    getSettings(),
    auth(),
  ]);

  if (!article) notFound();

  const siteUrl = settings?.siteUrl ?? process.env.SITE_URL ?? "http://localhost:3000";
  const siteName = settings?.siteName ?? "My Blog";
  const articleUrl = `${siteUrl}/blog/${slug}`;

  const contentJson = (article.content ?? {}) as object;
  const rawHtml = renderContent(contentJson, article.id);

  const related = article.categoryId
    ? await prisma.article.findMany({
        where: { status: "PUBLISHED", categoryId: article.categoryId, slug: { not: slug } },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: {
          slug: true, title: true, excerpt: true, publishedAt: true,
          heroImage: { select: { url: true, altText: true } },
          category: { select: { name: true, slug: true } },
        },
      })
    : [];

  // JSON-LD
  const blogPostingJsonLd = buildBlogPostingJsonLd({
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt,
    url: articleUrl,
    imageUrl: article.heroImage?.url,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    site: { siteName, siteUrl },
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    ...(article.category ? [{ name: article.category.name, url: `${siteUrl}/categories/${article.category.slug}` }] : []),
    { name: article.title, url: articleUrl },
  ]);

  const pinterestUserId = session ? (settings?.pinterestUserId ?? null) : null;
  const sharedProps = {
    article: { ...article, content: contentJson },
    contentHtml: rawHtml,
    relatedArticles: related,
    siteUrl,
    pinterestUserId,
    pins: pinterestUserId
      ? article.pins.map((p) => ({ imageUrl: p.imageUrl, description: p.description }))
      : [],
  };

  let layout: React.ReactNode;

  switch (article.layoutVariant) {
    case "LISTICLE":
      layout = <ListicleLayout {...sharedProps} />;
      break;

    case "ULTIMATE_GUIDE": {
      const headings = extractHeadings(contentJson);
      layout = (
        <UltimateGuideLayout
          {...sharedProps}
          contentHtml={addHeadingIds(rawHtml)}
          headings={headings}
        />
      );
      break;
    }

    case "VISUAL_GALLERY":
      layout = <VisualGalleryLayout {...sharedProps} />;
      break;

    case "COMPARISON":
      layout = <ComparisonLayout {...sharedProps} contentHtml={addHeadingIds(rawHtml)} />;
      break;

    default:
      layout = <ClassicLayout {...sharedProps} />;
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }} />
      {!session && <ViewTracker articleId={article.id} path={`/blog/${slug}`} />}
      {layout}
    </>
  );
}

export async function generateStaticParams() {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}
