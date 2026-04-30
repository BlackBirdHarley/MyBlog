import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  displayLabel: z.string().optional().nullable(),
  targetUrl: z.string().url(),
  program: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  commission: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const isActive = searchParams.get("isActive");

  const links = await prisma.affiliateLink.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(isActive !== null ? { isActive: isActive === "true" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clicks: true, articles: true } },
    },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const link = await prisma.affiliateLink.create({ data: parsed.data });
  return NextResponse.json(link, { status: 201 });
}
