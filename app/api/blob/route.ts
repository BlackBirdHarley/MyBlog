import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Blob URL required" }, { status: 400 });

  const blob = await get(url, { access: process.env.BLOB_ACCESS === "private" ? "private" : "public" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Blob not found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": blob.blob.cacheControl || "public, max-age=3600",
      ETag: blob.blob.etag,
    },
  });
}
