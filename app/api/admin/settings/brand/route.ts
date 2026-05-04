import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/blob";
import { writeFaviconsFromImage } from "@/lib/favicon";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  const [uploaded, icons] = await Promise.all([
    uploadImage(file, "brand"),
    writeFaviconsFromImage(file),
  ]);

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteName: "My Blog",
      defaultDisclosure:
        "This post contains affiliate links. If you purchase through these links, I may earn a commission at no additional cost to you.",
      siteLogoUrl: uploaded.url,
      faviconUrl: icons.faviconUrl,
      faviconUpdatedAt: new Date(),
    },
    update: {
      siteLogoUrl: uploaded.url,
      faviconUrl: icons.faviconUrl,
      faviconUpdatedAt: new Date(),
    },
  });

  await prisma.media.create({
    data: {
      filename: uploaded.filename,
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailUrl ?? null,
      fileSize: uploaded.size,
      mimeType: uploaded.mimeType,
      altText: `${settings.siteName} logo`,
    },
  });

  return NextResponse.json({
    siteLogoUrl: settings.siteLogoUrl,
    faviconUrl: settings.faviconUrl,
    faviconUpdatedAt: settings.faviconUpdatedAt,
  });
}
