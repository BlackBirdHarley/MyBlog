import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { extractAffiliateLinkIds } from "@/lib/content-renderer";

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().nullish(),
  content: z.any().optional(),
  layoutVariant: z.enum(["CLASSIC", "LISTICLE", "ULTIMATE_GUIDE", "VISUAL_GALLERY", "COMPARISON"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  featured: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  heroImageId: z.string().optional().nullable(),
  pinterestImageId: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  pinDescription: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED" } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        layoutVariant: true,
        featured: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
        heroImage: { select: { url: true, thumbnailUrl: true, altText: true } },
        _count: { select: { pageViews: true, linkClicks: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tagIds, ...data } = parsed.data;
  const slug = data.slug || slugify(data.title);

  const article = await prisma.article.create({
    data: {
      ...data,
      slug,
      content: data.content ?? {},
      publishedAt: data.status === "PUBLISHED" && !data.publishedAt ? new Date() : data.publishedAt ? new Date(data.publishedAt) : null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
  });

  // Sync ArticleLink junction table
  if (data.content) {
    await syncArticleLinks(article.id, data.content);
  }

  return NextResponse.json(article, { status: 201 });
}

async function syncArticleLinks(articleId: string, content: unknown) {
  const linkIds = extractAffiliateLinkIds(content as object);
  await prisma.articleLink.deleteMany({ where: { articleId } });
  if (linkIds.length > 0) {
    await prisma.articleLink.createMany({
      data: linkIds.map((linkId) => ({ articleId, linkId })),
      skipDuplicates: true,
    });
  }
}
