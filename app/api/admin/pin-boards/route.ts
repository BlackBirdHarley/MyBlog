import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const boardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(120),
  description: z.string().trim().max(500).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await prisma.pinBoard.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { pins: true } } },
  });

  return NextResponse.json({ boards });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = boardSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const board = await prisma.pinBoard.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint")
      ? "A board with this name already exists."
      : "Failed to create board.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
