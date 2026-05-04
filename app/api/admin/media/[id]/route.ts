import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const media = await prisma.media.update({
    where: { id },
    data: {
      altText: typeof body.altText === "string" && body.altText.trim() ? body.altText.trim() : null,
      caption: typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null,
    },
  });

  return NextResponse.json(media);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
