import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
}

// Register a media record after client-side upload to Vercel Blob
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, filename, fileSize, mimeType, altText } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const media = await prisma.media.create({
    data: {
      filename: filename ?? url.split("/").pop() ?? "image",
      url,
      fileSize: fileSize ?? null,
      mimeType: mimeType ?? null,
      altText: altText ?? null,
    },
  });
  return NextResponse.json(media, { status: 201 });
}
