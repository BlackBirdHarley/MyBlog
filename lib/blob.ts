import path from "path";
import fs from "fs/promises";

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

async function uploadLocal(file: File, folder: string): Promise<UploadResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
  const filename = `${Date.now()}-${base}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

async function uploadVercelBlob(file: File, folder: string): Promise<UploadResult> {
  const { put } = await import("@vercel/blob");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
  const filename = `${folder}/${Date.now()}-${base}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return {
    url: blob.url,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

export async function uploadImage(file: File, folder = "media"): Promise<UploadResult> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return uploadVercelBlob(file, folder);
  }
  return uploadLocal(file, folder);
}

export async function deleteBlob(url: string): Promise<void> {
  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    await fs.unlink(filePath).catch(() => {});
    return;
  }
  const { del } = await import("@vercel/blob");
  await del(url);
}
