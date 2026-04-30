import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { extractAffiliateLinkIds } from "@/lib/content-renderer";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      heroImage: true,
      pinterestImage: true,
      articleLinks: { include: { link: true } },
    },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tagIds, ...data } = parsed.data;

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = data.slug ? data.slug : data.title ? slugify(data.title) : undefined;

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...data,
      ...(slug ? { slug } : {}),
      publishedAt:
        data.status === "PUBLISHED" && !existing.publishedAt && !data.publishedAt
          ? new Date()
          : data.publishedAt !== undefined
          ? data.publishedAt ? new Date(data.publishedAt) : null
          : undefined,
      scheduledAt: data.scheduledAt !== undefined
        ? data.scheduledAt ? new Date(data.scheduledAt) : null
        : undefined,
      tags: tagIds !== undefined ? { set: tagIds.map((tid) => ({ id: tid })) } : undefined,
    },
    include: { category: true, tags: true, heroImage: true },
  });

  // Sync ArticleLink junction table
  if (data.content) {
    const linkIds = extractAffiliateLinkIds(data.content as object);
    await prisma.articleLink.deleteMany({ where: { articleId: id } });
    if (linkIds.length > 0) {
      await prisma.articleLink.createMany({
        data: linkIds.map((linkId) => ({ articleId: id, linkId })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(article);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
