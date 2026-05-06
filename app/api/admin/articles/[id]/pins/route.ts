import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const pinSchema = z.array(
  z.object({
    id: z.string().optional(),
    boardId: z.string().nullable().optional(),
    mediaId: z.string().nullable().optional(),
    imageUrl: z.string().min(1),
    title: z.string().nullable().optional(),
    altText: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    linkUrl: z.string().nullable().optional(),
    taggedTopics: z.array(z.string()).optional(),
    sortOrder: z.number().int(),
  })
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pins = await prisma.articlePin.findMany({
    where: { articleId: id },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(pins);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.length === 0) {
    return NextResponse.json({ success: true, skippedEmptyReplace: true });
  }

  const uniquePins = Array.from(
    new Map(parsed.data.map((pin) => [pin.id ?? pin.imageUrl, pin])).values()
  ).map((pin, index) => ({ ...pin, sortOrder: index }));

  const pins = await prisma.$transaction(async (tx) => {
    const existingPins = await tx.articlePin.findMany({
      where: { articleId: id },
      select: { id: true, imageUrl: true },
    });
    const media = await tx.media.findMany({
      where: { url: { in: uniquePins.map((pin) => pin.imageUrl) } },
      select: { id: true, url: true },
    });
    const existingMediaByUrl = new Map(media.map((item) => [item.url, item]));
    const existingIds = new Set(existingPins.map((pin) => pin.id));
    const keptIds: string[] = [];

    for (const pin of uniquePins) {
      const data = {
        boardId: pin.boardId ?? null,
        mediaId: pin.mediaId ?? existingMediaByUrl.get(pin.imageUrl)?.id ?? null,
        imageUrl: pin.imageUrl,
        title: pin.title ?? null,
        altText: pin.altText ?? null,
        description: pin.description ? stripUrls(pin.description) : null,
        linkUrl: pin.linkUrl ?? null,
        taggedTopics: pin.taggedTopics ?? [],
        sortOrder: pin.sortOrder,
      };

      if (pin.id && existingIds.has(pin.id)) {
        const updated = await tx.articlePin.update({
          where: { id: pin.id },
          data,
          select: { id: true, imageUrl: true },
        });
        keptIds.push(updated.id);
        continue;
      }

      const existingByImage = existingPins.find((existingPin) => existingPin.imageUrl === pin.imageUrl);
      if (existingByImage && !keptIds.includes(existingByImage.id)) {
        const updated = await tx.articlePin.update({
          where: { id: existingByImage.id },
          data,
          select: { id: true, imageUrl: true },
        });
        keptIds.push(updated.id);
        continue;
      }

      const created = await tx.articlePin.create({
        data: { articleId: id, ...data },
        select: { id: true, imageUrl: true },
      });
      keptIds.push(created.id);
    }

    await tx.articlePin.deleteMany({
      where: {
        articleId: id,
        id: { notIn: keptIds },
      },
    });

    return tx.articlePin.findMany({
      where: { articleId: id },
      orderBy: { sortOrder: "asc" },
    });
  });

  return NextResponse.json({ success: true, pins });
}

function stripUrls(value: string) {
  return value
    .replace(/\b(?:Visit|Read more|Learn more|See more)\s*:?\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:Visit|Read more|Learn more|See more)(?:\s+at)?\s*:?\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
