import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const pinSchema = z.array(
  z.object({
    imageUrl: z.string().min(1),
    description: z.string().nullable().optional(),
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

  await prisma.$transaction([
    prisma.articlePin.deleteMany({ where: { articleId: id } }),
    prisma.articlePin.createMany({
      data: parsed.data.map((p) => ({
        articleId: id,
        imageUrl: p.imageUrl,
        description: p.description ?? null,
        sortOrder: p.sortOrder,
      })),
    }),
  ]);

  return NextResponse.json({ success: true });
}
