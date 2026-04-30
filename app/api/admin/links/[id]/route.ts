import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  displayLabel: z.string().optional().nullable(),
  targetUrl: z.string().url().optional(),
  program: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  commission: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const link = await prisma.affiliateLink.findUnique({
    where: { id },
    include: {
      _count: { select: { clicks: true } },
      articles: {
        include: {
          article: {
            select: { id: true, title: true, slug: true, status: true, _count: { select: { linkClicks: { where: { linkId: id } } } } },
          },
        },
      },
    },
  });

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(link);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const link = await prisma.affiliateLink.update({ where: { id }, data: parsed.data });
  return NextResponse.json(link);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.affiliateLink.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
