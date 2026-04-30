import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const altText = formData.get("altText") as string | null;
  const caption = formData.get("caption") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const uploaded = await uploadImage(file);

  const media = await prisma.media.create({
    data: {
      filename: uploaded.filename,
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailUrl ?? null,
      altText: altText ?? null,
      caption: caption ?? null,
      fileSize: uploaded.size,
      mimeType: uploaded.mimeType,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
