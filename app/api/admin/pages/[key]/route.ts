import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_KEYS = ["about", "privacy", "disclosure"] as const;
type PageKey = (typeof ALLOWED_KEYS)[number];

const schema = z.object({
  title: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key as PageKey)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await prisma.staticPage.findUnique({ where: { id: key } });
  return NextResponse.json(page);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key as PageKey)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = parsed.data.content as any;
  const page = await prisma.staticPage.upsert({
    where: { id: key },
    create: { id: key, title: parsed.data.title, content },
    update: { title: parsed.data.title, content },
  });

  return NextResponse.json(page);
}
