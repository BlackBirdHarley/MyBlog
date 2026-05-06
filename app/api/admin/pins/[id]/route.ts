import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const pinUpdateSchema = z.object({
  boardId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = pinUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pin = await prisma.articlePin.update({
    where: { id },
    data: {
      ...(parsed.data.boardId !== undefined ? { boardId: parsed.data.boardId } : {}),
    },
    include: {
      board: { select: { id: true, name: true } },
      article: { select: { id: true, title: true, slug: true } },
    },
  });

  return NextResponse.json({ pin });
}
