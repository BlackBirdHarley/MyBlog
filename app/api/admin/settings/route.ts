import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  siteName: z.string().min(1),
  siteTagline: z.string().optional().nullable(),
  siteDescription: z.string().optional().nullable(),
  siteUrl: z.string().url().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),
  defaultDisclosure: z.string().min(1),
  footerText: z.string().optional().nullable(),
  pinterestUserId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json(settings);
}
