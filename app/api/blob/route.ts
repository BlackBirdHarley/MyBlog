import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

function blobAccess(): "private" | "public" {
  return process.env.BLOB_ACCESS === "private" ? "private" : "public";
}

function isPrivateStoreAccessError(error: unknown) {
  return error instanceof Error && error.message.includes("Cannot use public access on a private store");
}

async function getBlob(url: string) {
  const access = blobAccess();
  try {
    const blob = await get(url, { access });
    if (blob?.statusCode === 200 || access === "private") return blob;
  } catch (error) {
    if (!isPrivateStoreAccessError(error)) throw error;
  }

  return get(url, { access: "private" });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Blob URL required" }, { status: 400 });

  const blob = await getBlob(url);
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
